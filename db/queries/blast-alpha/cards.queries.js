export const CARD_BASE_COLUMNS = `
  c.id,
  c.name,
  c.type,
  c.hero_id,
  c.movie_id,
  c.call_sign,
  c.ability_text,
  c.ability_text2,
  c.need_review,
  c.last_update_user
`;

export const GET_CARDS_BY_HERO_AND_MOVIE = `
  SELECT
    ${CARD_BASE_COLUMNS},
    m.title AS movie_title,
    GROUP_CONCAT(DISTINCT t.id) AS tag_ids,
    GROUP_CONCAT(DISTINCT t.name) AS tag_names
  FROM cards c
  LEFT JOIN movies m ON m.id = c.movie_id
  LEFT JOIN card_tags ct ON ct.card_id = c.id
  LEFT JOIN tags t ON t.id = ct.tag_id
  WHERE c.hero_id = ?
    AND c.movie_id = ?
  GROUP BY c.id
  ORDER BY c.type ASC, c.id ASC;
`;

export const GET_ALL_CARDS_BY_HERO = `
  SELECT
    ${CARD_BASE_COLUMNS},
    m.title AS movie_title,
    GROUP_CONCAT(DISTINCT t.id) AS tag_ids,
    GROUP_CONCAT(DISTINCT t.name) AS tag_names
  FROM cards c
  LEFT JOIN movies m ON m.id = c.movie_id
  LEFT JOIN card_tags ct ON ct.card_id = c.id
  LEFT JOIN tags t ON t.id = ct.tag_id
  WHERE c.hero_id = ?
  GROUP BY c.id
  ORDER BY c.type ASC, c.id ASC;
`;

export const INSERT_CARD = `
  INSERT INTO cards (
    name,
    type,
    hero_id,
    movie_id,
    call_sign,
    ability_text,
    ability_text2,
    last_update_user
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  RETURNING *;
`;

export const UPDATE_CARD = `
  UPDATE cards
  SET
    name = COALESCE(?, name),
    type = COALESCE(?, type),
    call_sign = COALESCE(?, call_sign),
    ability_text = COALESCE(?, ability_text),
    ability_text2 = COALESCE(?, ability_text2),
    need_review = COALESCE(?, need_review),
    last_update_user = ?
  WHERE id = ?
  RETURNING *;
`;

export const DELETE_CARD = `
  DELETE FROM cards
  WHERE id = ?
  RETURNING id;
`;

export const GET_CARD_BY_ID = `
  SELECT
    ${CARD_BASE_COLUMNS},
    m.title AS movie_title,
    GROUP_CONCAT(DISTINCT t.id) AS tag_ids,
    GROUP_CONCAT(DISTINCT t.name) AS tag_names
  FROM cards c
  LEFT JOIN movies m ON m.id = c.movie_id
  LEFT JOIN card_tags ct ON ct.card_id = c.id
  LEFT JOIN tags t ON t.id = ct.tag_id
  WHERE c.id = ?
  GROUP BY c.id;
`;
