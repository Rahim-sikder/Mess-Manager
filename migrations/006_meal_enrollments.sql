-- Migration 006: Meal enrollment system (monthly lunch + dinner tracking)

CREATE TABLE IF NOT EXISTS meal_enrollments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  member_id   uuid REFERENCES members(id) ON DELETE SET NULL,
  month       int NOT NULL CHECK (month BETWEEN 1 AND 12),
  year        int NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  remarks     text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_meal_enrollments_user_id ON meal_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_enrollments_month   ON meal_enrollments(month, year);

CREATE TABLE IF NOT EXISTS meal_enrollment_dates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   uuid NOT NULL REFERENCES meal_enrollments(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL,
  date            date NOT NULL,
  day_name        text NOT NULL,
  lunch_option    text NOT NULL DEFAULT 'yes' CHECK (lunch_option  IN ('yes', 'no')),
  dinner_option   text NOT NULL DEFAULT 'yes' CHECK (dinner_option IN ('yes', 'no')),
  remarks         text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_med_enrollment_id ON meal_enrollment_dates(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_med_user_id        ON meal_enrollment_dates(user_id);
CREATE INDEX IF NOT EXISTS idx_med_date           ON meal_enrollment_dates(date);
