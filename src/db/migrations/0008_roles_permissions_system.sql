-- Migration: Add role-based permissions system
-- Date: 2026-02-16

-- =====================================================
-- 1. Create permissions table
-- =====================================================
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'users:create', 'games:read'
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. Create system_roles table (renamed to avoid conflict with existing 'roles' table)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. Create role_permissions junction table
-- =====================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES system_roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- =====================================================
-- 4. Add role_id to users table
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES system_roles(id) ON DELETE SET NULL;

-- =====================================================
-- 5. Seed permissions (grouped by feature area)
-- =====================================================
INSERT INTO permissions (name, description) VALUES
    -- User Management (users, roles, permissions grouped together)
    ('user_management:create', 'Create users, roles, and permissions'),
    ('user_management:read', 'View users, roles, and permissions'),
    ('user_management:update', 'Update users, roles, and permissions'),
    ('user_management:delete', 'Delete users, roles, and permissions'),

    -- Games (top-level game management)
    ('games:create', 'Create new games'),
    ('games:read', 'View games'),
    ('games:update', 'Update games'),
    ('games:delete', 'Delete games'),

    -- Talkies (heroes, movies, cards, tags grouped together)
    ('talkies:create', 'Create heroes, movies, cards, and tags'),
    ('talkies:read', 'View heroes, movies, cards, and tags'),
    ('talkies:update', 'Update heroes, movies, cards, and tags'),
    ('talkies:delete', 'Delete heroes, movies, cards, and tags'),

    -- Talkies sub-resources
    ('heroes:create', 'Create new heroes'),
    ('heroes:read', 'View heroes'),
    ('heroes:update', 'Update heroes'),
    ('heroes:delete', 'Delete heroes'),

    ('movies:create', 'Create new movies'),
    ('movies:read', 'View movies'),
    ('movies:update', 'Update movies'),
    ('movies:delete', 'Delete movies'),

    ('cards:create', 'Create new cards'),
    ('cards:read', 'View cards'),
    ('cards:update', 'Update cards'),
    ('cards:delete', 'Delete cards'),

    ('tags:create', 'Create new tags'),
    ('tags:read', 'View tags'),
    ('tags:update', 'Update tags'),
    ('tags:delete', 'Delete tags'),

    -- User Management sub-resources
    ('users:create', 'Create new users'),
    ('users:read', 'View user information'),
    ('users:update', 'Update user information'),
    ('users:delete', 'Delete users'),

    ('roles:create', 'Create new roles'),
    ('roles:read', 'View roles'),
    ('roles:update', 'Update roles'),
    ('roles:delete', 'Delete roles'),

    ('permissions:create', 'Create new permissions'),
    ('permissions:read', 'View permissions'),
    ('permissions:update', 'Update permissions'),
    ('permissions:delete', 'Delete permissions')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 6. Seed system roles
-- =====================================================
INSERT INTO system_roles (name, description) VALUES
    ('admin', 'Full system access - all permissions'),
    ('editor', 'Can manage talkies game content'),
    ('viewer', 'Read-only access to all content')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 7. Assign permissions to admin role (all permissions)
-- =====================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM system_roles WHERE name = 'admin'),
    id
FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- 8. Assign permissions to editor role (talkies content only, no user management)
-- =====================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM system_roles WHERE name = 'editor'),
    id
FROM permissions
WHERE name IN (
    'games:read',
    'talkies:create', 'talkies:read', 'talkies:update', 'talkies:delete'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- 9. Assign permissions to viewer role (read-only)
-- =====================================================
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM system_roles WHERE name = 'viewer'),
    id
FROM permissions
WHERE name LIKE '%:read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- 10. Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

-- =====================================================
-- 11. Create view for easy permission checking
-- =====================================================
CREATE OR REPLACE VIEW user_permissions AS
SELECT
    u.id AS user_id,
    u.username,
    u.email,
    sr.id AS role_id,
    sr.name AS role_name,
    p.id AS permission_id,
    p.name AS permission_name
FROM users u
LEFT JOIN system_roles sr ON u.role_id = sr.id
LEFT JOIN role_permissions rp ON sr.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id;

-- =====================================================
-- 12. Comments for documentation
-- =====================================================
COMMENT ON TABLE permissions IS 'Resource-based permissions (e.g., users:create, games:read)';
COMMENT ON TABLE system_roles IS 'System roles that users can be assigned to';
COMMENT ON TABLE role_permissions IS 'Many-to-many mapping between roles and permissions';
COMMENT ON COLUMN users.role_id IS 'User''s assigned role (NULL = no role assigned)';
COMMENT ON VIEW user_permissions IS 'Denormalized view of user permissions for easy querying';
