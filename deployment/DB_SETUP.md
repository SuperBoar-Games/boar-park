# Database Setup Guide

Quick reference for setting up the PostgreSQL database on VPS.

## Prerequisites
- PostgreSQL installed
- Bun runtime installed
- Dump file: `src/db/dumps/0001-boar_db_dump.sql`

## Complete Setup

### 1. Drop and Create Database
```bash
# Drop existing database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS boardb;"

# Create fresh database
sudo -u postgres psql -c "CREATE DATABASE boardb;"
```

### 2. Import Dump File
```bash
# Import schema and data
sudo -u postgres psql -d boardb -f src/db/dumps/0001-boar_db_dump.sql
```

### 3. Set Database Password
```bash
# Set postgres user password (use your actual password)
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'YourSecurePassword123';"
```

### 4. Create Admin User
```bash
# Generate password hash
HASH=$(bun -e "console.log(await require('argon2').hash('AdminPassword123'))")

# Create admin user with role
sudo -u postgres psql -d boardb << EOF
-- Insert admin user
INSERT INTO users (username, email, password_hash, status, is_verified, created_at, updated_at)
VALUES ('admin', 'admin@boarpark.com', '$HASH', 'active', true, NOW(), NOW())
RETURNING id;

-- Assign admin role (assuming user_id = 1)
INSERT INTO user_game_roles (user_id, game_id, role_id)
SELECT 1, NULL, id FROM roles WHERE name = 'admin';
EOF
```

### 5. Verify Setup
```bash
# Check users and roles
sudo -u postgres psql -d boardb -c "
SELECT u.id, u.username, u.email, u.status, r.name as role_name
FROM users u
JOIN user_game_roles ugr ON u.id = ugr.user_id
JOIN roles r ON ugr.role_id = r.id;
"

# List all tables
sudo -u postgres psql -d boardb -c "\dt"
```

### 6. Update .env File
```bash
# Edit environment file
nano /var/www/boar-park/.env
```

Ensure these variables are set:
```env
PGUSER=postgres
PGPASSWORD=YourSecurePassword123
PGHOST=localhost
PGPORT=5432
PGDATABASE=boardb
```

### 7. Restart Application
```bash
# Restart service
systemctl restart boar-park

# Check logs
journalctl -u boar-park -f
```

## Login Credentials
- **Username:** `admin`
- **Password:** `AdminPassword123`

## Quick Database Checks

### Check database connection
```bash
sudo -u postgres psql -d boardb -c "SELECT version();"
```

### List all users
```bash
sudo -u postgres psql -d boardb -c "SELECT id, username, email, status FROM users;"
```

## Troubleshooting

### Password authentication failed
```bash
# Reset postgres password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'NewPassword';"

# Update .env file with new password
nano /var/www/boar-park/.env
```
