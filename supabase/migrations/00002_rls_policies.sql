-- ============================================================================
-- FitnessApp — Row Level Security Policies
-- Version: 00002
-- Date: 2026-08-25
-- Architecture: Supabase Only
-- Decisions: D1 (user_id on child tables), D2 (subscriptions read-only)
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 1: ADMIN HELPER FUNCTION
-- ════════════════════════════════════════════════════════════════════════════════

-- Reusable function to check if the current user has admin privileges.
-- SECURITY DEFINER: executes with the function owner's permissions (bypasses RLS on users table).
-- STABLE: result does not change within a single SQL statement (allows PostgreSQL to cache).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'SUPER_ADMIN')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin() IS 'Returns TRUE if the authenticated user has ADMIN or SUPER_ADMIN role. Used in RLS policies.';

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 2: ENABLE RLS ON ALL TABLES
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 3: USERS TABLE
-- ════════════════════════════════════════════════════════════════════════════════

-- Users can read their own profile
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  USING (is_admin());

-- Admins can update any user (role changes, suspensions)
CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- No direct INSERT policy — users are created via auth trigger (P1-14)
-- No DELETE policy — soft delete via status = 'Deleted'

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 4: SUBSCRIPTIONS (D2 — Read-only for users)
-- ════════════════════════════════════════════════════════════════════════════════

-- Users can only SELECT their own subscription
CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all subscriptions
CREATE POLICY "subscriptions_select_admin"
  ON subscriptions FOR SELECT
  USING (is_admin());

-- Admins can insert subscriptions (for manual grants)
CREATE POLICY "subscriptions_insert_admin"
  ON subscriptions FOR INSERT
  WITH CHECK (is_admin());

-- Admins can update subscriptions (for manual changes)
CREATE POLICY "subscriptions_update_admin"
  ON subscriptions FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- No user INSERT/UPDATE/DELETE policies.
-- Subscription modifications happen via:
--   1. Service role (Stripe webhook handler)
--   2. Admin dashboard (is_admin() policies above)
--   3. App-level code using service role after signup (creating FREE plan)

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 5: WEIGHT & MEASUREMENTS (User-owned)
-- ════════════════════════════════════════════════════════════════════════════════

-- ── weight_entries ────────────────────────────────────────────────────────────

CREATE POLICY "weight_entries_select_own"
  ON weight_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "weight_entries_insert_own"
  ON weight_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "weight_entries_update_own"
  ON weight_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "weight_entries_delete_own"
  ON weight_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ── measurement_entries ───────────────────────────────────────────────────────

CREATE POLICY "measurement_entries_select_own"
  ON measurement_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "measurement_entries_insert_own"
  ON measurement_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "measurement_entries_update_own"
  ON measurement_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "measurement_entries_delete_own"
  ON measurement_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ── progress_photos ───────────────────────────────────────────────────────────

CREATE POLICY "progress_photos_select_own"
  ON progress_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "progress_photos_insert_own"
  ON progress_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress_photos_update_own"
  ON progress_photos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress_photos_delete_own"
  ON progress_photos FOR DELETE
  USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 6: INGREDIENTS, RECIPES (Shared read, admin write)
-- ════════════════════════════════════════════════════════════════════════════════

-- ── ingredients ───────────────────────────────────────────────────────────────

CREATE POLICY "ingredients_select_authenticated"
  ON ingredients FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "ingredients_insert_admin"
  ON ingredients FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "ingredients_update_admin"
  ON ingredients FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "ingredients_delete_admin"
  ON ingredients FOR DELETE
  USING (is_admin());

-- ── recipes ───────────────────────────────────────────────────────────────────

CREATE POLICY "recipes_select_authenticated"
  ON recipes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "recipes_insert_admin"
  ON recipes FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "recipes_update_admin"
  ON recipes FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "recipes_delete_admin"
  ON recipes FOR DELETE
  USING (is_admin());

-- ── recipe_ingredients ────────────────────────────────────────────────────────

CREATE POLICY "recipe_ingredients_select_authenticated"
  ON recipe_ingredients FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "recipe_ingredients_insert_admin"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "recipe_ingredients_update_admin"
  ON recipe_ingredients FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "recipe_ingredients_delete_admin"
  ON recipe_ingredients FOR DELETE
  USING (is_admin());

-- ── recipe_instructions ───────────────────────────────────────────────────────

CREATE POLICY "recipe_instructions_select_authenticated"
  ON recipe_instructions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "recipe_instructions_insert_admin"
  ON recipe_instructions FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "recipe_instructions_update_admin"
  ON recipe_instructions FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "recipe_instructions_delete_admin"
  ON recipe_instructions FOR DELETE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 7: EXERCISES (Shared read, admin write)
-- ════════════════════════════════════════════════════════════════════════════════

CREATE POLICY "exercises_select_authenticated"
  ON exercises FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "exercises_insert_admin"
  ON exercises FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "exercises_update_admin"
  ON exercises FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "exercises_delete_admin"
  ON exercises FOR DELETE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 8: WORKOUTS (User-owned + template support)
-- ════════════════════════════════════════════════════════════════════════════════

-- ── workouts ──────────────────────────────────────────────────────────────────

-- Users can see their own workouts AND system templates (user_id IS NULL)
CREATE POLICY "workouts_select_own_and_templates"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "workouts_insert_own"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workouts_update_own"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workouts_delete_own"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can manage all workouts (including templates)
CREATE POLICY "workouts_all_admin"
  ON workouts FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── workout_days (D1: has user_id) ───────────────────────────────────────────

-- Users see own workout days AND template days (user_id IS NULL)
CREATE POLICY "workout_days_select_own_and_templates"
  ON workout_days FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "workout_days_insert_own"
  ON workout_days FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_days_update_own"
  ON workout_days FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_days_delete_own"
  ON workout_days FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "workout_days_all_admin"
  ON workout_days FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ── workout_exercises (D1: has user_id) ──────────────────────────────────────

-- Users see own workout exercises AND template exercises (user_id IS NULL)
CREATE POLICY "workout_exercises_select_own_and_templates"
  ON workout_exercises FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "workout_exercises_insert_own"
  ON workout_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_exercises_update_own"
  ON workout_exercises FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_exercises_delete_own"
  ON workout_exercises FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "workout_exercises_all_admin"
  ON workout_exercises FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 9: TRAINING SESSIONS (User-owned, D1 applied)
-- ════════════════════════════════════════════════════════════════════════════════

-- ── training_sessions ─────────────────────────────────────────────────────────

CREATE POLICY "training_sessions_select_own"
  ON training_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "training_sessions_insert_own"
  ON training_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "training_sessions_update_own"
  ON training_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "training_sessions_delete_own"
  ON training_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ── session_exercise_logs (D1: has user_id) ──────────────────────────────────

CREATE POLICY "session_exercise_logs_select_own"
  ON session_exercise_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "session_exercise_logs_insert_own"
  ON session_exercise_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "session_exercise_logs_update_own"
  ON session_exercise_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "session_exercise_logs_delete_own"
  ON session_exercise_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ── session_set_logs (D1: has user_id) ───────────────────────────────────────

CREATE POLICY "session_set_logs_select_own"
  ON session_set_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "session_set_logs_insert_own"
  ON session_set_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "session_set_logs_update_own"
  ON session_set_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "session_set_logs_delete_own"
  ON session_set_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 10: NUTRITION (User-owned)
-- ════════════════════════════════════════════════════════════════════════════════

-- ── meal_logs ─────────────────────────────────────────────────────────────────

CREATE POLICY "meal_logs_select_own"
  ON meal_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "meal_logs_insert_own"
  ON meal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_logs_update_own"
  ON meal_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_logs_delete_own"
  ON meal_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ── meal_plans ────────────────────────────────────────────────────────────────

CREATE POLICY "meal_plans_select_own"
  ON meal_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "meal_plans_insert_own"
  ON meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_plans_update_own"
  ON meal_plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_plans_delete_own"
  ON meal_plans FOR DELETE
  USING (auth.uid() = user_id);

-- ── shopping_lists ────────────────────────────────────────────────────────────

CREATE POLICY "shopping_lists_select_own"
  ON shopping_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "shopping_lists_insert_own"
  ON shopping_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shopping_lists_update_own"
  ON shopping_lists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shopping_lists_delete_own"
  ON shopping_lists FOR DELETE
  USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 11: NOTIFICATIONS (User-owned)
-- ════════════════════════════════════════════════════════════════════════════════

-- ── notifications ─────────────────────────────────────────────────────────────

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own notifications (system-generated via app code)
CREATE POLICY "notifications_insert_own"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own (mark as read/archived)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can send notifications to any user (broadcast)
CREATE POLICY "notifications_insert_admin"
  ON notifications FOR INSERT
  WITH CHECK (is_admin());

-- ── notification_preferences ──────────────────────────────────────────────────

CREATE POLICY "notification_preferences_select_own"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notification_preferences_insert_own"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_preferences_update_own"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No delete — preferences always exist once created

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 12: RECOMMENDATIONS
-- ════════════════════════════════════════════════════════════════════════════════

-- ── recommendations (user-owned) ──────────────────────────────────────────────

CREATE POLICY "recommendations_select_own"
  ON recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "recommendations_insert_own"
  ON recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recommendations_update_own"
  ON recommendations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recommendations_delete_own"
  ON recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- ── recommendation_rules (shared read, admin write) ───────────────────────────

CREATE POLICY "recommendation_rules_select_authenticated"
  ON recommendation_rules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "recommendation_rules_insert_admin"
  ON recommendation_rules FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "recommendation_rules_update_admin"
  ON recommendation_rules FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "recommendation_rules_delete_admin"
  ON recommendation_rules FOR DELETE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 13: AI (User-owned)
-- ════════════════════════════════════════════════════════════════════════════════

-- ── ai_chat_messages ──────────────────────────────────────────────────────────

CREATE POLICY "ai_chat_messages_select_own"
  ON ai_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_chat_messages_insert_own"
  ON ai_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No update — chat messages are immutable
-- No delete — preserve conversation history (admin can purge via service role)

-- ── ai_usage ──────────────────────────────────────────────────────────────────

CREATE POLICY "ai_usage_select_own"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_usage_insert_own"
  ON ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No update/delete — usage records are immutable audit entries

-- Admins can view all AI usage (analytics)
CREATE POLICY "ai_usage_select_admin"
  ON ai_usage FOR SELECT
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 14: DAILY CHECK-INS (User-owned)
-- ════════════════════════════════════════════════════════════════════════════════

CREATE POLICY "daily_checkins_select_own"
  ON daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_checkins_insert_own"
  ON daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_checkins_update_own"
  ON daily_checkins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_checkins_delete_own"
  ON daily_checkins FOR DELETE
  USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 15: FEEDBACK & BETA
-- ════════════════════════════════════════════════════════════════════════════════

-- ── beta_registrations ────────────────────────────────────────────────────────

-- Anyone can insert (public signup form, no auth required)
CREATE POLICY "beta_registrations_insert_public"
  ON beta_registrations FOR INSERT
  WITH CHECK (TRUE);

-- Only admins can read beta registrations
CREATE POLICY "beta_registrations_select_admin"
  ON beta_registrations FOR SELECT
  USING (is_admin());

-- ── feedback ──────────────────────────────────────────────────────────────────

-- Users can see their own feedback
CREATE POLICY "feedback_select_own"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Users can submit feedback
CREATE POLICY "feedback_insert_own"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own feedback (add details)
CREATE POLICY "feedback_update_own"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all feedback
CREATE POLICY "feedback_select_admin"
  ON feedback FOR SELECT
  USING (is_admin());

-- Admins can update feedback (change status/priority)
CREATE POLICY "feedback_update_admin"
  ON feedback FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 16: AUDIT & PLATFORM (Admin-only)
-- ════════════════════════════════════════════════════════════════════════════════

-- ── audit_log ─────────────────────────────────────────────────────────────────

-- Only admins can read audit logs
CREATE POLICY "audit_log_select_admin"
  ON audit_log FOR SELECT
  USING (is_admin());

-- Audit entries are inserted by service role or admin
CREATE POLICY "audit_log_insert_admin"
  ON audit_log FOR INSERT
  WITH CHECK (is_admin());

-- No update/delete — audit logs are immutable

-- ── platform_settings ─────────────────────────────────────────────────────────

-- Admins can read platform settings
CREATE POLICY "platform_settings_select_admin"
  ON platform_settings FOR SELECT
  USING (is_admin());

-- Admins can modify platform settings
CREATE POLICY "platform_settings_insert_admin"
  ON platform_settings FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "platform_settings_update_admin"
  ON platform_settings FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "platform_settings_delete_admin"
  ON platform_settings FOR DELETE
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 17: ADMIN FULL ACCESS (catch-all for user-owned tables)
-- 
-- Admins need to view user data for support/moderation.
-- These policies grant SELECT access to admins on user-owned tables.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE POLICY "weight_entries_select_admin"
  ON weight_entries FOR SELECT
  USING (is_admin());

CREATE POLICY "measurement_entries_select_admin"
  ON measurement_entries FOR SELECT
  USING (is_admin());

CREATE POLICY "progress_photos_select_admin"
  ON progress_photos FOR SELECT
  USING (is_admin());

CREATE POLICY "training_sessions_select_admin"
  ON training_sessions FOR SELECT
  USING (is_admin());

CREATE POLICY "session_exercise_logs_select_admin"
  ON session_exercise_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "session_set_logs_select_admin"
  ON session_set_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "meal_logs_select_admin"
  ON meal_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "meal_plans_select_admin"
  ON meal_plans FOR SELECT
  USING (is_admin());

CREATE POLICY "shopping_lists_select_admin"
  ON shopping_lists FOR SELECT
  USING (is_admin());

CREATE POLICY "notifications_select_admin"
  ON notifications FOR SELECT
  USING (is_admin());

CREATE POLICY "recommendations_select_admin"
  ON recommendations FOR SELECT
  USING (is_admin());

CREATE POLICY "ai_chat_messages_select_admin"
  ON ai_chat_messages FOR SELECT
  USING (is_admin());

CREATE POLICY "daily_checkins_select_admin"
  ON daily_checkins FOR SELECT
  USING (is_admin());

-- ════════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION 00002
-- ════════════════════════════════════════════════════════════════════════════════
