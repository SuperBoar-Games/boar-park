-- Migration number: 0002 	 2026-01-28T19:30:02.499Z

PRAGMA foreign_keys = OFF;

-- 1) add movies.locked
ALTER TABLE movies
ADD COLUMN locked INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0,1));

-- 2) Refactor cards to:
--         - remove .is_add_on
--         - remove .image_url
CREATE TABLE cards_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id INTEGER,
  hero_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('HERO', 'VILLAIN', 'SR1', 'SR2', 'WC')),
  call_sign TEXT,
  ability_text TEXT NOT NULL,
  ability_text2 TEXT,
  need_review TEXT DEFAULT 'FALSE',
  last_update_dt DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_update_user TEXT DEFAULT 'admin', 
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE
);
INSERT INTO cards_new (
  id,
  movie_id,
  hero_id,
  name,
  type,
  call_sign,
  ability_text,
  ability_text2,
  need_review,
  last_update_dt,
  last_update_user
)
SELECT
  c.id,
  c.movie_id,
  c.hero_id,
  c.name,
  c.type,
  c.call_sign,
  c.ability_text,
  c.ability_text2,
  c.need_review,
  c.last_update_dt,
  c.last_update_user
FROM cards c;
DROP TABLE cards;
ALTER TABLE cards_new RENAME TO cards;

-- 3) Enforce movie lock on cards
CREATE TRIGGER cards_block_insert_when_movie_locked
BEFORE INSERT ON cards
WHEN NEW.movie_id IS NOT NULL
AND EXISTS (
  SELECT 1 FROM movies
  WHERE id = NEW.movie_id AND locked = 1
)
BEGIN
  SELECT RAISE(ABORT, 'movie is locked');
END;

CREATE TRIGGER cards_block_update_when_movie_locked
BEFORE UPDATE ON cards
WHEN (
  OLD.movie_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM movies
    WHERE id = OLD.movie_id AND locked = 1
  )
)
OR (
  NEW.movie_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM movies
    WHERE id = NEW.movie_id AND locked = 1
  )
)
BEGIN
  SELECT RAISE(ABORT, 'movie is locked');
END;

CREATE TRIGGER cards_block_delete_when_movie_locked
BEFORE DELETE ON cards
WHEN OLD.movie_id IS NOT NULL
AND EXISTS (
  SELECT 1 FROM movies
  WHERE id = OLD.movie_id AND locked = 1
)
BEGIN
  SELECT RAISE(ABORT, 'movie is locked');
END;

-- 4) Hard-block deleting locked movies
DROP TRIGGER IF EXISTS movies_block_delete_when_locked;

CREATE TRIGGER movies_block_delete_when_locked
BEFORE DELETE ON movies
WHEN OLD.locked = 1
BEGIN
  SELECT RAISE(ABORT, 'movie is locked');
END;

-- 5) Uniqueness
DROP INDEX IF EXISTS idx_movies_hero_title;
DROP INDEX IF EXISTS idx_cards_hero_movie_name;

CREATE UNIQUE INDEX idx_movies_hero_title
ON movies(hero_id, title);

CREATE UNIQUE INDEX idx_cards_hero_movie_name
ON cards(hero_id, movie_id, name);

PRAGMA foreign_keys = ON;

