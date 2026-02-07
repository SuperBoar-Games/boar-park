/**
 * Movie-related database queries for PostgreSQL
 */

export const GET_MOVIE_CARD_STATS_BY_HERO_ID_QUERY = `
    SELECT
        ms.movie_id AS id,
        ms.title,
        ms.need_review,
        ms.locked,
        ms.last_update_user,
        ms.total_cards,
        ms.total_cards_need_review,
        ms.done,
        ms.hero_id,
        h.name AS hero_name
    FROM movie_stats ms
    JOIN heroes h ON ms.hero_id = h.id
    WHERE ms.hero_id = $1
    ORDER BY ms.movie_id ASC
`;

export const CHECK_MOVIE_EXISTS_QUERY = `
    SELECT 1 FROM movies
    WHERE title = $1 AND hero_id = $2
    LIMIT 1
`;

export const INSERT_MOVIE_QUERY = `
    INSERT INTO movies (title, hero_id, last_update_user)
    VALUES ($1, $2, $3)
    RETURNING *
`;

export const UPDATE_MOVIE_TITLE_QUERY = `
    UPDATE movies
    SET title = $1, last_update_user = $2, last_update_dt = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
`;

export const UPDATE_MOVIE_NEED_REVIEW_QUERY = `
    UPDATE movies
    SET need_review = $1, last_update_user = $2, last_update_dt = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
`;

export const UPDATE_MOVIE_LOCKED_STATUS_QUERY = `
    UPDATE movies
    SET locked = $1, last_update_user = $2, last_update_dt = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
`;

export const DELETE_MOVIE_QUERY = `
    DELETE FROM movies
    WHERE id = $1
    RETURNING *
`;
