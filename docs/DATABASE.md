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

Location: `src/db/utils.ts`

```typescript
// Query multiple rows
const users = await query('SELECT * FROM users WHERE status = $1', ['active']);

// Query single row
const user = await queryOne('SELECT * FROM users WHERE id = $1', [userId]);

// Transaction
await transaction(async () => {
  await query('UPDATE users SET status = $1 WHERE id = $2', ['active', userId]);
  await query('INSERT INTO logs ...');
});

// Native Bun binding
const results = await exec('SELECT * FROM users WHERE email = ?', email);
```

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
