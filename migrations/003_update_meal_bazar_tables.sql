-- Migration 003: Add breakfast/lunch/dinner to meal_entries,
--                add description/category to bazar_entries
-- Run AFTER 002_create_core_tables.sql

-- ── meal_entries: add per-meal columns ────────────────────────────────────────
ALTER TABLE meal_entries
  ADD COLUMN IF NOT EXISTS breakfast numeric(4,2) NOT NULL DEFAULT 0
    CHECK (breakfast >= 0 AND breakfast <= 3),
  ADD COLUMN IF NOT EXISTS lunch     numeric(4,2) NOT NULL DEFAULT 0
    CHECK (lunch >= 0 AND lunch <= 3),
  ADD COLUMN IF NOT EXISTS dinner    numeric(4,2) NOT NULL DEFAULT 0
    CHECK (dinner >= 0 AND dinner <= 3);

-- ── bazar_entries: add description and category ───────────────────────────────
ALTER TABLE bazar_entries
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category    text;

-- Copy existing note values into description for backward compatibility
UPDATE bazar_entries
  SET description = note
  WHERE description IS NULL AND note IS NOT NULL;
