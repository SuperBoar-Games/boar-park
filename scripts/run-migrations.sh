#!/bin/bash

# Migration Runner Script
# Runs all SQL migration files in order from src/db/migrations/

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -E '^(PGHOST|PGPORT|PGUSER|PGPASSWORD|PGDATABASE)=' | xargs)
else
    echo "Error: .env file not found!"
    exit 1
fi

MIGRATIONS_DIR="src/db/migrations"

echo "==================================="
echo "Database Migration Runner"
echo "==================================="
echo ""
echo "Database: $PGDATABASE"
echo "Host: $PGHOST:$PGPORT"
echo "User: $PGUSER"
echo ""

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "⊘ Migrations directory not found: $MIGRATIONS_DIR"
    echo "⊘ No migrations to run"
    exit 0
fi

# Create migrations tracking table if it doesn't exist
PGPASSWORD="$PGPASSWORD" psql \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d "$PGDATABASE" \
    -c "CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_file VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
    );" > /dev/null 2>&1

# Get list of already executed migrations
EXECUTED_MIGRATIONS=$(PGPASSWORD="$PGPASSWORD" psql \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d "$PGDATABASE" \
    -t -c "SELECT migration_file FROM schema_migrations;" 2>/dev/null | tr -d ' ')

# Find all .sql files in migrations directory, sorted by filename
MIGRATION_FILES=$(find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort)

if [ -z "$MIGRATION_FILES" ]; then
    echo "No migration files found in $MIGRATIONS_DIR"
    exit 0
fi

MIGRATIONS_RUN=0
MIGRATIONS_SKIPPED=0

for MIGRATION_FILE in $MIGRATION_FILES; do
    MIGRATION_NAME=$(basename "$MIGRATION_FILE")

    # Check if migration has already been executed
    if echo "$EXECUTED_MIGRATIONS" | grep -q "$MIGRATION_NAME"; then
        echo "⊘ Skipped: $MIGRATION_NAME (already executed)"
        MIGRATIONS_SKIPPED=$((MIGRATIONS_SKIPPED + 1))
        continue
    fi

    echo "→ Running: $MIGRATION_NAME"

    # Run migration
    if PGPASSWORD="$PGPASSWORD" psql \
        -h "$PGHOST" \
        -p "$PGPORT" \
        -U "$PGUSER" \
        -d "$PGDATABASE" \
        -f "$MIGRATION_FILE" > /dev/null 2>&1; then

        # Record successful migration
        PGPASSWORD="$PGPASSWORD" psql \
            -h "$PGHOST" \
            -p "$PGPORT" \
            -U "$PGUSER" \
            -d "$PGDATABASE" \
            -c "INSERT INTO schema_migrations (migration_file) VALUES ('$MIGRATION_NAME');" > /dev/null 2>&1

        echo "✓ Success: $MIGRATION_NAME"
        MIGRATIONS_RUN=$((MIGRATIONS_RUN + 1))
    else
        echo "✗ Failed: $MIGRATION_NAME"
        echo ""
        echo "Migration failed! Rolling back..."
        exit 1
    fi
done

echo ""
echo "==================================="
echo "Migration Summary"
echo "==================================="
echo "Executed: $MIGRATIONS_RUN"
echo "Skipped: $MIGRATIONS_SKIPPED"
echo ""

if [ $MIGRATIONS_RUN -gt 0 ]; then
    echo "✓ All migrations completed successfully!"
else
    echo "⊘ No new migrations to run"
fi
