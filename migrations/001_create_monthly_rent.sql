-- Migration: create monthly_rent table
-- Run once against your Supabase project via the SQL editor
-- or psql -h <host> -U postgres -d postgres -f 001_create_monthly_rent.sql

CREATE TABLE IF NOT EXISTS monthly_rent (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  month       integer       NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        integer       NOT NULL CHECK (year >= 2000),
  amount      numeric(12,2) NOT NULL CHECK (amount >= 0),
  created_at  timestamptz   NOT NULL DEFAULT now(),
  updated_at  timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT monthly_rent_month_year_key UNIQUE (month, year)
);

-- Fast lookup by (year, month)
CREATE INDEX IF NOT EXISTS idx_monthly_rent_year_month
  ON monthly_rent (year, month);

-- Keep updated_at current on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS monthly_rent_set_updated_at ON monthly_rent;

CREATE TRIGGER monthly_rent_set_updated_at
  BEFORE UPDATE ON monthly_rent
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- NOTE: No default rows are inserted here.
-- The application returns DEFAULT_MONTHLY_ROOM_RENT (12000) when no row exists.
