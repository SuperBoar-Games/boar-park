
 ⛅️ wrangler 4.54.0 (update available 4.61.0)
─────────────────────────────────────────────
Resource location: local 

Use --remote if you want to access the remote instance.

🌀 Executing on local database BoarDB (5c36b70f-e6c2-4b33-a9f4-fcfd12039a86) from .wrangler/state/v3/d1:
🌀 To execute on your remote database, add a --remote flag to your wrangler command.
🚣 1 command executed successfully.
[
  {
    "results": [
      {
        "sql": "CREATE INDEX idx_card_tags_card_id ON card_tags(card_id)"
      },
      {
        "sql": "CREATE INDEX idx_card_tags_tag_id ON card_tags(tag_id)"
      },
      {
        "sql": "CREATE UNIQUE INDEX idx_cards_hero_movie_name\nON cards(hero_id, movie_id, name)"
      },
      {
        "sql": "CREATE INDEX idx_heroes_game_id ON heroes(game_id)"
      },
      {
        "sql": "CREATE INDEX idx_movies_hero_id ON movies(hero_id)"
      },
      {
        "sql": "CREATE UNIQUE INDEX idx_movies_hero_title\nON movies(hero_id, title)"
      },
      {
        "sql": "CREATE TABLE _cf_METADATA (\n        key INTEGER PRIMARY KEY,\n        value BLOB\n      )"
      },
      {
        "sql": "CREATE TABLE card_tags (\n  card_id INTEGER NOT NULL,\n  tag_id INTEGER NOT NULL,\n  PRIMARY KEY (card_id, tag_id),\n  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,\n  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE\n)"
      },
      {
        "sql": "CREATE TABLE \"cards\" (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  movie_id INTEGER,\n  hero_id INTEGER NOT NULL,\n  name TEXT NOT NULL,\n  type TEXT NOT NULL CHECK (type IN ('HERO', 'VILLAIN', 'SR1', 'SR2', 'WC')),\n  call_sign TEXT,\n  ability_text TEXT NOT NULL,\n  ability_text2 TEXT,\n  need_review TEXT DEFAULT 'FALSE',\n  last_update_dt DATETIME DEFAULT CURRENT_TIMESTAMP,\n  last_update_user TEXT DEFAULT 'admin', \n  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,\n  FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE\n)"
      },
      {
        "sql": "CREATE TABLE d1_migrations(\n\t\tid         INTEGER PRIMARY KEY AUTOINCREMENT,\n\t\tname       TEXT UNIQUE,\n\t\tapplied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL\n)"
      },
      {
        "sql": "CREATE TABLE games (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL UNIQUE,\n  slug TEXT NOT NULL UNIQUE,\n  type TEXT NOT NULL CHECK(type IN ('CARDS', 'BOARDS')),\n  last_update_dt DATETIME DEFAULT CURRENT_TIMESTAMP,\n  last_update_user TEXT DEFAULT 'admin'\n)"
      },
      {
        "sql": "CREATE TABLE heroes (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  category TEXT NOT NULL CHECK (category IN ('TELUGU', 'HINDI', 'TAMIL', 'KANNADA', 'MALAYALAM')),\n  game_id INTEGER NOT NULL,\n  last_update_dt DATETIME DEFAULT CURRENT_TIMESTAMP,\n  last_update_user TEXT DEFAULT 'admin',\n  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,\n  UNIQUE (game_id, name)\n)"
      },
      {
        "sql": "CREATE TABLE movies (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  hero_id INTEGER NOT NULL,\n  title TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('DONE', 'PENDING')),\n  need_review TEXT DEFAULT 'FALSE',\n  last_update_dt DATETIME DEFAULT CURRENT_TIMESTAMP,\n  last_update_user TEXT DEFAULT 'admin', locked INTEGER NOT NULL DEFAULT 0 CHECK (locked IN (0,1)),\n  FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE\n)"
      },
      {
        "sql": "CREATE TABLE sqlite_sequence(name,seq)"
      },
      {
        "sql": "CREATE TABLE tags (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL UNIQUE\n)"
      },
      {
        "sql": "CREATE TRIGGER cards_block_delete_when_movie_locked\nBEFORE DELETE ON cards\nWHEN OLD.movie_id IS NOT NULL\nAND EXISTS (\n  SELECT 1 FROM movies\n  WHERE id = OLD.movie_id AND locked = 1\n)\nBEGIN\n  SELECT RAISE(ABORT, 'movie is locked');\nEND"
      },
      {
        "sql": "CREATE TRIGGER cards_block_insert_when_movie_locked\nBEFORE INSERT ON cards\nWHEN NEW.movie_id IS NOT NULL\nAND EXISTS (\n  SELECT 1 FROM movies\n  WHERE id = NEW.movie_id AND locked = 1\n)\nBEGIN\n  SELECT RAISE(ABORT, 'movie is locked');\nEND"
      },
      {
        "sql": "CREATE TRIGGER cards_block_update_when_movie_locked\nBEFORE UPDATE ON cards\nWHEN (\n  OLD.movie_id IS NOT NULL\n  AND EXISTS (\n    SELECT 1 FROM movies\n    WHERE id = OLD.movie_id AND locked = 1\n  )\n)\nOR (\n  NEW.movie_id IS NOT NULL\n  AND EXISTS (\n    SELECT 1 FROM movies\n    WHERE id = NEW.movie_id AND locked = 1\n  )\n)\nBEGIN\n  SELECT RAISE(ABORT, 'movie is locked');\nEND"
      },
      {
        "sql": "CREATE TRIGGER movies_block_delete_when_locked\nBEFORE DELETE ON movies\nWHEN OLD.locked = 1\nBEGIN\n  SELECT RAISE(ABORT, 'movie is locked');\nEND"
      }
    ],
    "success": true,
    "meta": {
      "duration": 0
    }
  }
]
