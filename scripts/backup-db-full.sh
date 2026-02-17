#!/bin/bash

# Full Database Backup Script (ALL DATA)
# This script creates a complete PostgreSQL dump including all sensitive data
# Use this for deployment backups to prevent data loss

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -E '^(PGHOST|PGPORT|PGUSER|PGPASSWORD|PGDATABASE)=' | xargs)
fi

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="bkps/deploy_bkps"
BACKUP_FILE="${BACKUP_DIR}/full_backup_${TIMESTAMP}.sql"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "Creating full database backup..."
echo "Database: $PGDATABASE"
echo "Output: $BACKUP_FILE"
echo ""

# Create complete dump with ALL data
PGPASSWORD="$PGPASSWORD" pg_dump \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d "$PGDATABASE" \
    --clean \
    --if-exists \
    --create \
    > "$BACKUP_FILE"

echo "✓ Full backup created successfully!"
echo ""
echo "File: $BACKUP_FILE"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""
echo "This backup includes ALL data:"
echo "  ✓ All game data (heroes, movies, cards, tags)"
echo "  ✓ All user accounts and credentials"
echo "  ✓ All tokens and sessions"
echo "  ✓ All roles and permissions"
echo ""
echo "To restore:"
echo "  PGPASSWORD=\"\$PGPASSWORD\" psql -h \$PGHOST -U \$PGUSER -d postgres -f $BACKUP_FILE"
