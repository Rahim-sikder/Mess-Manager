-- Migration: core tables — members, bazar_entries, meal_entries
-- Run AFTER 001_create_monthly_rent.sql

-- ── Members ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  active     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_active ON members (active);

-- ── Bazar entries ─────────────────────────────────────────────────────────────
-- One row per shopping trip; a member may have multiple trips in a month.
CREATE TABLE IF NOT EXISTS bazar_entries (
  id         uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id  uuid          NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  date       date          NOT NULL,
  amount     numeric(12,2) NOT NULL CHECK (amount > 0),
  note       text,
  created_at timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bazar_entries_date      ON bazar_entries (date);
CREATE INDEX IF NOT EXISTS idx_bazar_entries_member_id ON bazar_entries (member_id);

-- ── Meal entries ──────────────────────────────────────────────────────────────
-- One row per member per day; meal_count allows 0-3 in 0.5 steps
-- (e.g. 0.5 = one half-meal, 3 = breakfast + lunch + dinner).
CREATE TABLE IF NOT EXISTS meal_entries (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid          NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  date        date          NOT NULL,
  meal_count  numeric(4,2)  NOT NULL DEFAULT 0
                            CHECK (meal_count >= 0 AND meal_count <= 3),
  created_at  timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT meal_entries_member_date_key UNIQUE (member_id, date)
);

CREATE INDEX IF NOT EXISTS idx_meal_entries_date      ON meal_entries (date);
CREATE INDEX IF NOT EXISTS idx_meal_entries_member_id ON meal_entries (member_id);
