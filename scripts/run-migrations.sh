#!/bin/bash
#
# Migration runner — applies every .sql file in src/db/migrations in filename
# order, exactly once, recording what ran in schema_migrations.
#
# Each migration and the row that records it are applied in ONE transaction
# with ON_ERROR_STOP=1, so a migration either lands completely and is recorded,
# or leaves no trace and the deploy aborts. There is no state where the table
# claims a migration ran but the schema does not have it.

set -euo pipefail

MIGRATIONS_DIR="src/db/migrations"

# Load PG* connection settings. `set -a` exports everything the file defines;
# sourcing (rather than `export $(cat .env | xargs)`) keeps values with spaces,
# quotes or '#' intact — a password containing any of those broke the old form.
if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
else
    echo "Error: .env file not found!" >&2
    exit 1
fi

: "${PGHOST:?PGHOST not set}"
: "${PGPORT:?PGPORT not set}"
: "${PGUSER:?PGUSER not set}"
: "${PGDATABASE:?PGDATABASE not set}"
export PGPASSWORD

# ON_ERROR_STOP is what makes psql exit non-zero on a failed statement. Without
# it psql reports success even when every statement in the file errored.
psql_run() {
    psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
        -v ON_ERROR_STOP=1 --no-psqlrc "$@"
}

echo "==================================="
echo "Database Migration Runner"
echo "==================================="
echo "Database: $PGDATABASE"
echo "Host:     $PGHOST:$PGPORT"
echo "User:     $PGUSER"
echo ""

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "Migrations directory not found: $MIGRATIONS_DIR — nothing to do"
    exit 0
fi

psql_run -q -c "CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_file VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW()
);"

MIGRATIONS_RUN=0
MIGRATIONS_SKIPPED=0
FOUND_ANY=0

# Null-delimited so filenames with spaces survive; sort -z for filename order.
while IFS= read -r -d '' MIGRATION_FILE; do
    FOUND_ANY=1
    MIGRATION_NAME=$(basename "$MIGRATION_FILE")

    # Exact match via the database, not a substring grep over a text blob:
    # '0001_a.sql' must not be considered already-run because '0001_a.sql.bak'
    # is in the table.
    ALREADY=$(psql_run -tAc \
        "SELECT 1 FROM schema_migrations WHERE migration_file = '$MIGRATION_NAME';")

    if [ "$ALREADY" = "1" ]; then
        echo "Skipped:  $MIGRATION_NAME (already executed)"
        MIGRATIONS_SKIPPED=$((MIGRATIONS_SKIPPED + 1))
        continue
    fi

    echo "Running:  $MIGRATION_NAME"

    # The migration body and its bookkeeping row go in as a single transaction.
    # psql errors are shown, not sent to /dev/null — when a deploy aborts here
    # the reason needs to be in the deploy log.
    if {
        cat "$MIGRATION_FILE"
        printf "\nINSERT INTO schema_migrations (migration_file) VALUES ('%s');\n" \
            "$MIGRATION_NAME"
    } | psql_run --single-transaction -q -f -; then
        echo "Success:  $MIGRATION_NAME"
        MIGRATIONS_RUN=$((MIGRATIONS_RUN + 1))
    else
        echo "" >&2
        echo "FAILED:   $MIGRATION_NAME" >&2
        echo "  The transaction was rolled back; the schema is unchanged and" >&2
        echo "  this migration is NOT recorded. Fix it and redeploy." >&2
        exit 1
    fi
done < <(find "$MIGRATIONS_DIR" -name "*.sql" -type f -print0 | sort -z)

if [ "$FOUND_ANY" -eq 0 ]; then
    echo "No migration files found in $MIGRATIONS_DIR"
    exit 0
fi

echo ""
echo "==================================="
echo "Executed: $MIGRATIONS_RUN   Skipped: $MIGRATIONS_SKIPPED"
echo "==================================="
