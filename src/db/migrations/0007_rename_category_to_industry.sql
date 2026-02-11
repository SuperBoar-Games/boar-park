-- PostgreSQL Migration: Rename category column to industry and remove CHECK constraint
-- Date: 2026-02-10
-- Reason: User requested "industry" field that accepts custom values

-- Step 1: Drop the existing constraint
ALTER TABLE heroes DROP CONSTRAINT heroes_category_check;

-- Step 2: Rename the column
ALTER TABLE heroes RENAME COLUMN category TO industry;

-- Step 3: Verify the schema
-- The industry column now accepts any VARCHAR(50) value without restriction
