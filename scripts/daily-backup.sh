#!/bin/bash

# Daily Database Backup Script
# Keeps last 7 backups, removes yesterday's if identical to today's

set -e

# Load environment variables
if [ -f /var/www/boar-park/.env ]; then
    export $(cat /var/www/boar-park/.env | grep -E '^(PGHOST|PGPORT|PGUSER|PGPASSWORD|PGDATABASE)=' | xargs)
fi

# Configuration
BACKUP_DIR="/var/backups/boar-park/daily"
TIMESTAMP=$(date +%Y%m%d)
BACKUP_FILE="${BACKUP_DIR}/daily_backup_${TIMESTAMP}.sql"
LOG_FILE="/var/log/boar-park-backup.log"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting daily backup..."

# Create backup
if PGPASSWORD="$PGPASSWORD" pg_dump \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d "$PGDATABASE" \
    --clean \
    --if-exists \
    --create \
    > "$BACKUP_FILE" 2>/dev/null; then

    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log "✓ Backup created: $BACKUP_FILE ($BACKUP_SIZE)"
else
    log "✗ Backup failed!"
    exit 1
fi

# Compare with yesterday's backup
YESTERDAY=$(date -d "yesterday" +%Y%m%d)
YESTERDAY_FILE="${BACKUP_DIR}/daily_backup_${YESTERDAY}.sql"

if [ -f "$YESTERDAY_FILE" ]; then
    log "Comparing with yesterday's backup..."

    # Compare ignoring timestamps and comments
    if diff -q \
        <(grep -v "^--" "$BACKUP_FILE" | grep -v "^SET" | sort) \
        <(grep -v "^--" "$YESTERDAY_FILE" | grep -v "^SET" | sort) \
        > /dev/null 2>&1; then

        log "⊘ No changes detected, removing yesterday's backup"
        rm "$YESTERDAY_FILE"
    else
        log "✓ Changes detected, keeping both backups"
    fi
fi

# Keep only last 7 backups
log "Cleaning old backups (keeping last 7)..."
ls -t "${BACKUP_DIR}"/daily_backup_*.sql 2>/dev/null | tail -n +8 | while read file; do
    log "Removing old backup: $(basename "$file")"
    rm "$file"
done

# Count remaining backups
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/daily_backup_*.sql 2>/dev/null | wc -l)
log "✓ Daily backup complete. Total backups: $BACKUP_COUNT"
