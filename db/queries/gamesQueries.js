export const getGameBySlug = `
  SELECT * FROM games WHERE game_slug = ?;
`;

export const getAllGames = `
  SELECT * from games
`;
