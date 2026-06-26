-- Migration 007: My Bazar — product-level personal bazar entries

CREATE TABLE IF NOT EXISTS my_bazar_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  member_id   uuid REFERENCES members(id) ON DELETE SET NULL,
  date        date NOT NULL,
  note        text,
  grand_total numeric(10,2) NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS my_bazar_products (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id     uuid NOT NULL REFERENCES my_bazar_entries(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  quantity     numeric(10,3) NOT NULL DEFAULT 1,
  unit         text DEFAULT '',
  unit_price   numeric(10,2) NOT NULL DEFAULT 0,
  total_price  numeric(10,2) NOT NULL DEFAULT 0,
  sort_order   int NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mbe_user_id  ON my_bazar_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mbe_date     ON my_bazar_entries(date);
CREATE INDEX IF NOT EXISTS idx_mbp_entry_id ON my_bazar_products(entry_id);
