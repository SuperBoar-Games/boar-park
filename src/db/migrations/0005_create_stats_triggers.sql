-- Migration: Create triggers to auto-refresh materialized views
-- Automatically refresh stats when data changes
-- Date: 2026-02-03

-- Trigger function to refresh movie_stats
CREATE OR REPLACE FUNCTION refresh_movie_stats_trigger()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY movie_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to refresh hero_stats (depends on movie_stats)
CREATE OR REPLACE FUNCTION refresh_hero_stats_trigger()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY hero_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Movies table triggers
CREATE TRIGGER trigger_refresh_movie_stats_on_movie_change
AFTER INSERT OR UPDATE OR DELETE ON movies
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_movie_stats_trigger();

-- Cards table triggers (affects movie stats)
CREATE TRIGGER trigger_refresh_movie_stats_on_card_change
AFTER INSERT OR UPDATE OR DELETE ON cards
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_movie_stats_trigger();

-- Heroes table triggers
CREATE TRIGGER trigger_refresh_hero_stats_on_hero_change
AFTER INSERT OR UPDATE OR DELETE ON heroes
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_hero_stats_trigger();

-- Refresh hero_stats after movie_stats changes
CREATE TRIGGER trigger_refresh_hero_stats_on_movie_stats_change
AFTER INSERT OR UPDATE OR DELETE ON movies
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_hero_stats_trigger();

-- Note: CONCURRENTLY requires unique indexes on the materialized views
-- Let's add unique indexes for concurrent refresh support
CREATE UNIQUE INDEX idx_movie_stats_movie_id ON movie_stats(movie_id);
CREATE UNIQUE INDEX idx_hero_stats_hero_id ON hero_stats(hero_id);
CREATE UNIQUE INDEX idx_tag_stats_tag_id ON tag_stats(tag_id);
