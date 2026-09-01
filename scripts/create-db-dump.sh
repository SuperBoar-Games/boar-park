#!/bin/bash

# Database Dump Script (Excludes Sensitive User Data)
# This script creates a PostgreSQL dump with schema and data
# but EXCLUDES sensitive tables: users, refresh_tokens, password_resets

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -E '^(PGHOST|PGPORT|PGUSER|PGPASSWORD|PGDATABASE)=' | xargs)
fi

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="bkps/dumps/"
BACKUP_FILE="${BACKUP_DIR}/boar_park_schema_${TIMESTAMP}.sql"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "Creating database dump..."
echo "Database: $PGDATABASE"
echo "Output: $BACKUP_FILE"
echo ""

# Create dump with schema and data, excluding sensitive tables
PGPASSWORD="$PGPASSWORD" pg_dump \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d "$PGDATABASE" \
    --clean \
    --if-exists \
    --create \
    --exclude-table-data=users \
    --exclude-table-data=refresh_tokens \
    --exclude-table-data=password_resets \
    --exclude-table-data=user_game_roles \
    > "$BACKUP_FILE"

# Fix: Add \connect statement after CREATE DATABASE
# pg_dump --create doesn't include this, causing tables to be created in wrong database
sed -i "/^CREATE DATABASE $PGDATABASE/a\\\connect $PGDATABASE" "$BACKUP_FILE"

echo "✓ Database dump created successfully!"
echo ""
echo "File: $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""
echo "Included (schema + data):"
echo "  ✓ games"
echo "  ✓ heroes"
echo "  ✓ movies"
echo "  ✓ cards"
echo "  ✓ tags"
echo "  ✓ card_tags"
echo "  ✓ system_roles"
echo "  ✓ permissions"
echo "  ✓ role_permissions"
echo "  ✓ roles (legacy)"
echo ""
echo "Excluded (schema only, no data):"
echo "  ✗ users"
echo "  ✗ refresh_tokens"
echo "  ✗ password_resets"
echo "  ✗ user_game_roles"
echo ""
echo "Note: You'll need to create admin user manually on VPS"
