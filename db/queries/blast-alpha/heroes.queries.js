export const GET_HEROES_QUERY = `
  SELECT
    h.*,
    COUNT(DISTINCT m.id) AS total_movies,
    COUNT(DISTINCT CASE 
      WHEN m.need_review = 'T'
        OR (
          SELECT COUNT(*) FROM cards c1 WHERE c1.movie_id = m.id
        ) < 5
        OR (
          SELECT COUNT(*) FROM cards c2 WHERE c2.movie_id = m.id AND c2.need_review = 'T'
        ) > 0
      THEN m.id END
    ) AS pending_movies,
    COUNT(DISTINCT c.id) AS total_cards
  FROM heroes h
  LEFT JOIN movies m ON m.hero_id = h.id
  LEFT JOIN cards c ON c.hero_id = h.id
  GROUP BY h.id
  ORDER BY h.category ASC, h.name ASC;
`;

export const CHECK_HERO_EXISTS_QUERY = `
  SELECT COUNT(*) AS count
  FROM heroes
  WHERE name = ? AND category = ?
`;

export const INSERT_HERO_QUERY = `
  INSERT INTO heroes (name, category, game_id, last_update_user)
  VALUES (?, ?, ?, ?)
`;

export const UPDATE_HERO_QUERY = `
  UPDATE heroes
  SET name = ?, category = ?, last_update_user = ?
  WHERE id = ?
`;

export const DELETE_HERO_QUERY = `
  DELETE FROM heroes
  WHERE id = ?
`;


