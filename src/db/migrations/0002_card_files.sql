-- Migration: Card files support, designer role, separate files lock on movies
-- Run: psql $DATABASE_URL -f src/db/migrations/0002_card_files.sql

-- Card files table: one row per file type per card (max 3 per card)
CREATE TABLE IF NOT EXISTS card_files (
  id SERIAL PRIMARY KEY,
  card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  file_type INTEGER NOT NULL CHECK (file_type IN (1, 2, 3)),
  -- 1 = design file (Photoshop/AI/etc.)
  -- 2 = image (PNG or JPEG only)
  -- 3 = print export (PDF/etc., optional)
  filename TEXT NOT NULL,        -- stored filename e.g. "image.png"
  original_name TEXT NOT NULL,   -- original filename from uploader
  mime_type TEXT,
  size_bytes INTEGER,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (card_id, file_type)    -- one file per type per card
);

CREATE INDEX IF NOT EXISTS idx_card_files_card_id ON card_files(card_id);

-- Separate file-upload lock on movies (independent of content lock)
ALTER TABLE movies ADD COLUMN IF NOT EXISTS files_locked BOOLEAN DEFAULT FALSE;

-- New permissions for file upload/delete
INSERT INTO permissions (name, description) VALUES
  ('files:create', 'Upload card files'),
  ('files:delete', 'Delete card files')
ON CONFLICT (name) DO NOTHING;

-- Designer role
INSERT INTO system_roles (name, description)
VALUES ('designer', 'Can upload and delete card design files')
ON CONFLICT (name) DO NOTHING;

-- Assign files permissions to designer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM system_roles r, permissions p
WHERE r.name = 'designer' AND p.name IN ('files:create', 'files:delete')
ON CONFLICT DO NOTHING;
