# Deploy Status — `slate-theme` branch

Status doc for the pending deploy of the slate theme + audit work. Not deployed yet.

- **Branch:** `slate-theme` (off `feature/vps-postgresql-bun`)
- **Target to merge into:** `feature/vps-postgresql-bun`
- **Commits ahead of base:** 2
  - `8382a7e` — Replace Catppuccin with the slate/gold theme (dark + light)
  - `71f3642` — Audit pass: auth gaps, tag-pairing bug, efficiency, robustness
- **Verified:** run against a Postgres 18 container loaded with the production
  schema dump (8 heroes, 162 cards). Server bundle + client build pass; auth
  matrix, tag pairing, upload rejection, and both admin pages (slate light/dark)
  checked with no console errors.
- **Not run:** strict `tsc --noEmit` (no local `typescript` package in the audit
  env). Run it before merge — see checklist.

---

## What changed

### Theme (commit `8382a7e`) — visual only, no behaviour change
- Catppuccin's four themes removed. Two themes now: **slate-dark** (default) and
  **slate-light**, defining the full `--ctp-*` token set, so every component
  picks up the palette unchanged.
- A saved legacy theme value migrates automatically (`latte` → slate-light,
  dark variants → slate-dark). No user action needed.
- Semantic colors (status badges, mobile alerts, role chips) that used to be
  hardcoded hex now go through tokens, so they read correctly in light mode.
- PWA `theme_color` updated to the slate base.

### Audit (commit `71f3642`) — security, correctness, robustness
Security-relevant, review before deploy:
- **`/api/talkies/*` now requires auth** (was fully public). Any game role to
  read; editor or global admin to write. The audit username is taken from the
  JWT, not the request body.
- `isAdmin` requires the **global** admin role (was matching game-scoped admins).
- Server **refuses to boot in production** if `JWT_ACCESS_SECRET` /
  `JWT_REFRESH_SECRET` are unset — see Prerequisites.
- Password reset/set and user-disable now revoke the user's refresh tokens.
- Upload hardening: image type validated by extension; `.html/.svg/.js/.xml`
  rejected. `GET /api/cards/:id/files` now requires auth.

Correctness / robustness:
- Card tag id↔name pairing bug fixed (JSON aggregation).
- `getGameIdFromSlug` bigint→number coercion (was denying game-scoped users).
- SPA deep-link fallback in the Bun static handler.
- Batched tag inserts, global request error handler, expired-token cleanup,
  SSE reconnect on clean stream end.

### Files touched
- Theme: `src/client/styles/theme.css`, `ThemeProvider.tsx`, `ThemeSelector.tsx`,
  `AdminLayout.tsx`, three component/page CSS files, `public/manifest.json`.
- Audit: `src/index.ts`, `src/auth/{jwt,middleware,game-permissions}.ts`,
  `src/handlers/{auth,admin,files}.handler.ts`,
  `src/handlers/talkies/cards.handler.ts`, `src/queries/talkies/cards.queries.ts`,
  `src/client/hooks/useSSE.ts`.

---

## Prerequisites before deploy

1. **JWT secrets must be set** in the production environment. The server now
   throws on boot if either is missing (previously it silently used a public
   default string — forgeable tokens). Confirm both are present and are strong
   random values:
   ```
   JWT_ACCESS_SECRET=<random>
   JWT_REFRESH_SECRET=<random>
   ```
   If these are being set for the first time, all existing sessions become
   invalid — users log in again. Expected, one-time.

2. **No new database migrations.** Schema is unchanged; `src/db/migrations/`
   still ends at `0002_card_files.sql`. Nothing to run.

3. **No new dependencies.** `package.json` / `bun.lock` untouched by this branch.

---

## Deploy steps

Adjust to match `deployment/deploy.sh` and the systemd units already in use;
this is the shape, not a replacement for them.

```bash
# 1. Merge
git checkout feature/vps-postgresql-bun
git merge --no-ff slate-theme

# 2. On the VPS: pull, install (no-op if lockfile unchanged), build client
git pull
bun install
bun run build          # or: npx vite build  → dist/client

# 3. Typecheck (see checklist — do this before restarting)
bunx tsc@5 --noEmit

# 4. Restart the service
sudo systemctl restart boar-park
sudo systemctl status boar-park --no-pager
curl -fsS https://<domain>/health
```

nginx already handles SPA fallback (`try_files … /index.html`) and `/media`,
so no nginx change is needed. The new in-app SPA fallback is a redundancy for
direct-to-Bun access.

---

## Post-deploy verification checklist

- [ ] `bunx tsc@5 --noEmit` passes (the one check not run during the audit).
- [ ] `GET /health` returns `{"status":"ok"}`.
- [ ] Log in as an admin and a game-scoped (viewer/editor) user.
- [ ] **Theme:** toggle Dark/Light in the user menu; reload — choice persists.
      A user with an old Catppuccin setting lands on a slate theme, not broken.
- [ ] **Talkies auth:** an unauthenticated `curl` to `/api/talkies/heroes`
      returns 401; a viewer can read but gets 403 on a write.
- [ ] **Admin gate:** a game-scoped user gets 403 on `/api/admin/users`.
- [ ] **Tags:** open a card with multiple tags — names match their chips
      (this was the pairing bug).
- [ ] **User management** page loads and lists users with role chips, both
      themes.
- [ ] **Realtime:** edit a card in one tab, confirm another tab updates; then
      restart the service and confirm the SSE stream reconnects.
- [ ] **Uploads:** a `.png` type-2 upload succeeds; renaming a script to
      `.html` is rejected.

## Rollback

Revert to the previous `feature/vps-postgresql-bun` commit and restart:
```bash
git checkout feature/vps-postgresql-bun
git reset --hard <pre-merge-sha>   # note this SHA before merging
sudo systemctl restart boar-park
```
No schema changes were made, so a code rollback is sufficient — no DB
down-migration needed. (Sessions invalidated by the JWT-secret or
revoke-on-disable changes stay invalidated; users just log in again.)
