-- ============================================================================
-- COMBINED DEPLOY: migrations 00008 + 00009 (were never applied to production)
-- Run this ONCE in Supabase SQL Editor (https://supabase.com/dashboard -> SQL Editor)
-- Safe to re-run: 00008 uses IF NOT EXISTS; 00009 will error only if tables already exist.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════════
-- Migration 00008: Sandbox Mode + SuperAdmin Promotion
-- ════════════════════════════════════════════════════════════════════════════════
--
-- PHASE 1: Promote marioffj@gmail.com to SUPER_ADMIN
-- PHASE 2: Add sandbox_mode to users table
-- PHASE 3: Add is_sandbox flag to data tables for test data isolation
--
-- Architecture:
--   When sandbox_mode = true on users table, all data created by the user
--   while in sandbox mode gets marked with is_sandbox = true on the row.
--   Queries for real metrics/analytics/progress exclude is_sandbox = true rows.
--   This keeps test data physically in the same tables but logically separated.
-- ════════════════════════════════════════════════════════════════════════════════

-- ── PHASE 1: Promote SuperAdmin ──────────────────────────────────────────────

UPDATE users
SET role = 'SUPER_ADMIN'
WHERE email = 'marioffj@gmail.com';

-- ── PHASE 2: Add sandbox_mode preference to users ────────────────────────────

ALTER TABLE users
ADD COLUMN IF NOT EXISTS sandbox_mode BOOLEAN NOT NULL DEFAULT FALSE;

-- ── PHASE 3: Add is_sandbox flag to data tables ──────────────────────────────
-- This allows queries to filter out test data from real metrics.
-- Only tables that affect metrics/analytics/progress need this flag.

-- Training
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN NOT NULL DEFAULT FALSE;

-- Nutrition
ALTER TABLE meal_logs
ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN NOT NULL DEFAULT FALSE;

-- Progress
ALTER TABLE weight_entries
ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE measurement_entries
ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE progress_photos
ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN NOT NULL DEFAULT FALSE;

-- Subscriptions (for simulated plan changes)
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS is_sandbox BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Indexes for efficient filtering ──────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_training_sessions_sandbox
  ON training_sessions(is_sandbox) WHERE is_sandbox = TRUE;

CREATE INDEX IF NOT EXISTS idx_meal_logs_sandbox
  ON meal_logs(is_sandbox) WHERE is_sandbox = TRUE;

CREATE INDEX IF NOT EXISTS idx_weight_entries_sandbox
  ON weight_entries(is_sandbox) WHERE is_sandbox = TRUE;


-- ============================================================================
-- Movive — Water & Supplement Daily Habit Tracking
-- Version: 00009
-- Purpose: Hydration tracking + daily supplement checklist for the Dashboard
--          "Daily Habits" section. Designed for future Calendar integration.
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 1: TABLES
-- ════════════════════════════════════════════════════════════════════════════════

-- ── Water logs ────────────────────────────────────────────────────────────────
-- One row per user per day. `intake_ml` is the running daily total; `goal_ml`
-- is the goal for that day (default 3000ml). Daily "reset" happens naturally
-- because each new day gets its own row (keyed by user_id + date). Historical
-- rows are preserved for future Calendar events (e.g. "Water goal reached").
CREATE TABLE water_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  intake_ml  INTEGER NOT NULL DEFAULT 0,
  goal_ml    INTEGER NOT NULL DEFAULT 3000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE TRIGGER water_logs_updated_at
  BEFORE UPDATE ON water_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Supplement logs ───────────────────────────────────────────────────────────
-- One row per user per day. `taken` is a JSONB array of supplement names taken
-- that day, e.g. ["Creatine","Whey Protein"]. Storing the list as JSONB makes
-- the supplement catalog fully expandable without schema changes (future-proof).
-- Daily reset is implicit: each day gets its own row (user_id + date).
CREATE TABLE supplement_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  taken      JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE TRIGGER supplement_logs_updated_at
  BEFORE UPDATE ON supplement_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 2: INDEXES
-- ════════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_water_logs_user_date ON water_logs(user_id, date DESC);
CREATE INDEX idx_supplement_logs_user_date ON supplement_logs(user_id, date DESC);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 3: ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;

-- water_logs policies
CREATE POLICY "water_logs_select_own"
  ON water_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "water_logs_insert_own"
  ON water_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "water_logs_update_own"
  ON water_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "water_logs_delete_own"
  ON water_logs FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "water_logs_select_admin"
  ON water_logs FOR SELECT
  USING (public.is_admin());

-- supplement_logs policies
CREATE POLICY "supplement_logs_select_own"
  ON supplement_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "supplement_logs_insert_own"
  ON supplement_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "supplement_logs_update_own"
  ON supplement_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "supplement_logs_delete_own"
  ON supplement_logs FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "supplement_logs_select_admin"
  ON supplement_logs FOR SELECT
  USING (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 4: COMMENTS
-- ════════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE water_logs IS 'Daily hydration tracking. One row per user per day; historical rows retained for future Calendar events (water goal reached).';
COMMENT ON COLUMN water_logs.intake_ml IS 'Running total of water consumed that day, in millilitres.';
COMMENT ON COLUMN water_logs.goal_ml IS 'Daily hydration goal in millilitres. Default 3000 (3L).';

COMMENT ON TABLE supplement_logs IS 'Daily supplement checklist. One row per user per day; historical rows retained for future Calendar events (supplements completed).';
COMMENT ON COLUMN supplement_logs.taken IS 'JSONB array of supplement names taken that day, e.g. ["Creatine","Whey Protein"]. JSONB keeps the catalog expandable without schema changes.';

-- ════════════════════════════════════════════════════════════════════════════════
-- GRANTS (for Supabase roles)
-- ════════════════════════════════════════════════════════════════════════════════

GRANT ALL ON water_logs TO authenticated;
GRANT ALL ON water_logs TO service_role;
GRANT ALL ON supplement_logs TO authenticated;
GRANT ALL ON supplement_logs TO service_role;

-- ════════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION 00009
-- ════════════════════════════════════════════════════════════════════════════════
