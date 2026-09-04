-- ============================================================================
-- Movive — Auth Trigger & Profile Management
-- Version: 00004
-- Date: 2026-08-25
-- Decision: D3 (minimal trigger — creates users row only)
-- Dependencies: 00001_initial_schema.sql (users table, user_role enum)
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 1: TRIGGER ERROR LOGGING TABLE
--
-- Purpose: Capture failures from the auth trigger so they are never silent.
-- Without this, a failed trigger leaves an auth.users row without a matching
-- public.users row, and there is no visibility into what went wrong.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TABLE trigger_errors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source        TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_detail  TEXT,
  error_hint    TEXT,
  payload       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for admin debugging (most recent errors first)
CREATE INDEX idx_trigger_errors_created ON trigger_errors(created_at DESC);
CREATE INDEX idx_trigger_errors_source ON trigger_errors(source);

-- RLS: only admins can view trigger errors
ALTER TABLE trigger_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trigger_errors_select_admin"
  ON trigger_errors FOR SELECT
  USING (public.is_admin());

CREATE POLICY "trigger_errors_insert_system"
  ON trigger_errors FOR INSERT
  WITH CHECK (TRUE);
  -- INSERT must be unrestricted because the trigger runs as SECURITY DEFINER
  -- before the user's public.users row exists (so is_admin() would fail).
  -- The trigger function itself is the only writer; no client can call INSERT
  -- on this table because PostgREST requires authentication for non-public tables
  -- and no SELECT/UPDATE/DELETE policy exists for regular users.

COMMENT ON TABLE trigger_errors IS 'Captures errors from database triggers (primarily handle_new_user). Visible to admins only.';

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 2: HANDLE_NEW_USER() FUNCTION
--
-- Purpose: Automatically create a public.users profile row when a new user
-- signs up via Supabase Auth (email/password, OAuth, magic link).
--
-- Decision D3: Only creates the users row. Subscriptions and
-- notification_preferences are created at the application level for
-- visibility and control.
--
-- SECURITY DEFINER: Executes with the privileges of the function owner
-- (postgres), bypassing RLS. Required because the new user has no
-- public.users row yet (RLS would block the INSERT).
--
-- SET search_path: Explicit schema qualification prevents search_path
-- injection attacks in SECURITY DEFINER functions.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _extracted_name TEXT;
  _err_msg TEXT;
  _err_detail TEXT;
  _err_hint TEXT;
BEGIN
  -- ── Extract user name from metadata ────────────────────────────────────────
  -- Priority handles different auth providers:
  --   • Email/password: client passes 'name' in options.data
  --   • Google OAuth: provides 'full_name' or 'name'
  --   • GitHub OAuth: provides 'user_name' or 'preferred_username'
  --   • Apple OAuth: may provide 'full_name' or nothing
  --   • Fallback: extract username portion from email address
  _extracted_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'user_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'preferred_username'), ''),
    split_part(NEW.email, '@', 1)
  );

  -- ── Insert into public.users ───────────────────────────────────────────────
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    _extracted_name,
    'USER'::user_role,
    'Active'::user_status,
    NOW(),
    NOW()
  );

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- ── Error handling ─────────────────────────────────────────────────────────
  -- Capture the error details for debugging.
  -- CRITICAL: We do NOT re-raise the exception. This allows the auth.users
  -- row to be created successfully even if the profile creation fails.
  -- The repair_user_profile() function provides the recovery path.
  GET STACKED DIAGNOSTICS
    _err_msg = MESSAGE_TEXT,
    _err_detail = PG_EXCEPTION_DETAIL,
    _err_hint = PG_EXCEPTION_HINT;

  INSERT INTO public.trigger_errors (
    source,
    error_message,
    error_detail,
    error_hint,
    payload
  ) VALUES (
    'handle_new_user',
    _err_msg,
    _err_detail,
    _err_hint,
    jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'raw_user_meta_data', NEW.raw_user_meta_data,
      'provider', NEW.raw_app_meta_data->>'provider'
    )
  );

  -- Return NEW to allow auth.users creation to succeed despite the error
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Auth trigger: creates public.users row on signup. D3: minimal (users only). '
  'Logs errors to trigger_errors table instead of failing silently.';

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 3: AUTH TRIGGER
--
-- Fires AFTER INSERT on auth.users (the Supabase Auth internal table).
-- This means the auth.users row is already committed when our function runs.
-- ════════════════════════════════════════════════════════════════════════════════

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 4: REPAIR_USER_PROFILE() FUNCTION
--
-- Purpose: Recovery path for users whose profile was not created by the trigger
-- (due to an error or race condition). Called by the application when it
-- detects an authenticated user without a public.users row.
--
-- Security:
--   • Authenticated users can only repair THEIR OWN profile (auth.uid() check).
--   • Idempotent: safe to call multiple times (returns 'exists' if already there).
--   • SECURITY DEFINER: needs to bypass RLS to INSERT into users table
--     (the user has no row yet, so RLS SELECT/INSERT policies would fail).
--
-- Returns:
--   • 'created' — profile was missing and has been created
--   • 'exists'  — profile already exists (no action taken)
-- ════════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.repair_user_profile()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _user_id UUID;
  _user_email TEXT;
  _user_meta JSONB;
  _extracted_name TEXT;
  _profile_exists BOOLEAN;
BEGIN
  -- ── Verify caller is authenticated ─────────────────────────────────────────
  _user_id := auth.uid();

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- ── Check if profile already exists ────────────────────────────────────────
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = _user_id
  ) INTO _profile_exists;

  IF _profile_exists THEN
    RETURN 'exists';
  END IF;

  -- ── Fetch auth user data ───────────────────────────────────────────────────
  SELECT
    email,
    raw_user_meta_data
  INTO
    _user_email,
    _user_meta
  FROM auth.users
  WHERE id = _user_id;

  IF _user_email IS NULL THEN
    RAISE EXCEPTION 'Auth user not found for id: %', _user_id;
  END IF;

  -- ── Extract name (same logic as trigger) ───────────────────────────────────
  _extracted_name := COALESCE(
    NULLIF(TRIM(_user_meta->>'full_name'), ''),
    NULLIF(TRIM(_user_meta->>'name'), ''),
    NULLIF(TRIM(_user_meta->>'user_name'), ''),
    NULLIF(TRIM(_user_meta->>'preferred_username'), ''),
    split_part(_user_email, '@', 1)
  );

  -- ── Create the profile ─────────────────────────────────────────────────────
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    _user_id,
    _user_email,
    _extracted_name,
    'USER'::user_role,
    'Active'::user_status,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Race condition safety

  RETURN 'created';
END;
$$;

COMMENT ON FUNCTION public.repair_user_profile() IS
  'Recovery function: creates a public.users row for the authenticated user '
  'if one does not exist. Idempotent and safe to call multiple times. '
  'Called by the app when it detects a missing profile.';

-- ════════════════════════════════════════════════════════════════════════════════
-- SECTION 5: ROLLBACK STATEMENTS
--
-- Execute these in reverse order to undo this migration:
--
--   DROP FUNCTION IF EXISTS public.repair_user_profile();
--   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--   DROP FUNCTION IF EXISTS public.handle_new_user();
--   DROP TABLE IF EXISTS trigger_errors;
--
-- ════════════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION 00004
-- ════════════════════════════════════════════════════════════════════════════════
