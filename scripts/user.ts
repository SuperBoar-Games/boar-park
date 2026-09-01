#!/usr/bin/env bun
/**
 * User admin CLI.
 *
 * Replaces create-admin-user.sh, which shelled out to `psql` (not installed on
 * every machine — the app talks to Postgres over Bun's client, not the CLI) and
 * interpolated the password straight into a `bun -e` string, so any quote in it
 * broke the command. This imports the application's own hashPassword and sql
 * client instead, which means the argon2 parameters and connection settings can
 * never drift from what the running server expects.
 *
 *   bun run user list
 *   bun run user create <username> <email> [--role admin] [--game talkies] [--password X]
 *   bun run user password <username> [--password X]
 *
 * Omit --password and a strong one is generated and printed once.
 */

import { sql } from 'bun';
import { hashPassword } from '../src/auth/password';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';

const die = (msg: string): never => {
    console.error(`${RED}✗${RESET} ${msg}`);
    process.exit(1);
};

/** Parse `--flag value` pairs, leaving positional arguments behind. */
function parseArgs(argv: string[]) {
    const flags: Record<string, string> = {};
    const positional: string[] = [];
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const next = argv[i + 1];
            if (next && !next.startsWith('--')) {
                flags[key] = next;
                i++;
            } else {
                flags[key] = 'true';
            }
        } else {
            positional.push(arg);
        }
    }
    return { flags, positional };
}

/** URL-safe, no ambiguous characters, ~128 bits of entropy. */
function generatePassword(): string {
    const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.getRandomValues(new Uint8Array(22));
    return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

/**
 * Mutating a production database from a shell script is exactly how a stray
 * command becomes an incident, so it has to be asked for explicitly. This is a
 * guard rather than a block — bootstrapping the first admin on a new server is
 * a legitimate use (see docs/DEPLOYMENT_GUIDE.md).
 */
function guardProduction(flags: Record<string, string>) {
    if (process.env.NODE_ENV === 'production' && !flags.yes) {
        die(
            `NODE_ENV=production. Re-run with ${BOLD}--yes${RESET} if you really mean to ` +
            `change users on the production database (${process.env.PGDATABASE}).`,
        );
    }
}

async function resolveRole(name: string) {
    const rows = await sql`SELECT id, name FROM system_roles WHERE lower(name) = lower(${name})`;
    if (rows.length === 0) {
        const all = await sql`SELECT name FROM system_roles ORDER BY id`;
        die(`No role "${name}". Available: ${all.map((r: any) => r.name).join(', ')}`);
    }
    return rows[0];
}

async function resolveGame(slug: string) {
    const rows = await sql`SELECT id, slug FROM games WHERE slug = ${slug}`;
    if (rows.length === 0) {
        const all = await sql`SELECT slug FROM games ORDER BY id`;
        die(`No game "${slug}". Available: ${all.map((g: any) => g.slug).join(', ')}`);
    }
    return rows[0];
}

async function list() {
    const rows = await sql`
        SELECT u.id, u.username, u.email, u.status, u.is_verified,
               COALESCE(string_agg(
                   r.name || COALESCE(' (' || g.slug || ')', ''), ', '
                   ORDER BY r.name
               ), '—') AS roles
        FROM users u
        LEFT JOIN user_game_roles ugr ON ugr.user_id = u.id
        LEFT JOIN system_roles r ON r.id = ugr.role_id
        LEFT JOIN games g ON g.id = ugr.game_id
        GROUP BY u.id
        ORDER BY u.id`;

    if (rows.length === 0) {
        console.log(`${DIM}No users yet. Create one with:${RESET}`);
        console.log(`  bun run user create admin admin@example.com --role admin`);
        return;
    }

    const w = (s: string, n: number) => String(s).padEnd(n).slice(0, n);
    console.log(`${BOLD}${w('ID', 5)}${w('USERNAME', 20)}${w('EMAIL', 30)}${w('STATUS', 10)}ROLES${RESET}`);
    for (const u of rows as any[]) {
        const status = u.status === 'active' ? `${GREEN}${w(u.status, 10)}${RESET}`
            : `${YELLOW}${w(u.status, 10)}${RESET}`;
        console.log(`${w(String(u.id), 5)}${w(u.username, 20)}${w(u.email, 30)}${status}${u.roles}`);
    }
}

async function create(positional: string[], flags: Record<string, string>) {
    const [username, email] = positional;
    if (!username || !email) {
        die('Usage: bun run user create <username> <email> [--role admin] [--game talkies]');
    }

    const existing = await sql`
        SELECT username, email FROM users
        WHERE lower(username) = lower(${username}) OR lower(email) = lower(${email})`;
    if (existing.length > 0) {
        const clash = existing[0] as any;
        die(
            clash.username.toLowerCase() === username.toLowerCase()
                ? `Username "${username}" is taken. To reset its password: bun run user password ${username}`
                : `Email "${email}" already belongs to "${clash.username}".`,
        );
    }

    const role = await resolveRole(flags.role || 'admin');
    // Only admin is global; every other role is scoped to a game, and the app's
    // permission checks assume that scoping exists.
    let gameId: number | null = null;
    if (role.name.toLowerCase() !== 'admin') {
        if (!flags.game) {
            die(`Role "${role.name}" is game-scoped. Pass --game <slug>, e.g. --game talkies`);
        }
        gameId = (await resolveGame(flags.game)).id;
    } else if (flags.game) {
        console.log(`${YELLOW}!${RESET} admin is global — ignoring --game ${flags.game}`);
    }

    const password = flags.password || generatePassword();
    const generated = !flags.password;
    const passwordHash = await hashPassword(password);

    const [user] = await sql`
        INSERT INTO users (username, email, password_hash, status, is_verified)
        VALUES (${username}, ${email}, ${passwordHash}, 'active', true)
        RETURNING id`;

    await sql`
        INSERT INTO user_game_roles (user_id, role_id, game_id)
        VALUES (${user.id}, ${role.id}, ${gameId})
        ON CONFLICT DO NOTHING`;

    console.log(`${GREEN}✓${RESET} Created ${BOLD}${username}${RESET} (${email}) as ${role.name}${gameId ? ` on ${flags.game}` : ''}`);
    reportPassword(password, generated);
}

async function setPassword(positional: string[], flags: Record<string, string>) {
    const [username] = positional;
    if (!username) die('Usage: bun run user password <username> [--password X]');

    const found = await sql`
        SELECT id, username FROM users WHERE lower(username) = lower(${username})`;
    if (found.length === 0) die(`No user "${username}". Run: bun run user list`);

    const password = flags.password || generatePassword();
    const generated = !flags.password;
    const passwordHash = await hashPassword(password);

    // status/is_verified too: a dev account is useless if it can still be
    // sitting in `pending` and blocked at login.
    await sql`
        UPDATE users
        SET password_hash = ${passwordHash}, status = 'active',
            is_verified = true, updated_at = NOW()
        WHERE id = ${(found[0] as any).id}`;

    console.log(`${GREEN}✓${RESET} Password updated for ${BOLD}${(found[0] as any).username}${RESET}`);
    reportPassword(password, generated);
}

function reportPassword(password: string, generated: boolean) {
    if (generated) {
        console.log(`\n  ${BOLD}Password:${RESET} ${password}`);
        console.log(`  ${DIM}Generated — shown once, not stored anywhere in plain text.${RESET}\n`);
    } else {
        console.log(`  ${DIM}Password set from --password.${RESET}\n`);
    }
}

function usage() {
    console.log(`
${BOLD}User admin${RESET}  ${DIM}(reads PG* connection settings from .env)${RESET}

  ${BOLD}bun run user list${RESET}
  ${BOLD}bun run user create${RESET} <username> <email> [--role admin] [--game talkies] [--password X]
  ${BOLD}bun run user password${RESET} <username> [--password X]

${DIM}Omit --password and a strong one is generated and printed once.
Roles other than admin are scoped to a game and need --game.
Against NODE_ENV=production, mutations require --yes.${RESET}
`);
}

const [command, ...rest] = process.argv.slice(2);
const { flags, positional } = parseArgs(rest);

try {
    switch (command) {
        case 'list':
            await list();
            break;
        case 'create':
            guardProduction(flags);
            await create(positional, flags);
            break;
        case 'password':
            guardProduction(flags);
            await setPassword(positional, flags);
            break;
        default:
            usage();
            if (command) die(`Unknown command "${command}"`);
    }
} catch (err) {
    die(err instanceof Error ? err.message : String(err));
}

process.exit(0);
