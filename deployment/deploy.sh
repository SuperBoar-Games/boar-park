#!/bin/bash
set -e

# Boar Park Deployment Script
# Usage: ./deploy.sh [environment] [branch]
# Example: ./deploy.sh production main

ENVIRONMENT=${1:-production}
BRANCH=${2:-main}
DEPLOY_DIR="/var/www/boar-park"
REPO_URL="https://github.com/SuperBoar-Games/boar-park.git"
BACKUP_DIR="/var/backups/boar-park"
SERVICE_NAME="boar-park"
LOG_FILE="/var/log/boar-park-deploy.log"

# Ensure bun is on PATH (for non-interactive SSH sessions via GitHub Actions)
export PATH="/root/.bun/bin:/usr/local/bin:$PATH"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Pre-deployment checks
log "Starting deployment to $ENVIRONMENT environment..."
log "Branch: $BRANCH"

if [ ! -d "$DEPLOY_DIR" ]; then
    error "Deploy directory does not exist: $DEPLOY_DIR"
fi

if [ ! -f "$DEPLOY_DIR/.env" ]; then
    error ".env file not found. Create it before deploying."
fi

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    error "This script must be run as root (use: sudo ./deploy.sh)"
fi

# Stop the service
log "Stopping service..."
systemctl stop "$SERVICE_NAME" || warn "Service was not running"

# Create backups directory
log "Creating backups..."
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Backup database
log "Backing up database..."
cd "$DEPLOY_DIR"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -E '^(PGHOST|PGPORT|PGUSER|PGPASSWORD|PGDATABASE)=' | xargs)

    DB_BACKUP_FILE="$BACKUP_DIR/db-backup-$TIMESTAMP.sql"

    # Create full database backup
    if PGPASSWORD="$PGPASSWORD" pg_dump \
        -h "$PGHOST" \
        -p "$PGPORT" \
        -U "$PGUSER" \
        -d "$PGDATABASE" \
        --clean \
        --if-exists \
        --create \
        > "$DB_BACKUP_FILE" 2>/dev/null; then

        # Fix: Add \connect statement after CREATE DATABASE
        sed -i "/^CREATE DATABASE $PGDATABASE/a\\\connect $PGDATABASE" "$DB_BACKUP_FILE"

        log "Database backup created: $DB_BACKUP_FILE ($(du -h "$DB_BACKUP_FILE" | cut -f1))"
    else
        error "Database backup failed - aborting deployment"
    fi
else
    error ".env file not found - cannot proceed"
fi

# Backup application files
log "Backing up application files..."
BACKUP_FILE="$BACKUP_DIR/files-backup-$TIMESTAMP.tar.gz"
tar -czf "$BACKUP_FILE" -C "$(dirname "$DEPLOY_DIR")" "$(basename "$DEPLOY_DIR")" || warn "File backup failed"
log "File backup created: $BACKUP_FILE"

# Clone or pull repository
cd "$DEPLOY_DIR"

if [ -d ".git" ]; then
    log "Pulling latest changes..."
    git fetch origin || error "Failed to fetch from remote"
    git reset --hard "origin/$BRANCH" || error "Failed to checkout $BRANCH"
else
    log "Cloning repository..."
    cd "$(dirname "$DEPLOY_DIR")"
    git clone -b "$BRANCH" "$REPO_URL" "$(basename "$DEPLOY_DIR")" || error "Failed to clone repository"
    cd "$DEPLOY_DIR"
fi

log "Current commit: $(git rev-parse --short HEAD)"

# Run database migrations BEFORE building
log "Running database migrations..."
if [ -f "$DEPLOY_DIR/scripts/run-migrations.sh" ]; then
    if ! "$DEPLOY_DIR/scripts/run-migrations.sh"; then
        error "Migration failed! Restore backup with: sudo -u postgres psql -f $DB_BACKUP_FILE"
    fi
    log "Migrations completed successfully"
else
    warn "Migration script not found at scripts/run-migrations.sh - skipping migrations"
fi

# Install dependencies
log "Installing dependencies..."
bun install --no-progress || error "Failed to install dependencies"

# Build backend
log "Building backend..."
bun run build || error "Failed to build backend"

# Build frontend with Vite
log "Building frontend..."
bun run build:client || error "Failed to build frontend"

# Ensure media directory exists for card file uploads
log "Ensuring media directory exists..."
mkdir -p "$DEPLOY_DIR/media/talkies/cards"
chown -R boar-park:boar-park "$DEPLOY_DIR/media" || warn "Failed to set media ownership"

# Fix permissions
log "Setting file permissions..."
chown -R boar-park:boar-park "$DEPLOY_DIR" || warn "Failed to set ownership"
chmod +x "$DEPLOY_DIR/dist/index.js" || true

# Start the service
log "Starting service..."
systemctl start "$SERVICE_NAME" || error "Failed to start service"
sleep 2

# Health check
log "Performing health check..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    log "Health check passed ✓"
else
    error "Health check failed (HTTP $HEALTH_CHECK). Check logs: journalctl -u $SERVICE_NAME -n 50"
fi

# Clean up old backups (keep last 10)
log "Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -t db-backup-*.sql 2>/dev/null | tail -n +11 | xargs -r rm -f
ls -t files-backup-*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
log "Backup cleanup complete (keeping last 10)"

log "✅ Deployment completed successfully!"
log "Service status:"
systemctl status "$SERVICE_NAME" --no-pager

# Display recent logs
log "Recent service logs:"
journalctl -u "$SERVICE_NAME" -n 10 --no-pager || true
