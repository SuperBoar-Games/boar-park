#!/bin/bash
#
# Boar Park deployment.
#   Usage: sudo ./deploy.sh [environment] [branch]
#   e.g.   sudo ./deploy.sh production main
#
# Ordering matters here. The service keeps running through fetch, install and
# build, so anything that fails in that stretch aborts with production still up
# and untouched. Only once a working build exists on disk do we stop the
# service, migrate, and start again — downtime is that window, not the whole
# deploy. A failed health check rolls the code back to the previous commit.

set -euo pipefail

ENVIRONMENT=${1:-production}
BRANCH=${2:-main}
DEPLOY_DIR="/var/www/boar-park"
REPO_URL="https://github.com/SuperBoar-Games/boar-park.git"
BACKUP_DIR="/var/backups/boar-park"
SERVICE_NAME="boar-park"
SERVICE_USER="boar-park"
LOG_FILE="/var/log/boar-park-deploy.log"
NGINX_SITE="/etc/nginx/sites-available/boar-park"
HEALTH_URL="http://127.0.0.1:3000/health"

# bun is not on PATH for a non-interactive SSH session from GitHub Actions
export PATH="/usr/local/bin:/root/.bun/bin:$PATH"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

log()  { echo -e "${GREEN}[$(date +'%F %T')]${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[$(date +'%F %T')] WARNING:${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[$(date +'%F %T')] ERROR:${NC} $1" | tee -a "$LOG_FILE"; exit 1; }

# ---------------------------------------------------------------- preflight --
log "Deploying $BRANCH to $ENVIRONMENT"

[ "$EUID" -eq 0 ] || error "Must run as root (use sudo)"
[ -d "$DEPLOY_DIR" ] || error "Deploy directory does not exist: $DEPLOY_DIR"
[ -f "$DEPLOY_DIR/.env" ] || error ".env not found in $DEPLOY_DIR — create it before deploying"
command -v bun >/dev/null || error "bun not found on PATH"
command -v pg_dump >/dev/null || error "pg_dump not found on PATH"

cd "$DEPLOY_DIR"

# Sourcing preserves values containing spaces, quotes or '#'; the old
# `export $(cat .env | xargs)` mangled them.
set -a
# shellcheck disable=SC1091
source .env
set +a
: "${PGHOST:?}" "${PGPORT:?}" "${PGUSER:?}" "${PGDATABASE:?}"
export PGPASSWORD

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# ------------------------------------------------------------------ backups --
# Taken before anything changes, while the service is still serving.
log "Backing up database..."
DB_BACKUP_FILE="$BACKUP_DIR/db-backup-$TIMESTAMP.sql"
if ! pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
        --clean --if-exists --create > "$DB_BACKUP_FILE"; then
    rm -f "$DB_BACKUP_FILE"
    error "Database backup failed — aborting before any change is made"
fi
# pg_dump --create omits the \connect, so a restore would run the rest against
# the wrong database.
sed -i "/^CREATE DATABASE $PGDATABASE/a\\\\connect $PGDATABASE" "$DB_BACKUP_FILE"
log "Database backup: $DB_BACKUP_FILE ($(du -h "$DB_BACKUP_FILE" | cut -f1))"

log "Backing up application files..."
FILE_BACKUP="$BACKUP_DIR/files-backup-$TIMESTAMP.tar.gz"
tar -czf "$FILE_BACKUP" --exclude=node_modules --exclude=.git \
    -C "$(dirname "$DEPLOY_DIR")" "$(basename "$DEPLOY_DIR")" 2>/dev/null \
    || warn "File backup failed"

# ------------------------------------------------------------------- source --
if [ ! -d ".git" ]; then
    error "$DEPLOY_DIR is not a git checkout — clone it first with: git clone $REPO_URL $DEPLOY_DIR"
fi

PREV_COMMIT=$(git rev-parse HEAD)
log "Current commit: $(git rev-parse --short HEAD)"

# A clone made with `git clone -b <branch>` gets a single-branch refspec, so
# fetch dies with "couldn't find remote ref" the moment that branch is deleted
# upstream. Normalise to the full refspec so the checkout below can reach any
# branch. (This is what took production down on 2026-09-01.)
git config --unset-all remote.origin.fetch 2>/dev/null || true
git config --add remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"

log "Fetching..."
git fetch --prune origin || error "Failed to fetch from remote"
git rev-parse --verify "origin/$BRANCH" >/dev/null 2>&1 \
    || error "origin/$BRANCH does not exist on the remote"

log "Checking out $BRANCH..."
git checkout -B "$BRANCH" "origin/$BRANCH" || error "Failed to check out $BRANCH"
NEW_COMMIT=$(git rev-parse HEAD)
log "New commit: $(git rev-parse --short HEAD)"

# --------------------------------------------------------- install / build ---
# Still serving old traffic. Anything failing from here to the end of the build
# aborts with production untouched.
log "Installing dependencies..."
bun install --no-progress || error "bun install failed — production unchanged"

log "Building backend..."
bun run build || error "Backend build failed — production unchanged"

log "Building frontend..."
bun run build:client || error "Frontend build failed — production unchanged"

# -------------------------------------------------------------------- nginx --
# The site config lives in the repo; without this step it silently drifts from
# what is committed. /media/ went six months serving files publicly because the
# `internal` directive was committed but never deployed.
if [ -f "$DEPLOY_DIR/deployment/nginx.conf" ] && [ -f "$NGINX_SITE" ]; then
    if ! cmp -s "$DEPLOY_DIR/deployment/nginx.conf" "$NGINX_SITE"; then
        log "nginx config changed — applying"
        cp "$NGINX_SITE" "$BACKUP_DIR/nginx-boar-park-$TIMESTAMP.conf"
        cp "$DEPLOY_DIR/deployment/nginx.conf" "$NGINX_SITE"
        if nginx -t 2>&1 | tee -a "$LOG_FILE"; then
            systemctl reload nginx && log "nginx reloaded"
        else
            cp "$BACKUP_DIR/nginx-boar-park-$TIMESTAMP.conf" "$NGINX_SITE"
            error "nginx config test failed — reverted, production unchanged"
        fi
    else
        log "nginx config unchanged"
    fi
fi

# --------------------------------------------------- downtime window opens ---
log "Stopping service..."
systemctl stop "$SERVICE_NAME" || warn "Service was not running"

log "Running database migrations..."
if [ -x "$DEPLOY_DIR/scripts/run-migrations.sh" ]; then
    if ! "$DEPLOY_DIR/scripts/run-migrations.sh" 2>&1 | tee -a "$LOG_FILE"; then
        systemctl start "$SERVICE_NAME" || true
        error "Migration failed. Schema is unchanged (migrations are transactional).
       Old code restarted. To restore the database anyway:
         sudo -u postgres psql -f $DB_BACKUP_FILE"
    fi
else
    warn "scripts/run-migrations.sh not found or not executable — skipping migrations"
fi

log "Setting permissions..."
mkdir -p "$DEPLOY_DIR/media/talkies/cards"
chown -R "$SERVICE_USER:$SERVICE_USER" "$DEPLOY_DIR" || warn "Failed to set ownership"

log "Starting service..."
systemctl start "$SERVICE_NAME" || error "Failed to start service"

# ------------------------------------------------------------ health check ---
log "Health check..."
HEALTHY=0
for i in $(seq 1 10); do
    if [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$HEALTH_URL")" = "200" ]; then
        HEALTHY=1
        log "Health check passed (attempt $i)"
        break
    fi
    sleep 2
done

if [ "$HEALTHY" -ne 1 ]; then
    warn "Health check failed — rolling back to $(git rev-parse --short "$PREV_COMMIT")"
    systemctl stop "$SERVICE_NAME" || true
    git reset --hard "$PREV_COMMIT" || warn "git rollback failed"
    bun install --no-progress || warn "rollback install failed"
    bun run build && bun run build:client || warn "rollback build failed"
    chown -R "$SERVICE_USER:$SERVICE_USER" "$DEPLOY_DIR" || true
    systemctl start "$SERVICE_NAME" || true
    sleep 3
    if [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$HEALTH_URL")" = "200" ]; then
        error "Deploy of $NEW_COMMIT failed health check. Rolled back to $PREV_COMMIT and the site is up.
       Any migrations that ran are NOT rolled back — check them against the old code."
    fi
    error "Deploy failed AND rollback failed. Site is DOWN.
       Logs: journalctl -u $SERVICE_NAME -n 50
       DB backup: $DB_BACKUP_FILE"
fi

# ------------------------------------------------------------------ cleanup --
log "Pruning old backups (keeping 10)..."
cd "$BACKUP_DIR"
ls -t db-backup-*.sql 2>/dev/null       | tail -n +11 | xargs -r rm -f
ls -t files-backup-*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
ls -t nginx-boar-park-*.conf 2>/dev/null | tail -n +11 | xargs -r rm -f

log "Deployed $(cd "$DEPLOY_DIR" && git rev-parse --short HEAD) to $ENVIRONMENT"
