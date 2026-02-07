-- Migration: Create materialized views for performance optimization
-- These views cache aggregated statistics that are frequently queried
-- Date: 2026-02-03

-- Movie statistics materialized view
-- Stores card counts, review status, and completion status per movie
CREATE MATERIALIZED VIEW movie_stats AS
SELECT
    m.id AS movie_id,
    m.hero_id,
    m.title,
    m.need_review,
    m.locked,
    m.last_update_user,
    m.last_update_dt,
    COUNT(c.id) AS total_cards,
    COUNT(CASE WHEN c.need_review = true THEN 1 END) AS total_cards_need_review,
    CASE
        WHEN COUNT(c.id) < 5
            OR COUNT(CASE WHEN c.need_review = true THEN 1 END) > 0
        THEN false
        ELSE true
    END AS done
FROM movies m
LEFT JOIN cards c ON c.movie_id = m.id
GROUP BY m.id, m.hero_id, m.title, m.need_review, m.locked, m.last_update_user, m.last_update_dt;

-- Create indexes for fast lookups
CREATE INDEX idx_movie_stats_hero_id ON movie_stats(hero_id);
CREATE INDEX idx_movie_stats_done ON movie_stats(done);

-- Hero statistics materialized view
-- Stores aggregated counts per hero
CREATE MATERIALIZED VIEW hero_stats AS
SELECT
    h.id AS hero_id,
    h.name,
    h.industry,
    h.game_id,
    COUNT(DISTINCT m.id) AS total_movies,
    COUNT(DISTINCT CASE WHEN ms.done = false THEN m.id END) AS pending_movies,
    COUNT(DISTINCT c.id) AS total_cards,
    COUNT(DISTINCT CASE WHEN c.need_review = true THEN c.id END) AS cards_need_review
FROM heroes h
LEFT JOIN movies m ON m.hero_id = h.id
LEFT JOIN movie_stats ms ON ms.movie_id = m.id
LEFT JOIN cards c ON c.hero_id = h.id
GROUP BY h.id, h.name, h.industry, h.game_id;

-- Create indexes
CREATE INDEX idx_hero_stats_game_id ON hero_stats(game_id);
CREATE INDEX idx_hero_stats_industry ON hero_stats(industry);

-- Tag statistics materialized view
-- Stores usage counts per tag
CREATE MATERIALIZED VIEW tag_stats AS
SELECT
    t.id AS tag_id,
    t.name AS tag_name,
    COUNT(ct.card_id) AS card_count,
    COUNT(DISTINCT c.hero_id) AS hero_count
FROM tags t
LEFT JOIN card_tags ct ON ct.tag_id = t.id
LEFT JOIN cards c ON c.id = ct.card_id
GROUP BY t.id, t.name;

-- Create index
CREATE INDEX idx_tag_stats_card_count ON tag_stats(card_count DESC);

-- Function to refresh all stats materialized views
CREATE OR REPLACE FUNCTION refresh_all_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY movie_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY hero_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY tag_stats;
END;
$$ LANGUAGE plpgsql;

-- Note: Call refresh_all_stats() after any changes to movies, cards, heroes, or tags
-- Or set up a trigger/scheduled job to refresh automatically
