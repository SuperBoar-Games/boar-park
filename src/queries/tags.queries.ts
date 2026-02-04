/**
 * Tag-related database queries for PostgreSQL
 */

export const GET_ALL_TAGS_QUERY = `
    SELECT * FROM tags
    ORDER BY name ASC
`;

export const CHECK_TAG_EXISTS_QUERY = `
    SELECT id FROM tags WHERE name = $1
`;

export const INSERT_TAG_QUERY = `
    INSERT INTO tags (name)
    VALUES ($1)
    RETURNING *
`;

export const UPDATE_TAG_QUERY = `
    UPDATE tags
    SET name = $1
    WHERE id = $2
    RETURNING *
`;

export const DELETE_TAG_QUERY = `
    DELETE FROM tags
    WHERE id = $1
    RETURNING *
`;

export const GET_TAG_COUNTS_BY_HERO_QUERY = `
    SELECT 
        t.id as tag_id,
        t.name as tag_name,
        COUNT(DISTINCT ct.card_id) as card_count
    FROM tags t
    LEFT JOIN card_tags ct ON ct.tag_id = t.id
    LEFT JOIN cards c ON c.id = ct.card_id
    WHERE c.hero_id = $1 OR c.hero_id IS NULL
    GROUP BY t.id, t.name
    ORDER BY t.name ASC
`;
