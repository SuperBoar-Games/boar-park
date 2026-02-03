# Database Documentation

## Overview
PostgreSQL database with materialized views for performance optimization. Automatic refresh triggers update views on data changes.

## Schema

### Tables

#### games
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL, UNIQUE |
| display_name | VARCHAR(255) | NOT NULL |

Root entity. Each game can have multiple heroes.

#### heroes
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| game_id | INT | NOT NULL, FOREIGN KEY → games(id) |
| name | VARCHAR(255) | NOT NULL |
| industry | VARCHAR(255) | |
| | | UNIQUE(game_id, name) |

Heroes belong to games. Each hero can have multiple movies.

#### movies
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| hero_id | INT | NOT NULL, FOREIGN KEY → heroes(id) |
| title | VARCHAR(255) | NOT NULL |
| locked | BOOLEAN | DEFAULT FALSE |
| | | UNIQUE(hero_id, title) |

Movies belong to heroes and contain cards. Can be locked to prevent editing.

#### cards
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| movie_id | INT | NOT NULL, FOREIGN KEY → movies(id) |
| type | VARCHAR(100) | |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| need_review | BOOLEAN | DEFAULT FALSE |

Cards belong to movies. Can be tagged and marked for review.

#### tags
| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL, UNIQUE |

Tags for organization. Applied to cards via card_tags junction table.

#### card_tags
| Column | Type | Constraints |
|--------|------|-------------|
| card_id | INT | NOT NULL, FOREIGN KEY → cards(id) ON DELETE CASCADE |
| tag_id | INT | NOT NULL, FOREIGN KEY → tags(id) ON DELETE CASCADE |
| | | PRIMARY KEY(card_id, tag_id) |

Many-to-many relationship between cards and tags.

## Materialized Views

### movie_stats
Aggregates card count and review count per movie for fast lookups without counting on each query.

### hero_stats
Aggregates movie and card counts per hero.

### tag_stats
Aggregates card count per tag for stats display.

## Indexes

Key indexes for performance: idx_heroes_game_id, idx_movies_hero_id, idx_cards_movie_id, idx_card_tags_tag_id.

## Triggers

Auto-refresh triggers on `cards`, `movies`, and `tags` automatically refresh the materialized views on INSERT/UPDATE/DELETE operations. Views stay up-to-date automatically without manual refresh calls.

## Performance Notes

- **Materialized Views**: Provides 10-100x faster aggregation queries compared to runtime calculations
- **CONCURRENTLY Refresh**: Allows queries to run during view refresh - no locking
- **Unique Indexes**: Prevent duplicate entries at database level
- **Foreign Keys with CASCADE**: Automatically clean up related records on deletion
