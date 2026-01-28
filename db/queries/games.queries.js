export const GET_GAME_BY_SLUG_QUERY = `
  SELECT * FROM games WHERE game_slug = ?;
`;

export const GET_ALL_GAMES_QUERY = `
  SELECT * from games
`;

export const FETCH_GAME_ID_QUERY = `
  SELECT id
  FROM games
  WHERE slug = ?
`;


