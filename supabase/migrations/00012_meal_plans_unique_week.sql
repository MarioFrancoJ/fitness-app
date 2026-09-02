-- ============================================================================
-- FitnessApp — Prevent duplicate weekly meal plans per user
-- Version: 00012
-- Purpose: meal_plans had no uniqueness on the week key, so duplicate rows for
--          the same (user, week) were possible (e.g. the legacy planner's
--          "Duplicate" action). Week navigation loads a week with maybeSingle(),
--          which errors if two rows match. This adds a unique index so a given
--          user can have at most one plan row per week.
--
-- Safe to apply: production currently has 0 duplicate (user_id, week_start_date,
-- week_end_date) rows, so the index builds cleanly.
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS meal_plans_user_week_unique
  ON meal_plans (user_id, week_start_date, week_end_date);

-- ============================================================================
-- END OF MIGRATION 00012
-- ============================================================================
