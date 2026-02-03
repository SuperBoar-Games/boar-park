/**
 * Game-related database queries for PostgreSQL
 */

export const GET_ALL_GAMES_QUERY = `
    SELECT * FROM games
`;

export const GET_GAME_BY_SLUG_QUERY = `
    SELECT * FROM games WHERE slug = $1
`;
