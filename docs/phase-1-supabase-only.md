# FitnessApp — Phase 1 Roadmap (Supabase-Only Architecture)

**Version:** 2.0.0  
**Date:** August 25, 2026  
**Architecture:** Supabase Only (Prisma removed)  
**Duration:** 9 working days (estimated)  
**Developer:** Solo  
**Status:** Planning

---

## Architecture Decision Record

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | Supabase PostgreSQL | Managed, free tier covers 100-1K users |
| ORM | **None** (Supabase JS Client + PostgREST) | Eliminates ~3,000 lines of API boilerplate |
| Schema Management | SQL migrations via Supabase CLI | Portable, version-controlled, no abstraction |
| Type Safety | `supabase gen types typescript` | Auto-generated from live DB schema |
| Authorization | Row Level Security (mandatory) | Defense-in-depth, impossible to bypass in app code |
| Auth | Supabase Auth | Native RLS integration via `auth.uid()` |
| Storage | Supabase Storage | RLS-protected file access |
| Realtime | Supabase Realtime (available, use in Phase 2+) | Free, no additional infrastructure |
| API Routes | Only for: AI proxy, Stripe webhooks, complex multi-step logic | ~10 routes instead of ~45 |
| Data Access | Client queries Supabase directly for CRUD | No intermediate API layer for standard operations |

---

## What Changed from the Prisma Plan

| Removed | Replacement |
|---------|-------------|
| `prisma/schema.prisma` (30+ models, 400+ lines) | SQL migration files (reuse existing `database-schema.sql`) |
| `prisma/seed.ts` (complex TypeScript with UUID mapping) | `supabase/seed.sql` (plain SQL INSERTs) |
| `lib/prisma.ts` (singleton) | Not needed — Supabase client is stateless HTTP |
| `@prisma/client` + `prisma` packages | Removed from dependencies |
| `DATABASE_URL` + `DIRECT_URL` env vars | Not needed — Supabase client uses project URL + anon key |
| `npx prisma migrate dev` | `supabase db push` or `supabase migration up` |
| `npx prisma generate` | `npx supabase gen types typescript` |
| 45 planned API routes (Phase 2+) | ~10 API routes for business logic only |
| Application-level auth checks in every route | RLS policies enforce access at DB level |
| `lib/auth/roles.ts` (complex role utility) | Simple Supabase query + RLS policies |

| Added | Purpose |
|-------|---------|
| Comprehensive RLS policies (~30 policies) | Primary security layer |
| `types/supabase.ts` (generated) | Type-safe client queries |
| `supabase/migrations/` directory | Version-controlled schema |
| `supabase/seed.sql` | Reference data population |
| PostgreSQL function for user profile creation | DB trigger on auth signup |

---

## Phase 1 Scope

At the end of Phase 1:

- ✅ Supabase project live with all 30+ tables created
- ✅ RLS policies active on every table (zero-trust data access)
- ✅ Seed data populated (50 exercises, 50 ingredients, 12 recipes, 8 templates, 14 rules)
- ✅ Supabase Auth replaces localStorage authentication
- ✅ TypeScript types generated from database schema
- ✅ Server-side middleware protects routes
- ✅ Login, Register, Guards use Supabase Auth
- ✅ Admin user exists in database with SUPER_ADMIN role
- ✅ Storage bucket ready for progress photos
- ✅ Client can query data directly via Supabase JS (verified with exercises table)

---

## Task Execution Order

---

### TASK P1-01 — Create Supabase Project

| Field | Value |
|-------|-------|
| **Objective** | Provision Supabase project with PostgreSQL, Auth, Storage, and Realtime |
| **Files Affected** | None (dashboard only) |
| **Dependencies** | None |
| **Estimated Effort** | 2 hours |
| **Blocks** | All subsequent tasks |

**Acceptance Criteria:**
1. Supabase project exists in chosen region
2. Project URL and anon key accessible
3. Service role key saved securely
4. Supabase Studio accessible with empty `public` schema
5. Project reference ID noted (needed for CLI and type generation)

---

### TASK P1-02 — Configure Supabase Auth

| Field | Value |
|-------|-------|
| **Objective** | Enable authentication providers and configure settings for development |
| **Files Affected** | None (dashboard only) |
| **Dependencies** | P1-01 |
| **Estimated Effort** | 2 hours |
| **Blocks** | P1-11, P1-13, P1-14, P1-15 |

**Acceptance Criteria:**
1. Email/Password provider enabled
2. "Confirm email" disabled for development
3. Minimum password length: 8 characters
4. Site URL: `http://localhost:3000`
5. Redirect URLs: `http://localhost:3000/auth/callback`
6. JWT expiry: 3600 seconds
7. Refresh token rotation: enabled
8. Email templates reviewed (confirmation, password reset)

---

### TASK P1-03 — Setup Environment Variables

| Field | Value |
|-------|-------|
| **Objective** | Configure project with Supabase credentials |
| **Files Affected** | `.env.local` (new), `.env.local.example` (new), `.gitignore` (verify) |
| **Dependencies** | P1-01 |
| **Estimated Effort** | 30 minutes |
| **Blocks** | P1-04 |

**Required Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Note:** No `DATABASE_URL` or `DIRECT_URL` needed. Supabase client connects via HTTP.

**Acceptance Criteria:**
1. `.env.local` contains all 3 variables with real values
2. `.env.local.example` committed with placeholders and comments
3. `.gitignore` confirmed to exclude `.env.local`
4. Variables accessible in Next.js (verify with `process.env.NEXT_PUBLIC_SUPABASE_URL` check)

---

### TASK P1-04 — Install Dependencies

| Field | Value |
|-------|-------|
| **Objective** | Add Supabase SDK and CLI tooling |
| **Files Affected** | `package.json`, `package-lock.json` |
| **Dependencies** | P1-03 |
| **Estimated Effort** | 30 minutes |
| **Blocks** | P1-05, P1-08 |

**Packages to Install:**
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D supabase
```

**Package.json scripts to add:**
```json
"db:types": "npx supabase gen types typescript --project-id <ref> > types/supabase.ts",
"db:push": "npx supabase db push",
"db:reset": "npx supabase db reset",
"db:seed": "npx supabase db reset --seed-only"
```

**What is NOT installed:**
- ❌ `prisma`
- ❌ `@prisma/client`
- ❌ `tsx` (was only needed for Prisma seed)

**Acceptance Criteria:**
1. `@supabase/supabase-js` and `@supabase/ssr` in `dependencies`
2. `supabase` in `devDependencies`
3. Scripts added to `package.json`
4. `npm run build` still passes (no breaking changes)
5. `npx supabase --version` outputs version number

---

### TASK P1-05 — Write SQL Migration (Database Schema)

| Field | Value |
|-------|-------|
| **Objective** | Create all database tables, indexes, enums, and constraints from the existing SQL schema + new tables |
| **Files Affected** | `supabase/migrations/00001_initial_schema.sql` (new) |
| **Dependencies** | P1-04 |
| **Estimated Effort** | 1 day |
| **Blocks** | P1-06 |

**Strategy:**
- Start from `docs/database-schema.sql` (25 existing tables)
- Remove `password_hash` from `users` table (Supabase Auth handles passwords)
- Add `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` to `users` (link to Supabase Auth)
- Add 7 new tables identified in migration plan:
  - `notification_preferences`
  - `recommendation_rules`
  - `ai_chat_messages`
  - `shopping_lists`
  - `platform_settings`
  - `analytics_events`
  - `backups`
- Add `updated_at` trigger function for automatic timestamp updates

**Key Schema Decisions:**
- `users.id` = `auth.users.id` (UUID foreign key, no `gen_random_uuid()`)
- Remove `users.password_hash` (managed by Supabase Auth)
- Keep `users.email` (denormalized from auth for easy querying)
- All user-scoped tables: `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`

**Acceptance Criteria:**
1. Single migration file contains all CREATE TABLE statements
2. All 32+ tables defined with correct types, constraints, defaults
3. All indexes from original schema preserved
4. `users.id` references `auth.users(id)` correctly
5. No `password_hash` column in `users` table
6. New tables (`notification_preferences`, `recommendation_rules`, etc.) included
7. `updated_at` trigger function created
8. File is valid PostgreSQL syntax (parseable)

---

### TASK P1-06 — Apply Migration to Supabase

| Field | Value |
|-------|-------|
| **Objective** | Execute the migration against the Supabase PostgreSQL instance |
| **Files Affected** | None (database state change) |
| **Dependencies** | P1-05 |
| **Estimated Effort** | 1 hour |
| **Blocks** | P1-07, P1-09, P1-10 |

**Method:** Either:
- `npx supabase db push` (if using Supabase CLI linked to project), or
- Paste SQL into Supabase Studio → SQL Editor → Execute

**Acceptance Criteria:**
1. All 32+ tables visible in Supabase Studio → Table Editor
2. All indexes visible in table details
3. Foreign key relationships displayed in schema visualizer
4. `users.id` column type is UUID with FK to `auth.users`
5. No errors in execution log
6. Enum-like constraints (CHECK or VARCHAR with known values) correct

---

### TASK P1-07 — Write & Execute Seed Data

| Field | Value |
|-------|-------|
| **Objective** | Populate reference data (exercises, ingredients, recipes, templates, rules, settings) |
| **Files Affected** | `supabase/seed.sql` (new) |
| **Dependencies** | P1-06 |
| **Estimated Effort** | 1.5 days |
| **Blocks** | P1-12 (needs admin user row) |

**Data to seed (from existing TypeScript files):**

| Source File | Target Table(s) | Records |
|-------------|-----------------|---------|
| `data/exercises.ts` | `exercises` | 50 |
| `data/ingredients-seed.ts` | `ingredients` | 50 |
| `data/recipes.ts` | `recipes` + `recipe_ingredients` + `recipe_instructions` | 12 + ~60 + ~48 |
| `data/workouts.ts` | `workouts` + `workout_days` + `workout_exercises` | 8 + ~24 + ~96 |
| `lib/recommendation-engine.ts` (DEFAULT_RULES) | `recommendation_rules` | 14 |
| (inline) | `platform_settings` | 2 (feature_toggles, platform_name) |

**ID Strategy:**
- Use deterministic UUIDs generated from a namespace:
  - Exercises: `uuid_generate_v5(uuid_ns_url(), 'exercise-' || old_id)` pattern
  - Or simpler: use `gen_random_uuid()` with known IDs mapped in comments
  - Simplest approach: pre-generate UUIDs in the SQL file and reference them explicitly in related tables

**Acceptance Criteria:**
1. `supabase/seed.sql` executes without errors
2. Idempotent: uses `INSERT ... ON CONFLICT DO NOTHING` or runs after `TRUNCATE`
3. Correct record counts: 50 exercises, 50 ingredients, 12 recipes, 8 templates, 14 rules, 2 settings
4. Recipe → RecipeIngredients FK links are valid
5. WorkoutTemplate → WorkoutDays → WorkoutExercises → Exercise FK links are valid
6. Seed can be re-run via `npx supabase db reset` without errors

---

### TASK P1-08 — Generate TypeScript Types

| Field | Value |
|-------|-------|
| **Objective** | Generate strongly-typed TypeScript definitions from the live database schema |
| **Files Affected** | `types/supabase.ts` (new, generated) |
| **Dependencies** | P1-06 |
| **Estimated Effort** | 30 minutes |
| **Blocks** | P1-09 (client utils use types) |

**Command:**
```bash
npx supabase gen types typescript --project-id <ref> > types/supabase.ts
```

**Acceptance Criteria:**
1. `types/supabase.ts` generated with `Database` type containing all tables
2. Each table has `Row`, `Insert`, and `Update` types
3. Types match the actual table columns (spot-check `exercises`, `users`, `workouts`)
4. File importable without TypeScript errors
5. Script added to `package.json` for re-running after schema changes
6. File is NOT git-ignored (committed for team/CI access)

---

### TASK P1-09 — Create Supabase Client Utilities

| Field | Value |
|-------|-------|
| **Objective** | Build typed Supabase client factories for server, browser, and admin contexts |
| **Files Affected** | `lib/supabase/server.ts` (new), `lib/supabase/client.ts` (new), `lib/supabase/admin.ts` (new) |
| **Dependencies** | P1-04, P1-08 |
| **Estimated Effort** | 0.5 day |
| **Blocks** | P1-11, P1-13, P1-14, P1-15, P1-16, P1-17 |

**Three clients:**

| Client | Context | Auth | RLS |
|--------|---------|------|-----|
| `createServerClient()` | Route Handlers, Server Components, Middleware | User's JWT from cookies | ✅ Enforced |
| `createBrowserClient()` | Client Components ("use client") | User's JWT from cookies | ✅ Enforced |
| `createAdminClient()` | Server-only admin operations | Service role key | ❌ Bypassed |

**Type integration:**
```typescript
import { Database } from "@/types/supabase";
// Client is typed: supabase.from('exercises').select('*') returns Exercise[]
```

**Acceptance Criteria:**
1. Server client handles Next.js 16 async `cookies()` API correctly
2. Browser client uses `NEXT_PUBLIC_*` env vars only
3. Admin client uses `SUPABASE_SERVICE_ROLE_KEY` (never exposed to browser)
4. All three clients are typed with the `Database` generic
5. Test: `supabase.auth.getUser()` returns `{ data: { user: null } }` without errors (no session yet)
6. Test: `supabase.from('exercises').select('*').limit(1)` returns data (after seed + RLS configured)

---

### TASK P1-10 — Write Row Level Security Policies

| Field | Value |
|-------|-------|
| **Objective** | Secure every table with RLS policies so users can only access authorized data |
| **Files Affected** | `supabase/migrations/00002_rls_policies.sql` (new) |
| **Dependencies** | P1-06 |
| **Estimated Effort** | 1.5 days |
| **Blocks** | P1-09 (client queries need RLS active to return data) |

**Policy Architecture:**

| Category | Tables | SELECT | INSERT | UPDATE | DELETE |
|----------|--------|--------|--------|--------|--------|
| **Self-profile** | `users` | Own row: `auth.uid() = id` | Via trigger on signup | Own row | Never (soft delete via status) |
| **User-scoped data** | `weight_entries`, `measurement_entries`, `progress_photos`, `training_sessions`, `session_exercise_logs`, `session_set_logs`, `meal_logs`, `meal_plans`, `notifications`, `notification_preferences`, `recommendations`, `daily_checkins`, `ai_chat_messages`, `shopping_lists`, `subscriptions`, `ai_usage`, `feedback` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| **Shared read, admin write** | `exercises`, `ingredients`, `recipes`, `recipe_ingredients`, `recipe_instructions`, `workouts` (templates), `workout_days`, `workout_exercises` | Any authenticated: `auth.uid() IS NOT NULL` | Admin only (role check) | Admin only | Admin only |
| **User workouts** | `workouts` (user-created, `is_template = false`) | Own: `auth.uid() = user_id` | Own | Own | Own |
| **Admin-only** | `audit_log`, `platform_settings`, `recommendation_rules`, `analytics_events`, `backups` | Admin role check | Admin role check | Admin role check | Admin role check |
| **Public** | `beta_registrations` | None (admin only) | Anyone (no auth required) | None | None |

**Admin role check pattern:**
```sql
EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid()
  AND users.role IN ('ADMIN', 'SUPER_ADMIN')
)
```

**Special cases:**
- `session_exercise_logs` and `session_set_logs`: accessed via parent `training_sessions.user_id` (need JOIN-based policy or denormalized `user_id` column)
- `recipe_ingredients` and `recipe_instructions`: read access for authenticated users, write for admins
- `workout_days` and `workout_exercises`: read for authenticated (templates) OR own workouts; write for own workouts or admin

**Acceptance Criteria:**
1. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` applied to ALL tables
2. At least one policy per table (tables with RLS enabled but no policies block all access)
3. Test as regular user: `SELECT * FROM exercises` → returns 50 rows ✓
4. Test as regular user: `INSERT INTO exercises (...)` → permission denied ✗
5. Test as regular user: `SELECT * FROM training_sessions` → returns 0 rows (no own data yet) ✓
6. Test as admin: `SELECT * FROM users` → returns all users ✓
7. Test unauthenticated: `SELECT * FROM exercises` → permission denied ✗
8. `beta_registrations` INSERT works without authentication (public form)

---

### TASK P1-11 — Implement Server-Side Middleware

| Field | Value |
|-------|-------|
| **Objective** | Create Next.js middleware for auth verification, token refresh, and route protection |
| **Files Affected** | `middleware.ts` (new, project root) |
| **Dependencies** | P1-09 |
| **Estimated Effort** | 1 day |
| **Blocks** | P1-14, P1-15 |

**Responsibilities:**
1. Create Supabase server client with middleware cookie handling
2. Call `supabase.auth.getUser()` to verify/refresh session
3. Update response cookies with refreshed tokens
4. Apply route protection rules:

| Route Category | Behavior |
|---------------|----------|
| Public (`/`, `/login`, `/register`, `/beta`, `/onboarding`, `/forbidden`, `/auth/callback`) | Pass through |
| Protected (all `/(app)/*` routes) | Require valid session → redirect to `/login` if missing |
| Admin (`/admin/*`) | Require session + ADMIN/SUPER_ADMIN role → redirect to `/forbidden` if USER |
| Auth pages while authenticated (`/login`, `/register`) | Redirect to `/dashboard` |
| Static assets (`_next/*`, images, fonts) | Skip middleware entirely |

**Role checking approach (no Prisma):**
```typescript
// In middleware, after session verification:
const { data: profile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();
```

**Security headers to set:**
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

**Matcher config (exclude static assets):**
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

**Acceptance Criteria:**
1. Unauthenticated → `/dashboard` → 302 to `/login`
2. Authenticated → `/login` → 302 to `/dashboard`
3. USER role → `/admin` → 302 to `/forbidden`
4. ADMIN role → `/admin` → 200 (pass through)
5. Expired token auto-refreshed (no user-facing error)
6. Static assets not affected by middleware
7. Security headers present on all responses

---

### TASK P1-12 — Create Admin User

| Field | Value |
|-------|-------|
| **Objective** | Provision SUPER_ADMIN user in Supabase Auth linked to `users` table |
| **Files Affected** | Supabase Dashboard + seed SQL update |
| **Dependencies** | P1-02, P1-07 |
| **Estimated Effort** | 1 hour |
| **Blocks** | P1-14 (admin login test) |

**Approach:**
1. Create user via Supabase Dashboard → Authentication → Users → Add User
2. Email: `admin@fitnessapp.com`, strong password, "Auto-confirm" checked
3. Copy the assigned UUID
4. Add to `supabase/seed.sql`: `INSERT INTO users (id, email, name, role, ...) VALUES ('<uuid>', 'admin@fitnessapp.com', 'Super Admin', 'SUPER_ADMIN', ...)`
5. Run seed again (or just execute the single INSERT)

**Alternative (automated via SQL):**
- Create a migration that uses `supabase.auth.admin.createUser()` via an Edge Function
- Or document as a manual step for initial deployment

**Acceptance Criteria:**
1. Admin exists in `auth.users` (Supabase Auth dashboard shows user)
2. Admin exists in `public.users` with `role = 'SUPER_ADMIN'`
3. UUIDs match between `auth.users.id` and `public.users.id`
4. Admin can log in and middleware allows `/admin/*` access

---

### TASK P1-13 — Create Auth Callback Route

| Field | Value |
|-------|-------|
| **Objective** | Handle OAuth redirects and exchange auth codes for sessions |
| **Files Affected** | `app/auth/callback/route.ts` (new) |
| **Dependencies** | P1-09 |
| **Estimated Effort** | 2 hours |
| **Blocks** | None (enables future OAuth) |

**Logic:**
1. Read `code` from URL search params
2. If code present: `supabase.auth.exchangeCodeForSession(code)`
3. Redirect to `/dashboard` on success
4. Redirect to `/login?error=auth_callback_failed` on failure

**Acceptance Criteria:**
1. Route exists at `/auth/callback`
2. Handles GET requests
3. Code exchange works (testable once OAuth provider configured)
4. Graceful error handling for missing/invalid codes

---

### TASK P1-14 — Create User Profile Handler (DB Trigger)

| Field | Value |
|-------|-------|
| **Objective** | Automatically create a `users` row + default `subscription` + `notification_preferences` when a new user signs up |
| **Files Affected** | `supabase/migrations/00003_auth_trigger.sql` (new) |
| **Dependencies** | P1-06 |
| **Estimated Effort** | 0.5 day |
| **Blocks** | P1-15 (registration flow needs profile auto-creation) |

**Strategy: Database trigger (recommended for Supabase-only architecture)**

```sql
-- Function triggered on new auth.users row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'USER',
    'Active',
    NOW(),
    NOW()
  );

  INSERT INTO public.subscriptions (user_id, plan, status, start_date)
  VALUES (NEW.id, 'FREE', 'Active', CURRENT_DATE);

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Why trigger instead of API route:**
- No API route needed for profile creation
- Works for ALL auth methods (email, OAuth, magic link) automatically
- Cannot be forgotten or bypassed
- Reduces client-side registration logic

**Acceptance Criteria:**
1. Trigger function exists and is `SECURITY DEFINER` (runs with elevated privileges)
2. New Supabase Auth signup automatically creates:
   - `users` row (id matches auth.users.id, role = USER, status = Active)
   - `subscriptions` row (plan = FREE, status = Active)
   - `notification_preferences` row (all defaults = true)
3. User's `name` extracted from `raw_user_meta_data` (passed during signUp)
4. If signup provides no name, falls back to email prefix
5. Test: `supabase.auth.signUp(...)` → query `users` table → row exists

---

### TASK P1-15 — Replace LoginForm

| Field | Value |
|-------|-------|
| **Objective** | Rewrite login to authenticate via Supabase instead of localStorage |
| **Files Affected** | `components/auth/LoginForm.tsx` (modify) |
| **Dependencies** | P1-09, P1-11 |
| **Estimated Effort** | 0.75 day |
| **Blocks** | P1-18 (requires working login to test logout) |

**Changes Required:**
- Remove: `import { seedSuperAdmin, getSuperAdmin } from "@/lib/auth/seed-admin"`
- Remove: All `localStorage.getItem("fitnessapp_session")` calls
- Remove: All `localStorage.getItem("fitnessapp_user")` calls
- Remove: All `localStorage.getItem("fitnessapp_admin")` calls
- Remove: All `localStorage.setItem("fitnessapp_session", ...)` calls
- Remove: Manual session object construction
- Remove: `seedSuperAdmin()` useEffect call
- Add: `import { createBrowserClient } from "@/lib/supabase/client"`
- Add: `supabase.auth.signInWithPassword({ email, password })`
- Add: On success → `router.push("/dashboard")` (middleware handles admin redirect)
- Add: On error → display Supabase error message
- Keep: All existing UI (form layout, Google button, validation, remember me)
- Google button: Wire to `supabase.auth.signInWithOAuth({ provider: "google" })` or leave as "Coming soon"

**Acceptance Criteria:**
1. Valid credentials → session cookie set → redirected to `/dashboard`
2. Admin credentials → session cookie set → redirected to `/admin` (middleware redirects based on role)
3. Invalid credentials → error message from Supabase displayed
4. Empty fields → existing validation messages shown
5. No `localStorage` references for auth in file
6. No `seed-admin` imports
7. `npm run build` passes

---

### TASK P1-16 — Replace RegisterForm

| Field | Value |
|-------|-------|
| **Objective** | Rewrite registration to use Supabase Auth (profile created automatically via trigger) |
| **Files Affected** | `components/auth/RegisterForm.tsx` (modify) |
| **Dependencies** | P1-09, P1-14 (trigger must exist) |
| **Estimated Effort** | 0.75 day |
| **Blocks** | None |

**Changes Required:**
- Remove: `localStorage.setItem("fitnessapp_user", JSON.stringify(userData))`
- Add: `import { createBrowserClient } from "@/lib/supabase/client"`
- Add: Call `supabase.auth.signUp({ email, password, options: { data: { name } } })`
- Add: On success → `router.push("/onboarding")`
- Add: On error → display Supabase error message
- Keep: All existing validation (name, email format, password >= 8, confirm match, terms)
- Keep: All existing UI layout

**Note:** No API route call needed — the database trigger (P1-14) automatically creates the `users` row, `subscription`, and `notification_preferences`.

**Acceptance Criteria:**
1. New user registers → Supabase Auth user created → trigger creates DB rows → redirected to `/onboarding`
2. Duplicate email → "User already registered" error shown
3. Password < 8 chars → validation error
4. Passwords don't match → validation error
5. No `localStorage.setItem` calls remain
6. Query `users` table after signup confirms row exists with correct name/email/role
7. `npm run build` passes

---

### TASK P1-17 — Update AuthGuard & AdminGuard

| Field | Value |
|-------|-------|
| **Objective** | Replace localStorage checks with Supabase session verification |
| **Files Affected** | `components/auth/AuthGuard.tsx` (modify), `components/admin/AdminGuard.tsx` (modify) |
| **Dependencies** | P1-09 |
| **Estimated Effort** | 0.5 day |
| **Blocks** | None |

**AuthGuard changes:**
- Remove: `localStorage.getItem("fitnessapp_session")`
- Add: `supabase.auth.getSession()` check
- Keep: Loading spinner while checking
- Role: UI-level fallback only (middleware is primary protection)

**AdminGuard changes:**
- Remove: `localStorage.getItem("fitnessapp_session")` + JSON parse + role check
- Add: `supabase.auth.getUser()` → `supabase.from('users').select('role').eq('id', user.id).single()`
- On role !== ADMIN/SUPER_ADMIN: `router.replace("/dashboard")`
- Keep: Loading spinner

**Acceptance Criteria:**
1. AuthGuard renders children when session exists
2. AuthGuard redirects to `/login` when no session (backup for middleware)
3. AdminGuard renders children for ADMIN/SUPER_ADMIN
4. AdminGuard redirects USER to `/dashboard`
5. No localStorage references in either file

---

### TASK P1-18 — Update Logout Handlers

| Field | Value |
|-------|-------|
| **Objective** | Replace localStorage session removal with Supabase signOut |
| **Files Affected** | `components/app/Topbar.tsx` (modify), `components/admin/AdminTopbar.tsx` (modify) |
| **Dependencies** | P1-09 |
| **Estimated Effort** | 2 hours |
| **Blocks** | None |

**Changes in both files:**
- Remove: `localStorage.removeItem("fitnessapp_session")`
- Add: `await supabase.auth.signOut()`
- Update user name display: read from `supabase.auth.getUser()` → `user.user_metadata.name` instead of localStorage session object
- Keep: `router.replace("/login")` after signOut

**Acceptance Criteria:**
1. Clicking logout clears session cookie
2. User redirected to `/login`
3. Subsequent protected route access redirected to `/login`
4. User name displays correctly from Supabase session metadata
5. No localStorage references for session/auth in either file

---

### TASK P1-19 — Delete Deprecated Auth File

| Field | Value |
|-------|-------|
| **Objective** | Remove the hardcoded admin credentials file |
| **Files Affected** | `lib/auth/seed-admin.ts` (delete) |
| **Dependencies** | P1-15 (LoginForm no longer imports it) |
| **Estimated Effort** | 15 minutes |
| **Blocks** | None |

**Acceptance Criteria:**
1. File `lib/auth/seed-admin.ts` deleted
2. No remaining imports of `seed-admin` anywhere in codebase
3. `npm run build` passes

---

### TASK P1-20 — Create Supabase Storage Bucket

| Field | Value |
|-------|-------|
| **Objective** | Provision private storage bucket for progress photos |
| **Files Affected** | Supabase Dashboard (or migration SQL) |
| **Dependencies** | P1-01 |
| **Estimated Effort** | 30 minutes |
| **Blocks** | None (used in Phase 2) |

**Configuration:**
- Bucket name: `progress-photos`
- Public: `false`
- File size limit: 5 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

**Storage RLS policies:**
- Upload: user can upload to `{user_id}/` folder
- Read: user can read from `{user_id}/` folder
- Delete: user can delete from `{user_id}/` folder
- Admin: can access all folders

**Acceptance Criteria:**
1. Bucket exists in Supabase Dashboard → Storage
2. Policies restrict access to user's own folder
3. Upload test (via Dashboard) works with JPEG under 5MB
4. Upload test with 10MB file is rejected

---

### TASK P1-21 — End-to-End Verification

| Field | Value |
|-------|-------|
| **Objective** | Validate complete auth flow and database connectivity |
| **Files Affected** | None (testing only) |
| **Dependencies** | All previous tasks |
| **Estimated Effort** | 0.5 day |
| **Blocks** | Phase 1 completion gate |

**Test Matrix:**

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Register new user | Auth user + `users` row + `subscriptions` row + `notification_preferences` row created |
| 2 | Login with valid credentials | Session cookie set, redirected to `/dashboard` |
| 3 | Login with admin credentials | Session cookie set, redirected to `/admin` |
| 4 | Login with invalid credentials | Error message displayed |
| 5 | Access `/dashboard` unauthenticated | Redirected to `/login` |
| 6 | Access `/admin` as USER role | Redirected to `/forbidden` |
| 7 | Access `/login` while authenticated | Redirected to `/dashboard` |
| 8 | Logout | Session cleared, protected routes inaccessible |
| 9 | Session persistence (close/reopen browser) | Cookie survives, user stays logged in |
| 10 | `npm run build` | 0 TypeScript errors |
| 11 | Direct Supabase query from client | `supabase.from('exercises').select('*')` returns 50 rows |
| 12 | RLS enforcement | Authenticated user cannot access other users' training sessions |
| 13 | Admin data access | Admin can query all users via service role |

**Acceptance Criteria:**
1. All 13 tests pass
2. No console errors related to Supabase
3. Seed data confirmed in Supabase Studio (50 exercises, 50 ingredients, 12 recipes, 8 templates)
4. Build compiles 120+ pages without errors

---

## Dependency Graph

```
P1-01 (Supabase Project)
├── P1-02 (Auth Config) ─────────── P1-12 (Admin User)
├── P1-03 (Env Vars)
│     └── P1-04 (Dependencies)
│           ├── P1-05 (SQL Schema)
│           │     └── P1-06 (Apply Migration)
│           │           ├── P1-07 (Seed Data) ──── P1-12
│           │           ├── P1-08 (Gen Types)
│           │           ├── P1-10 (RLS Policies)
│           │           └── P1-14 (Auth Trigger)
│           └── P1-09 (Supabase Clients) ←── P1-08
│                 ├── P1-11 (Middleware) ─── P1-15, P1-16
│                 ├── P1-13 (Auth Callback)
│                 ├── P1-15 (LoginForm)
│                 ├── P1-16 (RegisterForm) ←── P1-14
│                 ├── P1-17 (Guards)
│                 └── P1-18 (Logout)
├── P1-20 (Storage Bucket)
└── P1-19 (Delete seed-admin) ←── P1-15

P1-21 (E2E Verification) ←── ALL
```

**Critical path:** P1-01 → P1-03 → P1-04 → P1-05 → P1-06 → P1-14 → P1-16 → P1-21

---

## Effort Summary

| Block | Tasks | Days |
|-------|-------|------|
| **Infrastructure** | P1-01, P1-02, P1-03, P1-04 | 0.75 |
| **Database** | P1-05, P1-06, P1-07, P1-08 | 2.5 |
| **Security (RLS)** | P1-10 | 1.5 |
| **Supabase Clients** | P1-09 | 0.5 |
| **Auth Migration** | P1-11, P1-12, P1-13, P1-14, P1-15, P1-16, P1-17, P1-18, P1-19 | 4.0 |
| **Storage & Verification** | P1-20, P1-21 | 0.75 |
| **TOTAL** | **21 tasks** | **~9 days** |

---

## Comparison vs Previous Plan (Prisma)

| Metric | Plan A (Prisma) | Plan B (Supabase Only) | Delta |
|--------|----------------|----------------------|-------|
| Tasks | 22 | 21 | -1 |
| Working days | 14 | 9 | **-5 days (36% faster)** |
| New files | 14 | 10 | -4 |
| Dependencies installed | 4 | 2 | -2 |
| Env vars needed | 5 | 3 | -2 |
| Lines of schema code | ~400 (Prisma DSL) | ~280 (SQL, reused) | -30% |
| Type generation | Automatic (prisma generate) | CLI command (supabase gen types) | Manual step |
| API routes in Phase 1 | 1 (`POST /api/users`) | 0 (trigger handles it) | -1 |
| Auth profile creation | API route + client call | DB trigger (automatic) | Simpler |

---

## Files Created in Phase 1

| File | Purpose | Generated? |
|------|---------|-----------|
| `.env.local` | Supabase credentials | No |
| `.env.local.example` | Template for team | No |
| `types/supabase.ts` | Database TypeScript types | Yes (CLI) |
| `lib/supabase/server.ts` | Server-side client factory | No |
| `lib/supabase/client.ts` | Browser-side client factory | No |
| `lib/supabase/admin.ts` | Admin client (service role) | No |
| `middleware.ts` | Route protection + token refresh | No |
| `app/auth/callback/route.ts` | OAuth code exchange | No |
| `supabase/migrations/00001_initial_schema.sql` | Database tables + indexes | No |
| `supabase/migrations/00002_rls_policies.sql` | Row Level Security | No |
| `supabase/migrations/00003_auth_trigger.sql` | User profile auto-creation | No |
| `supabase/seed.sql` | Reference data | No |

## Files Modified in Phase 1

| File | Change |
|------|--------|
| `package.json` | Add `@supabase/supabase-js`, `@supabase/ssr`, `supabase` (dev); add scripts |
| `components/auth/LoginForm.tsx` | Supabase Auth signIn, remove localStorage |
| `components/auth/RegisterForm.tsx` | Supabase Auth signUp, remove localStorage |
| `components/auth/AuthGuard.tsx` | Supabase session check |
| `components/admin/AdminGuard.tsx` | Supabase session + role query |
| `components/app/Topbar.tsx` | Supabase signOut, user name from session |
| `components/admin/AdminTopbar.tsx` | Supabase signOut, user name from session |
| `.gitignore` | Verify `.env.local` excluded |

## Files Deleted in Phase 1

| File | Reason |
|------|--------|
| `lib/auth/seed-admin.ts` | Replaced by DB seed + Supabase Auth user |

## Files NOT Created (Prisma removed)

| Previously Planned | Why Removed |
|-------------------|-------------|
| `prisma/schema.prisma` | No ORM — schema in SQL migrations |
| `prisma/seed.ts` | Replaced by `supabase/seed.sql` |
| `lib/prisma.ts` | No Prisma Client — use Supabase JS |
| `lib/auth/roles.ts` | Role checking via simple Supabase query in middleware |
| `lib/api/errors.ts` | No API routes in Phase 1 (trigger handles profile) |
| `lib/api/response.ts` | Deferred to Phase 2 when API routes are needed |
| `app/api/users/route.ts` | Profile created by DB trigger, not API route |

---

## Migration Strategy (Revised)

### Phase 1: Foundation (THIS DOCUMENT)
Auth + Database + RLS + Types. No data store migration yet.

### Phase 2: Client-Side Data Migration (Week 4-6)
Replace localStorage stores with direct Supabase client queries:
```typescript
// BEFORE:
import { loadExercises } from "@/lib/exercises-store";
const exercises = loadExercises(); // sync, localStorage

// AFTER:
const { data: exercises } = await supabase
  .from('exercises')
  .select('*')
  .order('name');
```
- No API routes needed for standard CRUD
- Create React hooks: `useExercises()`, `useWorkouts()`, `useTrainingSessions()`, etc.
- Each hook wraps a Supabase query with SWR/React Query for caching

### Phase 3: Complex Business Logic (Week 7-8)
API routes ONLY for:
- `app/api/ai/chat/route.ts` — AI proxy (protects API keys)
- `app/api/ai/recommendations/route.ts` — AI-powered recommendations
- `app/api/webhooks/stripe/route.ts` — Stripe payment webhooks
- `app/api/exports/route.ts` — Server-side data export generation
- `app/api/admin/stats/route.ts` — Aggregated platform statistics

### Phase 4: Storage & Polish (Week 9)
- Migrate progress photos from base64 → Supabase Storage
- Supabase Realtime for live workout sessions
- Edge Functions for background jobs (reminders, subscription expiry)

---

## Decisions Locked In

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Schema management | SQL migrations (Supabase CLI) | Reuses existing schema, no translation layer |
| Data access | Supabase JS client direct from components | Eliminates 45 API routes |
| Authorization | RLS (mandatory, database-level) | Stronger security than app-level checks |
| Profile creation | Database trigger | Automatic for all auth methods, no API route |
| Type safety | Generated types from `supabase gen types` | Always in sync with live schema |
| API routes | Only for business logic requiring secrets | AI proxy, Stripe webhooks, exports |
| Prisma | **Completely removed** | Not needed — Supabase handles everything |

---

## Phase 1 Completion Gate

Phase 1 is DONE when:

1. ✅ `npm run build` succeeds (0 errors)
2. ✅ Registration creates user in Supabase Auth + `users` + `subscriptions` + `notification_preferences`
3. ✅ Login returns JWT session stored in HTTP-only cookie
4. ✅ Middleware redirects unauthenticated users to `/login`
5. ✅ Middleware redirects non-admin users from `/admin` to `/forbidden`
6. ✅ Admin can log in and access admin panel
7. ✅ RLS policies prevent cross-user data access on ALL tables
8. ✅ Seed data present (50 exercises, 50 ingredients, 12 recipes, 8 templates, 14 rules)
9. ✅ No plain-text passwords exist in the codebase
10. ✅ `supabase.from('exercises').select('*')` returns typed data from client component
11. ✅ Storage bucket `progress-photos` provisioned with RLS
12. ✅ TypeScript types generated and importable

---

*Next: Phase 2 — Replace localStorage stores with Supabase client queries (no API routes needed for CRUD)*
