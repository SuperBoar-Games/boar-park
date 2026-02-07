-- ============================================================================
-- Initial Database Schema
-- ============================================================================
-- This migration creates all tables, indexes, and constraints.
-- Seed data is kept separate in db/seeds/seed_data.sql to avoid committing
-- sensitive user information (emails) to version control.
-- ============================================================================

CREATE TABLE IF NOT EXISTS games (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS heroes (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  language VARCHAR(50) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS movies (
  id BIGSERIAL PRIMARY KEY,
  hero_id BIGINT NOT NULL REFERENCES heroes(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) CHECK (status IN ('DONE', 'PENDING')) DEFAULT 'PENDING',
  need_review BOOLEAN DEFAULT false,
  last_update_dt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_update_user VARCHAR(255) NOT NULL,
  locked BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS tags (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS cards (
  id BIGSERIAL PRIMARY KEY,
  movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  hero_id BIGINT NOT NULL REFERENCES heroes(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('HERO', 'VILLAIN', 'SR1', 'SR2', 'WC')),
  call_sign TEXT,
  ability_text TEXT,
  ability_text2 TEXT,
  need_review BOOLEAN DEFAULT false,
  last_update_dt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_update_user VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS card_tags (
  card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
  PRIMARY KEY (card_id, tag_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_movies_hero_id ON movies(hero_id);
CREATE INDEX idx_cards_movie_id ON cards(movie_id);
CREATE INDEX idx_cards_hero_id ON cards(hero_id);
CREATE INDEX idx_card_tags_tag_id ON card_tags(tag_id);

-- ============================================================================
-- SEQUENCES INITIALIZATION (Empty - will be set during seed)
-- ============================================================================
-- Sequences are created automatically with BIGSERIAL columns.
-- They will be reset to appropriate values after seeding data.
