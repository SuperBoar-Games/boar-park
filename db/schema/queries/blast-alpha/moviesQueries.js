export const getMoviesByHeroAndMovieId = `
  SELECT *
  FROM movies
  WHERE hero_id = ? AND movie_id = ?;
`;
