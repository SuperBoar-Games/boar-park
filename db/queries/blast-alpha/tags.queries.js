export const TAG_COLUMNS = `
  t.id,
  t.name
`;

export const GET_ALL_TAGS = `
  SELECT
    ${TAG_COLUMNS}
  FROM tags t
  ORDER BY t.name ASC;
`;

export const INSERT_TAG = `
  INSERT INTO tags (name)
  VALUES (?)
  RETURNING id, name;
`;

export const UPDATE_TAG = `
  UPDATE tags
  SET name = ?
  WHERE id = ?
  RETURNING id, name;
`;

export const DELETE_TAG = `
  DELETE FROM tags
  WHERE id = ?
  RETURNING id;
`;

export const GET_TAGS_BY_CARD = `
  SELECT
    ${TAG_COLUMNS}
  FROM tags t
  JOIN card_tags ct ON ct.tag_id = t.id
  WHERE ct.card_id = ?
  ORDER BY t.name ASC;
`;

export const DELETE_CARD_TAGS = `
  DELETE FROM card_tags
  WHERE card_id = ?;
`;

export const INSERT_CARD_TAGS_BY_NAME = `
  INSERT OR IGNORE INTO card_tags (card_id, tag_id)
  SELECT ?, id
  FROM tags
  WHERE name IN (%s)
  COLLATE NOCASE;
`;

export const INSERT_CARD_TAGS_BY_ID = `
  INSERT OR IGNORE INTO card_tags (card_id, tag_id)
  VALUES (?, ?);
`;

export const GET_TAG_COUNTS_BY_HERO = `
  SELECT
    t.id   AS tag_id,
    t.name AS tag_name,
    COUNT(DISTINCT c.id) AS card_count
  FROM tags t
  LEFT JOIN card_tags ct ON ct.tag_id = t.id
  LEFT JOIN cards c
    ON c.id = ct.card_id
   AND c.hero_id = ?
  GROUP BY t.id, t.name
  ORDER BY t.name ASC;
`;

