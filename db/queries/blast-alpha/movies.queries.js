// ---------- SELECT ----------

export const GET_MOVIES_BY_HERO_ID_QUERY = `
  SELECT *
  FROM movies
  WHERE hero_id = ?;
`;

export const GET_MOVIE_CARD_STATS_BY_HERO_ID_QUERY = `
  SELECT
    m.id,
    m.title,
    m.need_review,
    m.last_update_user,
    COUNT(c.id) AS total_cards,
    COUNT(CASE WHEN c.need_review = 'T' THEN 1 END) AS total_cards_need_review,
    CASE
      WHEN COUNT(c.id) < 5
        OR COUNT(CASE WHEN c.need_review = 'T' THEN 1 END) > 0
      THEN 'F'
      ELSE 'T'
    END AS done
  FROM movies m
  LEFT JOIN cards c ON c.movie_id = m.id
  WHERE m.hero_id = ?
  GROUP BY m.id
  ORDER BY m.id ASC;
`;

export const CHECK_MOVIE_EXISTS_QUERY = `
  SELECT 1
  FROM movies
  WHERE title = ? AND hero_id = ?
  LIMIT 1;
`;

// ---------- MUTATIONS (RETURNING MUST BE LAST, NO ;) ----------

export const INSERT_MOVIE_QUERY = `
  INSERT INTO movies (title, hero_id, last_update_user)
  VALUES (?, ?, ?)
  RETURNING *;
`;

export const UPDATE_MOVIE_TITLE_QUERY = `
  UPDATE movies
  SET title = ?, last_update_user = ?
  WHERE id = ?
  RETURNING *;
`;

export const UPDATE_MOVIE_NEED_REVIEW_QUERY = `
  UPDATE movies
  SET need_review = ?, last_update_user = ?
  WHERE id = ?
  RETURNING *;
`;

export const DELETE_MOVIE_QUERY = `
  DELETE FROM movies
  WHERE id = ?
  RETURNING *;
`;

export const UPDATE_MOVIE_LOCKED_STATUS_QUERY = `
  UPDATE movies
  SET locked = ?, last_update_user = ?
  WHERE id = ?
  RETURNING *;
`;


