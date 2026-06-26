-- Migration 005: Create meal_opts table for per-user daily meal opt-in/out
-- Run AFTER 004_add_status_roles.sql

-- ── meal_opts ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_opts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL,
  member_id   uuid        REFERENCES members(id) ON DELETE SET NULL,
  date        date        NOT NULL,
  meal_status text        NOT NULL DEFAULT 'yes'
    CHECK (meal_status IN ('yes', 'no')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),

  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_meal_opts_user_id ON meal_opts (user_id);
CREATE INDEX IF NOT EXISTS idx_meal_opts_date    ON meal_opts (date);
