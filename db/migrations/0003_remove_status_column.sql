-- Migration: Remove redundant status column from movies table
-- The status is calculated dynamically based on card count and review status
-- Date: 2026-02-03

ALTER TABLE movies DROP COLUMN status;
