# Database Documentation

## Overview

PostgreSQL database with migrations, transactions, and automated backups.

## Schema

### Users & Auth
- **users**: id, username, email, password_hash, status, is_verified, role_id, created_at, updated_at
- **refresh_tokens**: id, user_id, token, expires_at, created_at
- **password_resets**: id, user_id, token, expires_at, created_at

### Games
- **games**: id, slug, name, description, created_at
- **heroes**: id, game_id, name, industry, total_movies, image_url, created_at, updated_at
- **movies**: id, hero_id, title, release_year, is_locked, created_at, updated_at
- **cards**: id, movie_id, image_url, difficulty, user, created_at, updated_at
- **tags**: id, name, game_id, created_at
- **card_tags**: card_id, tag_id

### RBAC System
- **system_roles**: id, name, description, created_at
- **permissions**: id, name, description
- **role_permissions**: role_id, permission_id
- **user_game_roles**: id, user_id, role_id, game_id, created_at
- **roles**: id, game_id, name, description, created_at (legacy)

### Push Notifications
- **push_subscriptions**: id, user_id, endpoint (UNIQUE), p256dh, auth, created_at — browser Web Push subscriptions; stale entries (410/404 from push service) are auto-deleted
- **notifications**: id, user_id, title, body, url, is_read (default false), created_at — in-app notification inbox; created server-side (e.g., on user signup)

## Connection

```env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your-password
PGDATABASE=boar_db
```

## Migrations

Tracked in `schema_migrations` table. Files in `src/db/migrations/`.

```bash
# Run all pending migrations
./scripts/run-migrations.sh
```

Creates `schema_migrations` table if not exists, runs migrations in order, skips executed ones.

| Migration | Description |
|-----------|-------------|
| 0001 | Create push_subscriptions and notifications tables |

> **Note:** Production database was imported from a full dump. Only migrations created after that point need to be applied on production.

## Backups

### Development to VPS (No sensitive data)
```bash
./scripts/create-db-dump.sh
```
Includes: game data, roles, permissions
Excludes: users, tokens, passwords

### Production (Full backup)
```bash
./scripts/backup-db-full.sh
```
Includes: everything

### Restore
```bash
./scripts/import-db-dump.sh backup_file.sql
```

### Auto-backup on deploy
Deployment script creates full backup in `/var/backups/boar-park/` before every deployment.

### Daily automated backups
Setup systemd timer for daily backups (2 AM):
```bash
sudo cp deployment/boar-park-backup.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now boar-park-backup.timer
```

Features: keeps 7 backups, removes yesterday's if no changes.

## Database Utilities

Query helpers are in `src/db/index.ts`:

```typescript
import { query, queryOne, transaction } from './db';

// Query multiple rows
const users = await query('SELECT * FROM users WHERE status = $1', ['active']);

// Query single row
const user = await queryOne('SELECT * FROM users WHERE id = $1', [userId]);

// Transaction
await transaction(async (client) => {
  await client.query('UPDATE users SET status = $1 WHERE id = $2', ['active', userId]);
  await client.query('INSERT INTO logs ...');
});
```

SQL is colocated with its handler in `src/queries/` (e.g., `notifications.queries.ts`, `roles.queries.ts`).

## Quick Commands

```bash
# List tables
psql -d boar_db -c "\dt"

# Count records
psql -d boar_db -c "SELECT COUNT(*) FROM heroes;"

# Verify connection
psql -h localhost -U postgres -d boar_db -c "SELECT 1;"

# Manual backup
pg_dump -h localhost -U postgres -d boar_db --clean --if-exists --create > backup.sql

# Manual restore
psql -h localhost -U postgres -d postgres -f backup.sql
```
