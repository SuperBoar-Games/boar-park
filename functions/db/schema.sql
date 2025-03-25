-- Games
CREATE TABLE games (
	id	INTEGER PRIMARY KEY AUTOINCREMENT,
	name	TEXT NOT NULL UNIQUE,
	slug	TEXT NOT NULL UNIQUE,
	type	TEXT NOT NULL CHECK(type IN ('CARDS', 'BOARDS'))
);

-- HEROES  TABLE
CREATE TABLE heroes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('TELUGU', 'HINDI', 'TAMIL', 'KANNADA', 'MALAYALAM')),
  game_id INTEGER NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  UNIQUE (game_id, name)
);

-- MOVIES TABLE
CREATE TABLE movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hero_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT PENDING CHECK(status IN ('DONE', 'PENDING')),
  FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE
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
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_heroes_game_id ON heroes(game_id);
CREATE INDEX idx_movies_hero_id ON movies(hero_id);
CREATE INDEX idx_cards_hero_id ON cards(hero_id);
CREATE INDEX idx_cards_movie_id ON cards(movie_id);
CREATE INDEX idx_cards_type ON cards(type);
