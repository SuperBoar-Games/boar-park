/**
 * Hero-related database queries for PostgreSQL
 */

export const GET_HEROES_QUERY = `
    SELECT
        h.*,
        COALESCE(hs.total_movies, 0) AS total_movies,
        COALESCE(hs.pending_movies, 0) AS pending_movies,
        COALESCE(hs.total_cards, 0) AS total_cards
    FROM heroes h
    LEFT JOIN hero_stats hs ON hs.hero_id = h.id
    ORDER BY h.industry ASC, h.name ASC
`;

export const CHECK_HERO_EXISTS_QUERY = `
    SELECT COUNT(*) AS count
    FROM heroes
    WHERE name = $1 AND industry = $2
`;

export const GET_GAME_ID_BY_SLUG_QUERY = `
    SELECT id FROM games WHERE slug = $1
`;

export const INSERT_HERO_QUERY = `
    INSERT INTO heroes (name, industry, game_id, last_update_user)
    VALUES ($1, $2, $3, $4)
`;

export const UPDATE_HERO_QUERY = `
    UPDATE heroes
    SET name = $1, industry = $2, last_update_user = $3, last_update_dt = CURRENT_TIMESTAMP
    WHERE id = $4
`;

export const DELETE_HERO_QUERY = `
    DELETE FROM heroes WHERE id = $1
`;
