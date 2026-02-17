#!/bin/bash

# Database Import Script for VPS
# This script imports a database dump into a fresh PostgreSQL database

set -e

# Check if dump file is provided
if [ -z "$1" ]; then
    echo "Usage: ./scripts/import-db-dump.sh <dump-file.sql>"
    echo ""
    echo "Example:"
    echo "  ./scripts/import-db-dump.sh bkps/deploy_bkps/boar_park_schema_20240217_192208.sql"
    exit 1
fi

DUMP_FILE="$1"

# Check if file exists
if [ ! -f "$DUMP_FILE" ]; then
    echo "Error: File not found: $DUMP_FILE"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -E '^(PGHOST|PGPORT|PGUSER|PGPASSWORD|PGDATABASE)=' | xargs)
else
    echo "Error: .env file not found!"
    echo "Please create .env file with database credentials"
    exit 1
fi

echo "==================================="
echo "Database Import Script"
echo "==================================="
echo ""
echo "Database: $PGDATABASE"
echo "Host: $PGHOST:$PGPORT"
echo "User: $PGUSER"
echo "Dump file: $DUMP_FILE"
echo "File size: $(du -h "$DUMP_FILE" | cut -f1)"
echo ""

# Warning
read -p "⚠️  This will DROP and RECREATE the database. Continue? [y/N] " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Import cancelled."
    exit 1
fi

echo ""
echo "Importing database..."

# Import the dump
PGPASSWORD="$PGPASSWORD" psql \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d postgres \
    -f "$DUMP_FILE"

echo ""
echo "✓ Database imported successfully!"
echo ""
echo "Next steps:"
echo "  1. Create admin user:"
echo "     bun run src/scripts/create-admin.ts"
echo ""
echo "  2. Verify data:"
echo "     psql -d $PGDATABASE -c 'SELECT COUNT(*) FROM heroes;'"
echo "     psql -d $PGDATABASE -c 'SELECT COUNT(*) FROM movies;'"
echo "     psql -d $PGDATABASE -c 'SELECT COUNT(*) FROM cards;'"
echo ""
echo "  3. Start application:"
echo "     bun run dev"
