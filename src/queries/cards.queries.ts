/**
 * Card-related database queries for PostgreSQL
 */

export const GET_CARDS_BY_HERO_AND_MOVIE_QUERY = `
    SELECT
        c.id,
        c.name,
        c.type,
        c.hero_id,
        c.movie_id,
        c.call_sign,
        c.ability_text,
        c.ability_text2,
        c.need_review,
        c.last_update_user,
        ARRAY_AGG(DISTINCT t.id) FILTER (WHERE t.id IS NOT NULL) AS tag_ids,
        ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tag_names
    FROM cards c
    LEFT JOIN card_tags ct ON ct.card_id = c.id
    LEFT JOIN tags t ON t.id = ct.tag_id
    WHERE c.hero_id = $1 AND c.movie_id = $2
    GROUP BY c.id, c.name, c.type, c.hero_id, c.movie_id, c.call_sign, c.ability_text, c.ability_text2, c.need_review, c.last_update_user
    ORDER BY c.type ASC, c.id ASC
`;

export const GET_ALL_CARDS_BY_HERO_QUERY = `
    SELECT
        c.id,
        c.name,
        c.type,
        c.hero_id,
        c.movie_id,
        c.call_sign,
        c.ability_text,
        c.ability_text2,
        c.need_review,
        c.last_update_user,
        m.title AS movie_title,
        m.locked AS movie_locked,
        ARRAY_AGG(DISTINCT t.id) FILTER (WHERE t.id IS NOT NULL) AS tag_ids,
        ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tag_names
    FROM cards c
    LEFT JOIN movies m ON m.id = c.movie_id
    LEFT JOIN card_tags ct ON ct.card_id = c.id
    LEFT JOIN tags t ON t.id = ct.tag_id
    WHERE c.hero_id = $1
    GROUP BY c.id, c.name, c.type, c.hero_id, c.movie_id, c.call_sign, c.ability_text, c.ability_text2, c.need_review, c.last_update_user, m.title, m.locked
    ORDER BY c.type ASC, c.id ASC
`;

export const INSERT_CARD_QUERY = `
    INSERT INTO cards (
        name,
        type,
        hero_id,
        movie_id,
        call_sign,
        ability_text,
        ability_text2,
        last_update_user
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
`;

export const UPDATE_CARD_QUERY = `
    UPDATE cards
    SET
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        call_sign = COALESCE($3, call_sign),
        ability_text = COALESCE($4, ability_text),
        ability_text2 = COALESCE($5, ability_text2),
        need_review = COALESCE($6, need_review),
        last_update_user = $7,
        last_update_dt = CURRENT_TIMESTAMP
    WHERE id = $8
    RETURNING *
`;

export const DELETE_CARD_QUERY = `
    DELETE FROM cards
    WHERE id = $1
    RETURNING id
`;

export const GET_CARD_BY_ID_QUERY = `
    SELECT
        c.id,
        c.name,
        c.type,
        c.hero_id,
        c.movie_id,
        c.call_sign,
        c.ability_text,
        c.ability_text2,
        c.need_review,
        c.last_update_user,
        m.title AS movie_title,
        ARRAY_AGG(DISTINCT t.id) FILTER (WHERE t.id IS NOT NULL) AS tag_ids,
        ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) AS tag_names
    FROM cards c
    LEFT JOIN movies m ON m.id = c.movie_id
    LEFT JOIN card_tags ct ON ct.card_id = c.id
    LEFT JOIN tags t ON t.id = ct.tag_id
    WHERE c.id = $1
    GROUP BY c.id, c.name, c.type, c.hero_id, c.movie_id, c.call_sign, c.ability_text, c.ability_text2, c.need_review, c.last_update_user, m.title
`;

export const INSERT_CARD_TAG_QUERY = `
    INSERT INTO card_tags (card_id, tag_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
`;

export const DELETE_CARD_TAGS_QUERY = `
    DELETE FROM card_tags WHERE card_id = $1
`;
