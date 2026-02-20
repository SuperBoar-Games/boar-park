/**
 * Card file database queries for PostgreSQL
 */

export const GET_CARD_FILES_QUERY = `
    SELECT
        cf.id,
        cf.card_id,
        cf.file_type,
        cf.filename,
        cf.original_name,
        cf.mime_type,
        cf.size_bytes,
        cf.uploaded_by,
        cf.uploaded_at
    FROM card_files cf
    WHERE cf.card_id = $1
    ORDER BY cf.file_type ASC
`;

export const GET_MOVIE_FOR_CARD_QUERY = `
    SELECT m.id, m.locked, m.files_locked
    FROM movies m
    JOIN cards c ON c.movie_id = m.id
    WHERE c.id = $1
`;

export const UPSERT_CARD_FILE_QUERY = `
    INSERT INTO card_files (card_id, file_type, filename, original_name, mime_type, size_bytes, uploaded_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (card_id, file_type) DO UPDATE SET
        filename = EXCLUDED.filename,
        original_name = EXCLUDED.original_name,
        mime_type = EXCLUDED.mime_type,
        size_bytes = EXCLUDED.size_bytes,
        uploaded_by = EXCLUDED.uploaded_by,
        uploaded_at = NOW()
    RETURNING *
`;

export const DELETE_CARD_FILE_QUERY = `
    DELETE FROM card_files
    WHERE card_id = $1 AND file_type = $2
    RETURNING filename
`;

export const UPDATE_MOVIE_FILES_LOCKED_QUERY = `
    UPDATE movies
    SET files_locked = $1, last_update_user = $2, last_update_dt = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
`;

// Get all card files for a movie (for ZIP download)
export const GET_FILES_FOR_MOVIE_QUERY = `
    SELECT
        cf.card_id,
        cf.file_type,
        cf.filename,
        cf.original_name,
        c.name AS card_name,
        c.type AS card_type,
        m.title AS movie_title
    FROM card_files cf
    JOIN cards c ON c.id = cf.card_id
    JOIN movies m ON m.id = c.movie_id
    WHERE c.movie_id = $1
      AND cf.file_type = ANY($2::int[])
    ORDER BY c.id ASC, cf.file_type ASC
`;

// Get all card files for a hero across all movies (for ZIP download)
export const GET_FILES_FOR_HERO_QUERY = `
    SELECT
        cf.card_id,
        cf.file_type,
        cf.filename,
        cf.original_name,
        c.name AS card_name,
        c.type AS card_type,
        m.title AS movie_title,
        m.id AS movie_id
    FROM card_files cf
    JOIN cards c ON c.id = cf.card_id
    JOIN movies m ON m.id = c.movie_id
    WHERE c.hero_id = $1
      AND cf.file_type = ANY($2::int[])
    ORDER BY m.id ASC, c.id ASC, cf.file_type ASC
`;
