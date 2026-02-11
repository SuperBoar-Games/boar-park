#!/bin/bash
set -e

# Boar Park Deployment Script
# Usage: ./deploy.sh [environment] [branch]
# Example: ./deploy.sh production main

ENVIRONMENT=${1:-production}
BRANCH=${2:-main}
DEPLOY_DIR="/var/www/boar-park"
REPO_URL="https://github.com/your-username/boar-park.git"  # Update this
BACKUP_DIR="/var/backups/boar-park"
SERVICE_NAME="boar-park"
LOG_FILE="/var/log/boar-park-deploy.log"

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

# Create backup
log "Creating backup..."
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" -C "$(dirname "$DEPLOY_DIR")" "$(basename "$DEPLOY_DIR")" || warn "Backup failed"
log "Backup created: $BACKUP_FILE"

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

# Install dependencies
log "Installing dependencies..."
bun install --no-progress || error "Failed to install dependencies"

# Build backend
log "Building backend..."
bun build src/index.ts --outdir dist || error "Failed to build backend"

# Build frontend
log "Building frontend..."
bun build src/client/main.tsx --outdir dist/client --minify --sourcemap || error "Failed to build frontend"

# Copy frontend to serving directory
log "Preparing static files..."
cp index.html dist/client/index.html || true
cp -r public/* dist/client/ || true
# Fix PWA paths for production (dev uses ./public/ prefix, prod serves from root)
sed -i 's|"\./public/|"/|g' dist/client/index.html || true

# Fix permissions
log "Setting file permissions..."
chown -R boar-park:boar-park "$DEPLOY_DIR" || warn "Failed to set ownership"
chmod +x "$DEPLOY_DIR/dist/index.js" || true

# Run database migrations if migrations script exists
if [ -f "$DEPLOY_DIR/db/migrate.ts" ] || [ -f "$DEPLOY_DIR/scripts/migrate.ts" ]; then
    log "Running database migrations..."
    bun run scripts/migrate.ts || warn "Migration script not found or failed"
fi

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

log "✅ Deployment completed successfully!"
log "Service status:"
systemctl status "$SERVICE_NAME" --no-pager

# Display recent logs
log "Recent service logs:"
journalctl -u "$SERVICE_NAME" -n 10 --no-pager || true
