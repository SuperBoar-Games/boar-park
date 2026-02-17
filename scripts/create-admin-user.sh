#!/bin/bash

# Create Admin User Script
# Interactive script to create an admin user for Boar Park

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================="
echo "Boar Park - Create Admin User"
echo "===================================${NC}"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -E '^(PGHOST|PGPORT|PGUSER|PGPASSWORD|PGDATABASE)=' | xargs)
else
    echo -e "${YELLOW}Warning: .env file not found, using defaults${NC}"
    PGHOST=${PGHOST:-localhost}
    PGPORT=${PGPORT:-5432}
    PGUSER=${PGUSER:-postgres}
    PGDATABASE=${PGDATABASE:-boar_db}
fi

# Prompt for admin details
echo "Enter admin user details:"
echo ""

read -p "Username (default: admin): " USERNAME
USERNAME=${USERNAME:-admin}

read -p "Email (default: admin@boarpark.com): " EMAIL
EMAIL=${EMAIL:-admin@boarpark.com}

# Password input (hidden)
while true; do
    read -s -p "Password (min 8 chars): " PASSWORD
    echo ""
    if [ ${#PASSWORD} -lt 8 ]; then
        echo "Password must be at least 8 characters. Try again."
        continue
    fi
    read -s -p "Confirm password: " PASSWORD_CONFIRM
    echo ""
    if [ "$PASSWORD" = "$PASSWORD_CONFIRM" ]; then
        break
    else
        echo "Passwords don't match. Try again."
    fi
done

echo ""
echo "Creating admin user..."

# Hash password using Node.js/Bun
if command -v bun &> /dev/null; then
    PASSWORD_HASH=$(bun -e "console.log(await require('argon2').hash('$PASSWORD'))")
elif command -v node &> /dev/null; then
    PASSWORD_HASH=$(node -e "const argon2 = require('argon2'); argon2.hash('$PASSWORD').then(console.log)")
else
    echo "Error: Neither bun nor node found. Install one to hash passwords."
    exit 1
fi

# Insert admin user into database
PGPASSWORD="$PGPASSWORD" psql \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d "$PGDATABASE" \
    << EOF
-- Insert admin user
INSERT INTO users (username, email, password_hash, status, is_verified, created_at, updated_at)
VALUES ('$USERNAME', '$EMAIL', '$PASSWORD_HASH', 'active', true, NOW(), NOW())
ON CONFLICT (username) DO UPDATE
SET email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    status = 'active',
    is_verified = true,
    updated_at = NOW();

-- Get user ID
DO \$\$
DECLARE
    user_id INTEGER;
    admin_role_id INTEGER;
BEGIN
    SELECT id INTO user_id FROM users WHERE username = '$USERNAME';
    SELECT id INTO admin_role_id FROM system_roles WHERE name = 'admin' LIMIT 1;

    -- Assign admin role if system_roles table exists
    IF admin_role_id IS NOT NULL THEN
        INSERT INTO user_game_roles (user_id, role_id, game_id)
        VALUES (user_id, admin_role_id, NULL)
        ON CONFLICT DO NOTHING;
    END IF;
END \$\$;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Admin user created successfully!${NC}"
    echo ""
    echo "Login credentials:"
    echo "  Username: $USERNAME"
    echo "  Email: $EMAIL"
    echo "  Password: (as entered)"
    echo ""
    echo "You can now login at: http://localhost:3000/login"
else
    echo -e "${YELLOW}✗ Failed to create admin user${NC}"
    exit 1
fi
