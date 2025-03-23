-- HEROES  TABLE
CREATE TABLE heroes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- MOVIES TABLE
CREATE TABLE movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hero_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  FOREIGN KEY (hero_id) REFERENCES heroes(id)
);

-- CARDS TABLE
CREATE TABLE cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movie_id INTEGER, -- Nullable for add-on wild cards
  hero_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('HERO', 'VILLAIN', 'SR1', 'SR2', 'WC')),
  call_sign TEXT, -- Nullable,
  ability_text TEXT NOT NULL,
  image_url TEXT,
  is_add_on BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (movie_id) REFERENCES movies(id),
  FOREIGN KEY (hero_id) REFERENCES heroes(id)
);
