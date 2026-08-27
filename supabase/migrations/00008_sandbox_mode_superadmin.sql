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
