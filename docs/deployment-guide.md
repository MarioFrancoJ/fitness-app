# FitnessApp — Supabase Deployment Guide

**Phase:** 1  
**Task:** P1-06B  
**Date:** August 25, 2026  
**Prerequisite:** A Supabase project exists and credentials are known

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Link Local Project to Supabase](#2-link-local-project-to-supabase)
3. [Apply Migrations](#3-apply-migrations)
4. [Execute Seed Data](#4-execute-seed-data)
5. [Create Admin Account](#5-create-admin-account)
6. [Promote Admin to SUPER_ADMIN](#6-promote-admin-to-super_admin)
7. [Verification](#7-verification)
8. [Rollback Instructions](#8-rollback-instructions)
9. [Risks & Troubleshooting](#9-risks--troubleshooting)

---

## 1. Prerequisites

Before starting, confirm:

- [ ] Supabase project created (Dashboard accessible)
- [ ] Project Reference ID known (from project URL: `https://supabase.com/dashboard/project/<REF>`)
- [ ] Database password available
- [ ] `.env.local` configured with:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://<REF>.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  ```
- [ ] Node.js installed (v18+)
- [ ] `supabase` CLI installed (via `npm install -D supabase` or globally)

**Verify CLI installation:**

```bash
npx supabase --version
```

Expected output: `1.x.x` or higher.

---

## 2. Link Local Project to Supabase

### Step 2.1 — Authenticate

```bash
npx supabase login
```

This opens a browser window to authenticate with your Supabase account. After login, the CLI stores a token locally at `~/.supabase/access-token`.

**Verify:**

```bash
npx supabase projects list
```

Should display your project(s).

### Step 2.2 — Initialize Supabase Locally (if not done)

If you don't have a `supabase/config.toml` yet:

```bash
npx supabase init
```

This creates the `supabase/` directory structure. Since we already have `supabase/migrations/` and `supabase/seed.sql`, it will merge with existing files.

### Step 2.3 — Link to Remote Project

```bash
npx supabase link --project-ref <YOUR_PROJECT_REF>
```

Replace `<YOUR_PROJECT_REF>` with the reference ID from your Supabase Dashboard URL.

**When prompted for database password:** Enter the password set during project creation.

**Verify link:**

```bash
npx supabase db remote commit
```

This should succeed without errors (creates a baseline migration entry if the remote DB is empty).

---

## 3. Apply Migrations

### Option A: Using `supabase db push` (Recommended for First Deploy)

This applies all pending migrations in the `supabase/migrations/` directory to the remote database:

```bash
npx supabase db push
```

**What this does:**
1. Reads all files in `supabase/migrations/` in alphabetical order
2. Checks which have already been applied (via `supabase_migrations.schema_migrations` table)
3. Applies pending ones sequentially

**Expected output:**

```
Applying migration 00001_initial_schema.sql...
Applying migration 00002_rls_policies.sql...
Applying migration 00003_schema_fixes.sql...
Applying migration 00004_auth_trigger.sql...
Finished supabase db push.
```

### Option B: Manual SQL Execution (If CLI fails)

If `db push` encounters issues, apply migrations manually via Supabase Studio:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Paste and execute each file in order:

```
Order:
  1. 00001_initial_schema.sql
  2. 00002_rls_policies.sql
  3. 00003_schema_fixes.sql
  4. 00004_auth_trigger.sql
```

**⚠️ CRITICAL: Execute in exact order. Each migration depends on the previous.**

**After each execution:**
- Check for errors in the output panel
- Verify "Success. No rows returned" (for DDL statements)
- If any statement fails, do NOT proceed to the next migration

### Verifying Migrations Applied

```bash
npx supabase migration list
```

Should show all 4 migrations with status `Applied`.

---

## 4. Execute Seed Data

Seed data is NOT applied automatically by `db push`. It must be executed separately.

### Option A: Using Supabase CLI

```bash
npx supabase db reset --linked
```

**⚠️ WARNING:** `db reset` drops and recreates the ENTIRE database, then applies all migrations AND seed.sql. Only use this on a fresh project with no user data.

### Option B: Execute Seed Directly (Recommended)

Use the SQL Editor in Supabase Dashboard:

1. Go to **Dashboard** → **SQL Editor**
2. Click **New Query**
3. Paste the entire contents of `supabase/seed.sql`
4. Click **Run**

**Expected result:** "Success" with no errors.

### Option C: Using psql (if available)

```bash
psql "postgresql://postgres:<PASSWORD>@db.<REF>.supabase.co:5432/postgres" -f supabase/seed.sql
```

Replace `<PASSWORD>` and `<REF>` with your values.

### Verify Seed Applied

Run in SQL Editor:

```sql
SELECT 'ingredients' AS table_name, count(*) FROM ingredients
UNION ALL SELECT 'exercises', count(*) FROM exercises
UNION ALL SELECT 'recipes', count(*) FROM recipes
UNION ALL SELECT 'recipe_ingredients', count(*) FROM recipe_ingredients
UNION ALL SELECT 'recipe_instructions', count(*) FROM recipe_instructions
UNION ALL SELECT 'workouts', count(*) FROM workouts
UNION ALL SELECT 'workout_days', count(*) FROM workout_days
UNION ALL SELECT 'workout_exercises', count(*) FROM workout_exercises
UNION ALL SELECT 'recommendation_rules', count(*) FROM recommendation_rules
UNION ALL SELECT 'platform_settings', count(*) FROM platform_settings;
```

**Expected:**

| table_name | count |
|------------|-------|
| ingredients | 50 |
| exercises | 50 |
| recipes | 12 |
| recipe_ingredients | 43 |
| recipe_instructions | 39 |
| workouts | 8 |
| workout_days | 24 |
| workout_exercises | 93 |
| recommendation_rules | 14 |
| platform_settings | 6 |

---

## 5. Create Admin Account

The admin account must be created in Supabase Auth AFTER the trigger migration (00004) is applied. This ensures the trigger automatically creates the `public.users` row.

### Step 5.1 — Create via Dashboard

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Fill in:
   - **Email:** `admin@fitnessapp.com`
   - **Password:** Choose a strong password (NOT `Admin123!`)
   - **Auto Confirm User:** ✅ Checked (bypasses email confirmation)
4. Click **Create user**

### Step 5.2 — Verify Trigger Fired

Run in SQL Editor:

```sql
SELECT id, email, name, role, status, created_at
FROM users
WHERE email = 'admin@fitnessapp.com';
```

**Expected:** One row with `role = 'USER'` (trigger default).

If no row appears, check `trigger_errors`:

```sql
SELECT * FROM trigger_errors ORDER BY created_at DESC LIMIT 5;
```

### Step 5.3 — Note the Admin UUID

Copy the `id` value from the query above. You'll need it if ever doing manual operations.

---

## 6. Promote Admin to SUPER_ADMIN

After the admin user exists in `public.users`, promote their role:

### Option A: Run the Seed (If Not Already Run)

The seed file includes the promotion:

```sql
UPDATE users
SET role = 'SUPER_ADMIN', updated_at = NOW()
WHERE email = 'admin@fitnessapp.com';
```

If seed was already run BEFORE creating the admin, re-run just this statement.

### Option B: Direct SQL

Run in SQL Editor:

```sql
UPDATE users
SET role = 'SUPER_ADMIN', updated_at = NOW()
WHERE email = 'admin@fitnessapp.com';
```

### Verify Promotion

```sql
SELECT email, role, status FROM users WHERE email = 'admin@fitnessapp.com';
```

**Expected:** `role = 'SUPER_ADMIN'`

### Test Admin Login

1. Go to the app login page
2. Enter `admin@fitnessapp.com` + password
3. Verify redirect to `/admin` (once auth is implemented)
4. Verify `is_admin()` returns TRUE:

```sql
-- Run as the admin user (set role in SQL Editor):
SET request.jwt.claims = '{"sub": "<ADMIN_UUID>"}';
SELECT is_admin();
-- Expected: TRUE
```

---

## 7. Verification

### 7.1 — Table Count

```sql
SELECT count(*)
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';
```

**Expected:** `31` (30 from schema + 1 `trigger_errors` from 00004)

### 7.2 — Enum Count

```sql
SELECT count(*)
FROM pg_type
WHERE typtype = 'e'
AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

**Expected:** `25`

### 7.3 — Users Table Structure

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;
```

**Verify:** `id` is UUID, no `password_hash` column, `role` uses `user_role` enum.

### 7.4 — RLS Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = TRUE;
```

**Expected:** 31 rows (all tables have RLS enabled).

### 7.5 — Policy Count

```sql
SELECT count(*)
FROM pg_policies
WHERE schemaname = 'public';
```

**Expected:** `131` (130 from 00002 + 1 from 00003 subscription fix)

### 7.6 — Trigger Exists

```sql
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
AND trigger_name = 'on_auth_user_created';
```

**Expected:** One row showing `INSERT`, `AFTER`.

### 7.7 — Functions Exist

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
```

**Expected includes:**
- `handle_new_user`
- `is_admin`
- `repair_user_profile`
- `update_updated_at`

### 7.8 — Indexes Count

```sql
SELECT count(*)
FROM pg_indexes
WHERE schemaname = 'public';
```

**Expected:** ~50+ (52 from schema minus 2 dropped in fixes, plus implicit UNIQUE indexes)

### 7.9 — Foreign Key Integrity (Seed Data)

```sql
-- Verify no orphaned workout_exercises → exercises references
SELECT we.id, we.exercise_name
FROM workout_exercises we
LEFT JOIN exercises e ON e.id = we.exercise_id
WHERE we.exercise_id IS NOT NULL AND e.id IS NULL;
-- Expected: 0 rows

-- Verify no orphaned recipe_ingredients → ingredients references
SELECT ri.id, ri.name
FROM recipe_ingredients ri
LEFT JOIN ingredients i ON i.id = ri.ingredient_id
WHERE ri.ingredient_id IS NOT NULL AND i.id IS NULL;
-- Expected: 0 rows
```

### 7.10 — Full Validation Script

Run this single query to validate everything at once:

```sql
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS tables,
  (SELECT count(*) FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) AS enums,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') AS policies,
  (SELECT count(*) FROM ingredients) AS ingredients,
  (SELECT count(*) FROM exercises) AS exercises,
  (SELECT count(*) FROM recipes) AS recipes,
  (SELECT count(*) FROM workouts WHERE is_template = TRUE) AS templates,
  (SELECT count(*) FROM recommendation_rules) AS rules,
  (SELECT count(*) FROM platform_settings) AS settings,
  (SELECT count(*) FROM users WHERE role = 'SUPER_ADMIN') AS admins;
```

**Expected:**

| tables | enums | policies | ingredients | exercises | recipes | templates | rules | settings | admins |
|--------|-------|----------|-------------|-----------|---------|-----------|-------|----------|--------|
| 31 | 25 | 131 | 50 | 50 | 12 | 8 | 14 | 6 | 1 |

---

## 8. Rollback Instructions

### Rollback Migration 00004 (Auth Trigger)

```sql
DROP FUNCTION IF EXISTS public.repair_user_profile();
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS trigger_errors;
```

### Rollback Migration 00003 (Schema Fixes)

```sql
DROP POLICY IF EXISTS "subscriptions_insert_own_free" ON subscriptions;
DROP INDEX IF EXISTS idx_subscriptions_user_active;
ALTER TABLE weight_entries DROP CONSTRAINT IF EXISTS uq_weight_entries_user_date;
ALTER TABLE recipe_instructions DROP CONSTRAINT IF EXISTS uq_recipe_instructions_step;
ALTER TABLE workout_days DROP CONSTRAINT IF EXISTS uq_workout_days_workout_day;
-- Recreate dropped indexes (from 00001):
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_platform_settings_key ON platform_settings(key);
```

### Rollback Migration 00002 (RLS Policies)

```sql
-- Disable RLS on all tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', t);
  END LOOP;
END;
$$;

-- Drop all policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END;
$$;

-- Drop helper function
DROP FUNCTION IF EXISTS public.is_admin();
```

### Rollback Migration 00001 (Full Schema)

**⚠️ DESTRUCTIVE: Drops ALL tables and data.**

```sql
-- Drop all tables in dependency order (children first)
DROP TABLE IF EXISTS session_set_logs CASCADE;
DROP TABLE IF EXISTS session_exercise_logs CASCADE;
DROP TABLE IF EXISTS training_sessions CASCADE;
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS workout_days CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;
DROP TABLE IF EXISTS recipe_instructions CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS shopping_lists CASCADE;
DROP TABLE IF EXISTS meal_plans CASCADE;
DROP TABLE IF EXISTS meal_logs CASCADE;
DROP TABLE IF EXISTS daily_checkins CASCADE;
DROP TABLE IF EXISTS ai_usage CASCADE;
DROP TABLE IF EXISTS ai_chat_messages CASCADE;
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS recommendation_rules CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS progress_photos CASCADE;
DROP TABLE IF EXISTS measurement_entries CASCADE;
DROP TABLE IF EXISTS weight_entries CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS beta_registrations CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS trigger_errors CASCADE;

-- Drop all enums
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS plan_type CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS exercise_category CASCADE;
DROP TYPE IF EXISTS muscle_group CASCADE;
DROP TYPE IF EXISTS equipment_type CASCADE;
DROP TYPE IF EXISTS exercise_difficulty CASCADE;
DROP TYPE IF EXISTS workout_goal CASCADE;
DROP TYPE IF EXISTS training_session_status CASCADE;
DROP TYPE IF EXISTS meal_type CASCADE;
DROP TYPE IF EXISTS recipe_goal CASCADE;
DROP TYPE IF EXISTS ingredient_category CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_priority CASCADE;
DROP TYPE IF EXISTS notification_status CASCADE;
DROP TYPE IF EXISTS reminder_frequency CASCADE;
DROP TYPE IF EXISTS photo_type CASCADE;
DROP TYPE IF EXISTS recommendation_priority CASCADE;
DROP TYPE IF EXISTS recommendation_status CASCADE;
DROP TYPE IF EXISTS recommendation_category CASCADE;
DROP TYPE IF EXISTS feedback_type CASCADE;
DROP TYPE IF EXISTS feedback_status CASCADE;
DROP TYPE IF EXISTS ai_provider_type CASCADE;
DROP TYPE IF EXISTS ai_chat_role CASCADE;

-- Drop utility function
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
```

### Full Reset (Nuclear Option)

```bash
npx supabase db reset --linked
```

This drops everything, re-applies all migrations, and runs `seed.sql`. Use only when you want a completely fresh database.

---

## 9. Risks & Troubleshooting

### Risk 1: `db push` fails with "relation auth.users does not exist"

**Cause:** The `users` table references `auth.users(id)` which is a Supabase internal table. This reference works on Supabase but may fail on local PostgreSQL.

**Fix:** Only use `db push` against a real Supabase project (not a generic PostgreSQL instance).

### Risk 2: Migration order matters

**Cause:** `00002` references tables from `00001`; `00003` modifies objects from `00001` and `00002`; `00004` references the `users` table from `00001`.

**Fix:** Never skip or reorder migrations. If one fails, fix it before proceeding.

### Risk 3: Seed fails on FK violation

**Cause:** If migrations are partially applied, seed data may reference tables/columns that don't exist.

**Fix:** Verify all 4 migrations are applied before running seed. Use the table count verification query.

### Risk 4: Admin trigger doesn't fire

**Cause:** If `00004` wasn't applied before creating the admin user.

**Fix:** Manually insert the admin user row:

```sql
INSERT INTO users (id, email, name, role, status, created_at, updated_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  'SUPER_ADMIN'::user_role,
  'Active'::user_status,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@fitnessapp.com'
ON CONFLICT (id) DO UPDATE SET role = 'SUPER_ADMIN';
```

### Risk 5: `supabase link` asks for password and fails

**Cause:** Database password contains special characters that break CLI parsing.

**Fix:** Use the `--password` flag or set `SUPABASE_DB_PASSWORD` environment variable:

```bash
export SUPABASE_DB_PASSWORD="your-password-here"
npx supabase link --project-ref <REF>
```

### Risk 6: Seed is not idempotent if run with `db reset`

**Cause:** `db reset` drops everything first, so `ON CONFLICT` is irrelevant. But if seed is run standalone on a database with existing data, `ON CONFLICT (id) DO NOTHING` preserves existing rows.

**This is the intended behavior.** Seed never overwrites existing data.

### Risk 7: Enum values with spaces (`'In Progress'`, `'Full Body'`)

**Cause:** PostgreSQL allows spaces in enum values, but some tools may struggle.

**Fix:** Always quote enum values in queries:

```sql
-- Correct:
WHERE status = 'In Progress'

-- Also works in Supabase JS:
.eq('status', 'In Progress')
```

---

## Quick Reference: Complete Deployment Sequence

```bash
# 1. Authenticate
npx supabase login

# 2. Link project
npx supabase link --project-ref <YOUR_REF>

# 3. Apply all migrations
npx supabase db push

# 4. Run seed (via SQL Editor or psql)
# → Paste supabase/seed.sql into Dashboard → SQL Editor → Run

# 5. Create admin user
# → Dashboard → Authentication → Users → Add User
# → Email: admin@fitnessapp.com, strong password, auto-confirm ✓

# 6. Promote admin
# → SQL Editor:
# UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'admin@fitnessapp.com';

# 7. Validate
# → Run the full validation query from Section 7.10
```

**Total time:** ~10-15 minutes for a fresh deployment.

---

## Next Steps

After successful deployment:

```
P1-08 — Generate TypeScript types (npx supabase gen types typescript)
P1-09 — Create Supabase client utilities
P1-11 — Implement middleware
P1-15 — Replace LoginForm
P1-16 — Replace RegisterForm
```
