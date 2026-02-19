# Boar Park VPS Deployment Guide

Complete step-by-step guide to deploy Boar Park to a production VPS.

## Prerequisites

- Ubuntu 20.04+ or Debian 11+ VPS
- Domain name pointing to your VPS
- Root or sudo access
- Git installed on VPS

## Overview

This guide covers:
1. VPS user and directory setup
2. Installing Bun, PostgreSQL, and Nginx
3. Configuring PostgreSQL database
4. Cloning and building the application
5. Setting up systemd service
6. Configuring Nginx reverse proxy
7. Installing SSL certificates
8. Firewall configuration
9. Deployment automation
10. GitHub Actions CI/CD (auto-deploy on push to main)

---

## Step 1: VPS Setup

SSH into your VPS as root and create the application user and directories.

```bash
# SSH into VPS as root
ssh root@your-vps-ip

# Create application user
useradd -m -s /bin/bash boar-park

# Create deployment directory
mkdir -p /var/www/boar-park
chown -R boar-park:boar-park /var/www/boar-park
chmod 755 /var/www/boar-park

# Create backup and log directories
mkdir -p /var/backups/boar-park /var/log/boar-park
chown boar-park:boar-park /var/backups/boar-park /var/log/boar-park
```

---

## Step 2: Install Bun & Dependencies

Install Bun, PostgreSQL, Nginx, and SSL certificate tools.

```bash
# Update system packages
apt update && apt upgrade -y

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH for root
export PATH="/root/.bun/bin:$PATH"

# Verify Bun installation
bun --version

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install certbot for SSL certificates
apt install -y certbot python3-certbot-nginx
```

---

## Step 3: Configure PostgreSQL

Create database and user for the application.

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE boar_park_prod;
CREATE USER boar_park_user WITH PASSWORD 'your-strong-password-here';
ALTER ROLE boar_park_user SET client_encoding TO 'utf8';
ALTER ROLE boar_park_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE boar_park_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE boar_park_prod TO boar_park_user;

# Exit PostgreSQL
\q
```

**Test the connection:**
```bash
psql -h localhost -U boar_park_user -d boar_park_prod -c "SELECT 1;"
```

---

## Step 4: Clone & Setup Application

Clone the repository and configure environment variables.

```bash
# Switch to boar-park user
sudo -u boar-park -H bash

# Navigate to deploy directory
cd /var/www/boar-park

# Clone the repository
git clone -b main https://github.com/your-username/boar-park.git .

# List files to verify
ls -la
```

### Create `.env` file

```bash
# Create .env file
nano .env
```

Add the following content (replace placeholders with actual values):

```env
# PostgreSQL Connection
PGHOST=localhost
PGPORT=5432
PGUSER=boar_park_user
PGPASSWORD=your-strong-password-here
PGDATABASE=boar_park_prod

# Server Configuration
PORT=3000
NODE_ENV=production

# Database Pool Configuration
DB_POOL_MAX=20

# JWT Secrets - GENERATE STRONG RANDOM STRINGS
# Generate with: openssl rand -base64 32
JWT_ACCESS_SECRET=generate-strong-random-string-here-min-32-chars
JWT_REFRESH_SECRET=generate-different-strong-random-string-min-32-chars

# SMTP Configuration for Password Reset Emails
SMTP_HOST=smtp.your-mail-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-specific-password
FROM_EMAIL=noreply@your-domain.com

# Application URL (used for password reset email links)
APP_URL=https://your-domain.com

# CORS Configuration (comma-separated list of allowed origins)
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com
```

**Generate JWT secrets:**
```bash
openssl rand -base64 32
# Copy and paste into JWT_ACCESS_SECRET
openssl rand -base64 32
# Copy and paste into JWT_REFRESH_SECRET
```

Press `Ctrl+X`, then `Y`, then `Enter` to save the file.

---

## Step 5: Install Dependencies & Build

Install npm packages and build the application.

```bash
# Still as boar-park user in /var/www/boar-park
cd /var/www/boar-park

# Install dependencies
bun install

# Build backend
bun run build

# Build frontend
bun run build:client

# Verify build
ls -la dist/
```

---

## Step 6: Setup Systemd Service

Create and enable the systemd service for automatic startup and management.

```bash
# Exit boar-park user shell
exit

# Copy systemd service file
sudo cp /var/www/boar-park/deployment/boar-park.service /etc/systemd/system/

# Verify the service file
sudo cat /etc/systemd/system/boar-park.service

# Reload systemd
sudo systemctl daemon-reload

# Enable service (auto-start on reboot)
sudo systemctl enable boar-park

# Start the service
sudo systemctl start boar-park

# Check status
sudo systemctl status boar-park

# View recent logs
sudo journalctl -u boar-park -n 20 --no-pager
```

**Troubleshooting:**
```bash
# If service fails, check detailed logs
sudo journalctl -u boar-park -xe

# Restart service
sudo systemctl restart boar-park

# View service output
sudo systemctl status boar-park -l
```

---

## Step 7: Setup Nginx Reverse Proxy

Configure Nginx to forward requests to the Bun application.

```bash
# Copy nginx configuration
sudo cp /var/www/boar-park/deployment/nginx.conf /etc/nginx/sites-available/boar-park

# Edit the nginx config with your domain
sudo nano /etc/nginx/sites-available/boar-park
```

**Replace these placeholders:**
- `your-domain.com` → your actual domain
- `www.your-domain.com` → www version of your domain

```bash
# Enable the site by creating a symlink
sudo ln -s /etc/nginx/sites-available/boar-park /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Enable nginx auto-start
sudo systemctl enable nginx

# Restart nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

---

## Step 8: Setup SSL Certificate with Let's Encrypt

Obtain and configure HTTPS certificates for superboar.com.

**Prerequisites:** Ensure DNS records for superboar.com and www.superboar.com are pointing to your VPS IP (62.72.31.96).

```bash
# Get SSL certificate (automatically updates Nginx config)
sudo certbot --nginx -d superboar.com -d www.superboar.com

# Follow the prompts:
# - Enter your email address
# - Agree to Let's Encrypt Terms of Service
# - Choose whether to redirect HTTP to HTTPS (recommended: 2 for redirect)

# Verify certificate was created
sudo ls -la /etc/letsencrypt/live/superboar.com/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Setup auto-renewal (certbot automatically creates a systemd timer)
sudo certbot renew --dry-run

# Verify auto-renewal timer is active
sudo systemctl status certbot.timer
```

---

## Step 9: Configure Firewall

Set up UFW firewall to allow only necessary ports.

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (port 22)
sudo ufw allow 22/tcp

# Allow HTTP (port 80)
sudo ufw allow 80/tcp

# Allow HTTPS (port 443)
sudo ufw allow 443/tcp

# Check firewall status
sudo ufw status

# View detailed status
sudo ufw status verbose
```

---

## Step 10: Verify Deployment

Test that everything is working correctly.

```bash
# Check application is running
curl http://localhost:3000/health

# Check Nginx is proxying correctly
curl https://your-domain.com/health

# Check service status
sudo systemctl status boar-park

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL connection
sudo -u postgres psql -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"

# View application logs
sudo journalctl -u boar-park -f
```

---

## Step 11: Initial Database Setup

### Option A: Fresh Database (No Data)

If starting fresh without existing data:

```bash
# As boar-park user
cd /var/www/boar-park

# Run migrations
./scripts/run-migrations.sh

# Create admin user
./scripts/create-admin-user.sh
```

### Option B: Import from Development

If migrating data from development to VPS:

**On Development Machine:**
```bash
# Create database dump (excludes sensitive user data)
./scripts/create-db-dump.sh

# Upload to VPS
scp bkps/deploy_bkps/boar_park_schema_*.sql user@vps:/var/www/boar-park/
```

**On VPS:**
```bash
# Navigate to app directory
cd /var/www/boar-park

# Import the dump (uses sudo to run as postgres superuser)
# Script will prompt for confirmation before dropping/recreating database
sudo ./scripts/import-db-dump.sh bkps/deploy_bkps/boar_park_schema_20260217_192208.sql

# Switch to boar-park user for remaining commands
sudo -u boar-park -H bash

# Create admin user (since user data was excluded)
./scripts/create-admin-user.sh

# Verify data
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c 'SELECT COUNT(*) FROM heroes;'
PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c 'SELECT COUNT(*) FROM movies;'
```

---

## Step 12: Setup Automated Deployments

The deployment script automatically creates backups, runs migrations, and updates the application.

### Features:
✓ **Automatic database backup** before deployment
✓ **Migration safety** - aborts deployment if migrations fail
✓ **Automatic rollback** instructions if something goes wrong
✓ **Old backup cleanup** - keeps last 10 backups

```bash
# Make deploy script and migration script executable
sudo chmod +x /var/www/boar-park/deployment/deploy.sh
sudo chmod +x /var/www/boar-park/scripts/run-migrations.sh

# Future deployments (from any directory):
sudo /var/www/boar-park/deployment/deploy.sh production main

# Or add an alias to ~/.bashrc for convenience:
echo "alias boar-deploy='sudo /var/www/boar-park/deployment/deploy.sh'" | sudo tee -a /root/.bashrc
source ~/.bashrc

# Then deploy with:
sudo boar-deploy
```

### What the deployment script does:

1. **Creates timestamped database backup** in `/var/backups/boar-park/`
2. **Backs up application files** (tar.gz)
3. **Runs pending migrations** - aborts if any fail
4. **Pulls latest code** from git
5. **Installs dependencies** with bun
6. **Builds backend** and **frontend**
7. **Restarts systemd service**
8. **Performs health check**
9. **Cleans up old backups** (keeps last 10)

### If deployment fails:

The script will show restoration instructions:
```bash
# Restore database backup
PGPASSWORD="$PGPASSWORD" psql -h localhost -U boar_park_user -d postgres -f /var/backups/boar-park/db-backup-TIMESTAMP.sql
```

---

## Ongoing Maintenance

### Database Backups

#### Automated Daily Backups (Recommended)

Setup systemd timer for daily backups at 2 AM:

```bash
# Copy service files
sudo cp /var/www/boar-park/deployment/boar-park-backup.service /etc/systemd/system/
sudo cp /var/www/boar-park/deployment/boar-park-backup.timer /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start timer
sudo systemctl enable boar-park-backup.timer
sudo systemctl start boar-park-backup.timer

# Check timer status
sudo systemctl status boar-park-backup.timer
sudo systemctl list-timers boar-park-backup.timer
```

**Features:**
- Runs daily at 2:00 AM
- Keeps last 7 backups
- Compares with yesterday's backup
- Removes yesterday's if identical (no changes)
- Stores in `/var/backups/boar-park/daily/`

**Test backup manually:**
```bash
sudo systemctl start boar-park-backup.service
sudo journalctl -u boar-park-backup.service -n 20
```

**View backup logs:**
```bash
sudo tail -f /var/log/boar-park-backup.log
```

#### Manual Backups

```bash
# Full backup (includes all data)
cd /var/www/boar-park
./scripts/backup-db-full.sh

# Dev backup (excludes sensitive data)
./scripts/create-db-dump.sh
```

#### Backup Locations

- **Daily automated**: `/var/backups/boar-park/daily/daily_backup_YYYYMMDD.sql`
- **Deployment**: `/var/backups/boar-park/db-backup-TIMESTAMP.sql`
- **Manual**: `bkps/deploy_bkps/full_backup_TIMESTAMP.sql`

### View Application Logs

```bash
# Real-time logs
sudo journalctl -u boar-park -f

# Last 50 lines
sudo journalctl -u boar-park -n 50

# Since last hour
sudo journalctl -u boar-park --since "1 hour ago"

# Errors only
sudo journalctl -u boar-park -p err
```

### Monitor Application Health

```bash
# Check if service is running
sudo systemctl is-active boar-park

# Check application endpoint
curl -s https://your-domain.com/health | jq .

# Monitor system resources
top
# or
htop
```

### Update Application

```bash
# Pull latest code, rebuild, and restart
sudo /var/www/boar-park/deployment/deploy.sh production main

# Or manually:
cd /var/www/boar-park
sudo git pull origin main
sudo bun install
sudo bun run build
sudo bun run build:client
sudo systemctl restart boar-park
```

---

## Troubleshooting

### Service won't start

```bash
# Check service logs
sudo journalctl -u boar-park -xe

# Verify .env file exists and has correct permissions
ls -la /var/www/boar-park/.env

# Test database connection
sudo -u boar-park psql -h localhost -U boar_park_user -d boar_park_prod -c "SELECT 1;"

# Check if port 3000 is already in use
sudo lsof -i :3000
```

### Database connection errors

```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Test connection directly
psql -h localhost -U boar_park_user -d boar_park_prod

# Check logs
sudo -u postgres journalctl -xe
```

### Nginx not working

```bash
# Test configuration
sudo nginx -t

# Check if Nginx is running
sudo systemctl status nginx

# View Nginx error log
sudo tail -f /var/log/nginx/boar-park-error.log

# Check if backend is running
curl http://localhost:3000/health
```

### SSL certificate issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew --force-renewal

# Check certificate validity
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Security Checklist

- [ ] Changed all default passwords
- [ ] Generated strong JWT secrets (32+ chars)
- [ ] Configured SMTP credentials correctly
- [ ] Set `NODE_ENV=production` in .env
- [ ] Firewall is configured and enabled
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] SSL certificate installed
- [ ] Regular backups configured
- [ ] Log monitoring in place
- [ ] Database user has limited permissions
- [ ] APP_URL in .env matches domain

---

## Performance Tips

1. **Database optimization:** Add indexes to frequently queried columns
2. **Gzip compression:** Already configured in Nginx
3. **Caching:** Configure Redis if needed for sessions
4. **Database pooling:** Adjust `DB_POOL_MAX` based on load
5. **Monitor logs:** Check for N+1 queries or slow queries

---

## Step 10: GitHub Actions CI/CD

Auto-deploy to the VPS on every push or merged PR to `main`.

### How it works

The workflow at `.github/workflows/deploy.yml` SSHes into the VPS and runs `sudo /var/www/boar-park/deployment/deploy.sh` which:
1. Backs up the database
2. Pulls latest code from `main`
3. Runs any new migrations
4. Installs dependencies & rebuilds
5. Restarts the systemd service
6. Runs a health check

### 1. Create a dedicated SSH key for GitHub Actions

Run this **on your local machine** (not the VPS):

```bash
ssh-keygen -t ed25519 -C "github-actions-boar-park" -f ~/.ssh/github_actions_boar_park -N ""
```

This creates:
- `~/.ssh/github_actions_boar_park` — private key (goes into GitHub secrets)
- `~/.ssh/github_actions_boar_park.pub` — public key (goes onto VPS)

### 2. Add the public key to the VPS

```bash
# Copy the public key content
cat ~/.ssh/github_actions_boar_park.pub

# SSH into VPS and add it
ssh root@your-vps-ip
echo "PASTE_PUBLIC_KEY_HERE" >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
```

### 3. Allow deploy.sh to run via sudo without a password

On the VPS, add a sudoers rule so the SSH user can run the deploy script:

```bash
# On VPS as root:
echo 'root ALL=(ALL) NOPASSWD: /var/www/boar-park/deployment/deploy.sh' > /etc/sudoers.d/boar-park-deploy
chmod 440 /etc/sudoers.d/boar-park-deploy
```

> If you SSH in as a non-root user (e.g. `deploy`), replace `root` with that username.

### 4. Add GitHub Secrets

In your GitHub repo → **Settings → Secrets and variables → Actions**, add:

| Secret name | Value |
|-------------|-------|
| `VPS_HOST` | Your VPS IP or hostname (e.g. `62.72.31.96`) |
| `VPS_USER` | SSH user (e.g. `root`) |
| `VPS_SSH_KEY` | Full contents of `~/.ssh/github_actions_boar_park` (private key) |
| `VPS_PORT` | SSH port, usually `22` (optional) |

### 5. Add a GitHub Environment (optional but recommended)

In **Settings → Environments**, create a `production` environment. You can add:
- **Required reviewers** — manual approval before deploy
- **Wait timer** — delay after merge before deploying

The workflow references `environment: production` — if this environment doesn't exist in GitHub, it still works fine, just without protection rules.

### 6. Verify

Push a commit to `main` (or merge a PR) and watch the **Actions** tab in GitHub. You'll see the deploy workflow run. Logs stream live from the VPS.

```bash
# To watch VPS logs during deploy:
sudo tail -f /var/log/boar-park-deploy.log
```

---

## Support & Further Help

For issues or questions:
- Check application logs: `sudo journalctl -u boar-park -f`
- Check Nginx logs: `sudo tail -f /var/log/nginx/boar-park-error.log`
- Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/*.log`
- Verify all services are running: `sudo systemctl status boar-park nginx postgresql`
