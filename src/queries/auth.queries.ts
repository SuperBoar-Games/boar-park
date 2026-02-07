// User queries

export const CREATE_USER_QUERY = `
    INSERT INTO users (username, email, password_hash, status, is_verified)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, username, email, status, is_verified, created_at
`;

export const GET_USER_BY_EMAIL_QUERY = `
    SELECT id, username, email, password_hash, status, is_verified, created_at, updated_at
    FROM users
    WHERE email = $1
`;

export const GET_USER_BY_USERNAME_QUERY = `
    SELECT id, username, email, password_hash, status, is_verified, created_at, updated_at
    FROM users
    WHERE username = $1
`;

export const GET_USER_BY_ID_QUERY = `
    SELECT id, username, email, password_hash, status, is_verified, created_at, updated_at
    FROM users
    WHERE id = $1
`;

export const GET_USER_WITH_ROLES_QUERY = `
    SELECT
        u.id,
        u.username,
        u.email,
        u.status,
        u.is_verified,
        COALESCE(
            json_agg(
                json_build_object(
                    'gameId', ugr.game_id,
                    'gameName', g.name,
                    'roleId', r.id,
                    'roleName', r.name
                )
            ) FILTER (WHERE ugr.id IS NOT NULL),
            '[]'
        ) as roles
    FROM users u
    LEFT JOIN user_game_roles ugr ON u.id = ugr.user_id
    LEFT JOIN roles r ON ugr.role_id = r.id
    LEFT JOIN games g ON ugr.game_id = g.id
    WHERE u.id = $1
    GROUP BY u.id
`;

export const UPDATE_USER_STATUS_QUERY = `
    UPDATE users
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, username, email, status, is_verified
`;

export const UPDATE_USER_PASSWORD_QUERY = `
    UPDATE users
    SET password_hash = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, username, email
`;

export const UPDATE_USER_EMAIL_QUERY = `
    UPDATE users
    SET email = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, username, email
`;

export const UPDATE_USER_USERNAME_QUERY = `
    UPDATE users
    SET username = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING id, username, email
`;

export const CHECK_EMAIL_EXISTS_QUERY = `
    SELECT COUNT(*) as count FROM users WHERE email = $1
`;

export const CHECK_USERNAME_EXISTS_QUERY = `
    SELECT COUNT(*) as count FROM users WHERE username = $1
`;

// Password reset queries

export const CREATE_PASSWORD_RESET_QUERY = `
    INSERT INTO password_resets (user_id, token, expires_at)
    VALUES ($1, $2, $3)
    RETURNING id, token, expires_at
`;

export const GET_PASSWORD_RESET_QUERY = `
    SELECT id, user_id, token, expires_at, used
    FROM password_resets
    WHERE token = $1 AND used = false AND expires_at > NOW()
`;

export const MARK_PASSWORD_RESET_USED_QUERY = `
    UPDATE password_resets
    SET used = true
    WHERE token = $1
`;

export const DELETE_USER_PASSWORD_RESETS_QUERY = `
    DELETE FROM password_resets WHERE user_id = $1
`;

// Role queries

export const GET_ALL_ROLES_QUERY = `
    SELECT id, name FROM roles ORDER BY id
`;

export const GET_ROLE_BY_NAME_QUERY = `
    SELECT id, name FROM roles WHERE name = $1
`;

// User-Game-Role queries

export const ASSIGN_USER_ROLE_QUERY = `
    INSERT INTO user_game_roles (user_id, game_id, role_id)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, game_id, role_id) DO NOTHING
    RETURNING id
`;

export const REMOVE_USER_ROLE_QUERY = `
    DELETE FROM user_game_roles
    WHERE user_id = $1 AND game_id = $2 AND role_id = $3
`;

export const GET_USER_ROLES_QUERY = `
    SELECT ugr.id, ugr.game_id, g.name as game_name, ugr.role_id, r.name as role_name
    FROM user_game_roles ugr
    JOIN roles r ON ugr.role_id = r.id
    LEFT JOIN games g ON ugr.game_id = g.id
    WHERE ugr.user_id = $1
`;

export const REMOVE_ALL_USER_ROLES_QUERY = `
    DELETE FROM user_game_roles WHERE user_id = $1
`;

// Admin queries

export const GET_ALL_USERS_QUERY = `
    SELECT
        u.id,
        u.username,
        u.email,
        u.status,
        u.is_verified,
        u.created_at,
        u.updated_at,
        COALESCE(
            json_agg(
                json_build_object(
                    'gameId', ugr.game_id,
                    'gameName', g.name,
                    'roleId', r.id,
                    'roleName', r.name
                )
            ) FILTER (WHERE ugr.id IS NOT NULL),
            '[]'
        ) as roles
    FROM users u
    LEFT JOIN user_game_roles ugr ON u.id = ugr.user_id
    LEFT JOIN roles r ON ugr.role_id = r.id
    LEFT JOIN games g ON ugr.game_id = g.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
`;

export const GET_PENDING_USERS_QUERY = `
    SELECT id, username, email, status, is_verified, created_at
    FROM users
    WHERE status = 'pending'
    ORDER BY created_at DESC
`;

export const DELETE_USER_QUERY = `
    DELETE FROM users WHERE id = $1
`;

// Games query (for role assignment)

export const GET_ALL_GAMES_QUERY = `
    SELECT id, slug, name FROM games ORDER BY name
`;
