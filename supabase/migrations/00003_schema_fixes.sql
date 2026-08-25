-- ============================================================================
-- FitnessApp — Schema Fixes (from Architecture Validation Report)
-- Version: 00003
-- Date: 2026-08-25
-- Fixes: C1, H1, H2, H4, H5, H6, H7
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════════
-- FIX C1: Subscriptions INSERT policy for new users
--
-- Problem: Decision D3 requires that the client creates the FREE subscription
-- after signup. But the only INSERT policy was admin-only, so regular users
-- were blocked from inserting their own subscription.
--
-- Solution: Allow users to INSERT their own subscription ONLY if plan = 'FREE'.
-- This prevents self-upgrade while enabling the registration flow.
-- Premium subscriptions can only be created by admin/service role (Stripe webhook).
-- ════════════════════════════════════════════════════════════════════════════════

CREATE POLICY "subscriptions_insert_own_free"
  ON subscriptions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND plan = 'FREE'
    AND status = 'Active'
  );

-- ════════════════════════════════════════════════════════════════════════════════
-- FIX H1: Unique active subscription per user
--
-- Problem: Without a constraint, a user could accumulate multiple active
-- subscriptions (e.g., app code inserts twice due to a retry, or a race
-- condition during signup). This would break feature-gate logic that expects
-- a single active subscription.
--
-- Solution: Partial unique index ensuring only ONE subscription with status
-- 'Active' or 'Trial' can exist per user at any time. Expired/Cancelled rows
-- are excluded (historical records preserved).
-- ════════════════════════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX idx_subscriptions_user_active
  ON subscriptions(user_id)
  WHERE status IN ('Active', 'Trial');

-- ════════════════════════════════════════════════════════════════════════════════
-- FIX H2: Unique weight entry per user per date
--
-- Problem: A user could insert multiple weight entries for the same day,
-- producing confusing charts and incorrect AI context calculations.
-- The daily_checkins table correctly enforces UNIQUE(user_id, date) but
-- weight_entries did not.
--
-- Solution: Add a unique constraint. If the app needs to "update today's
-- weight", it should use UPSERT (INSERT ... ON CONFLICT ... DO UPDATE).
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE weight_entries
  ADD CONSTRAINT uq_weight_entries_user_date UNIQUE(user_id, date);

-- ════════════════════════════════════════════════════════════════════════════════
-- FIX H4: Unique step number per recipe
--
-- Problem: Nothing prevented duplicate step_number values within a recipe
-- (e.g., two "Step 1" entries). This would produce garbled recipe instructions.
--
-- Solution: Composite unique constraint on (recipe_id, step_number).
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE recipe_instructions
  ADD CONSTRAINT uq_recipe_instructions_step UNIQUE(recipe_id, step_number);

-- ════════════════════════════════════════════════════════════════════════════════
-- FIX H5: Unique day name per workout
--
-- Problem: A workout could have two "Monday" entries. The data model uses
-- day_name as a logical identifier within a workout (the frontend renders
-- one tab per day).
--
-- Solution: Composite unique constraint on (workout_id, day_name).
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE workout_days
  ADD CONSTRAINT uq_workout_days_workout_day UNIQUE(workout_id, day_name);

-- ════════════════════════════════════════════════════════════════════════════════
-- FIX H6: Remove redundant index on users.email
--
-- Problem: The column users.email is declared UNIQUE NOT NULL, which
-- automatically creates an implicit unique B-tree index. The explicit
-- idx_users_email creates a second, redundant index that wastes storage
-- and slightly slows INSERT/UPDATE operations.
--
-- Solution: Drop the manually-created index. The UNIQUE constraint's
-- implicit index remains and serves the same purpose.
-- ════════════════════════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS idx_users_email;

-- ════════════════════════════════════════════════════════════════════════════════
-- FIX H7: Remove redundant index on platform_settings.key
--
-- Problem: Same as H6. platform_settings.key is UNIQUE NOT NULL, which
-- already creates an implicit unique index. The explicit idx_platform_settings_key
-- is redundant.
--
-- Solution: Drop the manually-created index.
-- ════════════════════════════════════════════════════════════════════════════════

DROP INDEX IF EXISTS idx_platform_settings_key;

-- ════════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION 00003
-- ════════════════════════════════════════════════════════════════════════════════
