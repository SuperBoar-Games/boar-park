export const getCardsByHeroAndMovieId = `
  SELECT *
  FROM cards c
  WHERE c.hero_id = ? AND c.movie_id = ?
  ORDER BY c.id ASC, c.type ASC;
`;
