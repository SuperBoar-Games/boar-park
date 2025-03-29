export const getMoviesByHeroId = `
  SELECT *
  FROM movies
  WHERE hero_id = ?;
`;
