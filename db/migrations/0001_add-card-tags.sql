-- Migration number: 0001 	 2026-01-11T14:37:50.274Z

-- TAGS TABLE
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- JOIN TABLE: CARD <-> TAG
CREATE TABLE IF NOT EXISTS card_tags (
  card_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (card_id, tag_id),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_card_tags_card_id ON card_tags(card_id);
CREATE INDEX IF NOT EXISTS idx_card_tags_tag_id ON card_tags(tag_id);

