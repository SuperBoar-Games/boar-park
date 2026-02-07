# Database Documentation

## Overview

Boar Park uses **PostgreSQL** as its primary database. The database is managed through migrations and includes support for complex queries, transactions, and data seeding.

## Database Structure

### Core Tables

#### Users
- `id` (integer, primary key)
- `username` (string, unique)
- `email` (string, unique)
- `password_hash` (string)
- `status` (enum: 'pending', 'active', 'disabled')
- `is_verified` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### Games
- `id` (integer, primary key)
- `slug` (string, unique)
- `name` (string)
- `description` (text)
- `created_at` (timestamp)

#### Heroes/Cards
- `id` (integer, primary key)
- `game_id` (integer, foreign key)
- `name` (string)
- `rarity` (string)
- `created_at` (timestamp)

#### Movies
- `id` (integer, primary key)
- `game_id` (integer, foreign key)
- `title` (string)
- `description` (text)
- `is_locked` (boolean)
- `created_at` (timestamp)

#### Roles
- `id` (integer, primary key)
- `name` (string, unique)
- `description` (text)
- `created_at` (timestamp)

#### User Roles (Junction Table)
- `id` (integer, primary key)
- `user_id` (integer, foreign key)
- `role_id` (integer, foreign key)
- `game_id` (integer, foreign key, nullable)
- `created_at` (timestamp)

## Migrations

Migrations are located in `/db/migrations/` and follow a numbered sequence for versioning.

### Migration Files

- **0001_initial_schema.sql** - Initial database schema
- **0001_initial_schema_with_data.sql** - Initial schema with seed data
- **0003_remove_status_column.sql** - Removed deprecated status column
- **0004_create_stats_materialized_views.sql** - Created materialized views for statistics
- **0005_create_stats_triggers.sql** - Created triggers for stats updates
- **0006_auth_schema.sql** - Authentication schema with user roles

### Running Migrations

Migrations are managed by the application startup process. To manually run a migration:

```bash
# Using Bun
bun run db/migrations/[migration_file].sql
```

## Database Utilities

Database utilities are located in `/db/utils.ts` and provide helper functions for common operations.

### Available Functions

#### `query<T>(sqlString: string, params: any[]): Promise<T[]>`
Execute a raw SQL query and return results as an array.

```typescript
import { query } from '../db/utils';

const users = await query('SELECT * FROM users WHERE status = $1', ['active']);
```

#### `queryOne<T>(sqlString: string, params: any[]): Promise<T | null>`
Execute a query and return the first result or null.

```typescript
const user = await queryOne('SELECT * FROM users WHERE id = $1', [userId]);
```

#### `transaction<T>(callback: () => Promise<T>): Promise<T>`
Execute operations within a database transaction.

```typescript
const result = await transaction(async () => {
    // Multiple queries within a transaction
    await query('UPDATE users SET status = $1 WHERE id = $2', ['active', userId]);
    await query('INSERT INTO logs ...');
    return result;
});
```

#### `exec<T>(sqlString: string, ...params: any[]): Promise<T[]>`
Execute a query using Bun's native parameter binding (more efficient for complex queries).

```typescript
const results = await exec('SELECT * FROM users WHERE email = ?', userEmail);
```

## Schema Files

The `/db/schema/` directory contains schema definitions:

- **schema.sql** - Current database schema definition

## Seeds

Database seeds are located in `/db/seeds/` for initial data population.

## Connection Configuration

Database connection is managed through environment variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/boar_park_db
```


