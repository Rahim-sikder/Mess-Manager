-- Migration 004: Add status/approval workflow, user-member linking, and roles
-- Run AFTER 003_update_meal_bazar_tables.sql

-- ── members: user_id (links to Supabase auth user) and role ──────────────────
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS role   text NOT NULL DEFAULT 'member'
    CHECK (role IN ('admin', 'member'));

-- One auth user can only be linked to one member
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_user_id
  ON members (user_id) WHERE user_id IS NOT NULL;

-- ── meal_entries: status and submitted_by ─────────────────────────────────────
ALTER TABLE meal_entries
  ADD COLUMN IF NOT EXISTS status       text NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS submitted_by uuid;  -- Supabase auth user id

CREATE INDEX IF NOT EXISTS idx_meal_entries_status       ON meal_entries (status);
CREATE INDEX IF NOT EXISTS idx_meal_entries_submitted_by ON meal_entries (submitted_by);

-- ── bazar_entries: status and submitted_by ────────────────────────────────────
ALTER TABLE bazar_entries
  ADD COLUMN IF NOT EXISTS status       text NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS submitted_by uuid;

CREATE INDEX IF NOT EXISTS idx_bazar_entries_status       ON bazar_entries (status);
CREATE INDEX IF NOT EXISTS idx_bazar_entries_submitted_by ON bazar_entries (submitted_by);
