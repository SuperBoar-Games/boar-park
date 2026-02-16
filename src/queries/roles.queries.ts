// SQL queries for role-based permissions system

// =====================================================
// PERMISSION QUERIES
// =====================================================

export const GET_ALL_PERMISSIONS_QUERY = `
  SELECT id, name, description, created_at
  FROM permissions
  ORDER BY name ASC
`;

export const GET_PERMISSION_BY_ID_QUERY = `
  SELECT id, name, description, created_at
  FROM permissions
  WHERE id = $1
`;

export const GET_PERMISSION_BY_NAME_QUERY = `
  SELECT id, name, description, created_at
  FROM permissions
  WHERE name = $1
`;

export const CREATE_PERMISSION_QUERY = `
  INSERT INTO permissions (name, description)
  VALUES ($1, $2)
  RETURNING id, name, description, created_at
`;

export const UPDATE_PERMISSION_QUERY = `
  UPDATE permissions
  SET name = COALESCE($2, name),
      description = COALESCE($3, description)
  WHERE id = $1
  RETURNING id, name, description, created_at
`;

export const DELETE_PERMISSION_QUERY = `
  DELETE FROM permissions
  WHERE id = $1
  RETURNING id
`;

// =====================================================
// ROLE QUERIES
// =====================================================

export const GET_ALL_ROLES_QUERY = `
  SELECT id, name, description, created_at, updated_at
  FROM system_roles
  ORDER BY name ASC
`;

export const GET_ROLE_BY_ID_QUERY = `
  SELECT id, name, description, created_at, updated_at
  FROM system_roles
  WHERE id = $1
`;

export const GET_ROLE_BY_NAME_QUERY = `
  SELECT id, name, description, created_at, updated_at
  FROM system_roles
  WHERE name = $1
`;

export const CREATE_ROLE_QUERY = `
  INSERT INTO system_roles (name, description)
  VALUES ($1, $2)
  RETURNING id, name, description, created_at, updated_at
`;

export const UPDATE_ROLE_QUERY = `
  UPDATE system_roles
  SET name = COALESCE($2, name),
      description = COALESCE($3, description),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING id, name, description, created_at, updated_at
`;

export const DELETE_ROLE_QUERY = `
  DELETE FROM system_roles
  WHERE id = $1
  RETURNING id
`;

// =====================================================
// ROLE-PERMISSION MAPPING QUERIES
// =====================================================

export const GET_ROLE_PERMISSIONS_QUERY = `
  SELECT p.id, p.name, p.description, p.created_at
  FROM permissions p
  INNER JOIN role_permissions rp ON p.id = rp.permission_id
  WHERE rp.role_id = $1
  ORDER BY p.name ASC
`;

export const GET_ROLE_WITH_PERMISSIONS_QUERY = `
  SELECT
    sr.id,
    sr.name,
    sr.description,
    sr.created_at,
    sr.updated_at,
    COALESCE(
      json_agg(
        json_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'created_at', p.created_at
        ) ORDER BY p.name
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'
    ) AS permissions
  FROM system_roles sr
  LEFT JOIN role_permissions rp ON sr.id = rp.role_id
  LEFT JOIN permissions p ON rp.permission_id = p.id
  WHERE sr.id = $1
  GROUP BY sr.id, sr.name, sr.description, sr.created_at, sr.updated_at
`;

export const GET_ALL_ROLES_WITH_PERMISSIONS_QUERY = `
  SELECT
    sr.id,
    sr.name,
    sr.description,
    sr.created_at,
    sr.updated_at,
    COALESCE(
      json_agg(
        json_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'created_at', p.created_at
        ) ORDER BY p.name
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'
    ) AS permissions
  FROM system_roles sr
  LEFT JOIN role_permissions rp ON sr.id = rp.role_id
  LEFT JOIN permissions p ON rp.permission_id = p.id
  GROUP BY sr.id, sr.name, sr.description, sr.created_at, sr.updated_at
  ORDER BY sr.name ASC
`;

export const ASSIGN_PERMISSION_TO_ROLE_QUERY = `
  INSERT INTO role_permissions (role_id, permission_id)
  VALUES ($1, $2)
  ON CONFLICT (role_id, permission_id) DO NOTHING
  RETURNING id, role_id, permission_id, created_at
`;

export const REMOVE_PERMISSION_FROM_ROLE_QUERY = `
  DELETE FROM role_permissions
  WHERE role_id = $1 AND permission_id = $2
  RETURNING id
`;

export const CLEAR_ROLE_PERMISSIONS_QUERY = `
  DELETE FROM role_permissions
  WHERE role_id = $1
  RETURNING id
`;

// =====================================================
// USER PERMISSION QUERIES
// =====================================================

export const GET_USER_PERMISSIONS_QUERY = `
  SELECT DISTINCT p.name
  FROM users u
  INNER JOIN system_roles sr ON u.role_id = sr.id
  INNER JOIN role_permissions rp ON sr.id = rp.role_id
  INNER JOIN permissions p ON rp.permission_id = p.id
  WHERE u.id = $1
`;

export const CHECK_USER_PERMISSION_QUERY = `
  SELECT EXISTS (
    SELECT 1
    FROM users u
    INNER JOIN system_roles sr ON u.role_id = sr.id
    INNER JOIN role_permissions rp ON sr.id = rp.role_id
    INNER JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = $1 AND p.name = $2
  ) AS has_permission
`;

export const GET_USER_WITH_ROLE_QUERY = `
  SELECT
    u.id,
    u.username,
    u.email,
    u.is_verified,
    u.status,
    u.role_id,
    sr.name AS role_name,
    u.created_at,
    u.updated_at
  FROM users u
  LEFT JOIN system_roles sr ON u.role_id = sr.id
  WHERE u.id = $1
`;

export const GET_ALL_USERS_WITH_ROLES_QUERY = `
  SELECT
    u.id,
    u.username,
    u.email,
    u.is_verified,
    u.status,
    u.role_id,
    sr.name AS role_name,
    u.created_at,
    u.updated_at
  FROM users u
  LEFT JOIN system_roles sr ON u.role_id = sr.id
  ORDER BY u.created_at DESC
`;

export const UPDATE_USER_ROLE_QUERY = `
  UPDATE users
  SET role_id = $2,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING id, username, email, role_id
`;
