# Movive — Phase 1 Implementation Roadmap

**Phase:** 1 — Foundation (Supabase + Prisma + Auth + Database)  
**Duration:** 14 working days (estimated)  
**Prerequisites:** None (first phase)  
**Outcome:** Fully configured backend infrastructure with working authentication

---

## Overview

Phase 1 establishes the complete backend foundation. At the end of this phase:

- ✅ Supabase project is live with PostgreSQL database
- ✅ Prisma ORM is connected with all 30+ models migrated
- ✅ Seed data is populated (50 exercises, 50 ingredients, 12 recipes, 8 templates, 14 rules)
- ✅ Supabase Auth replaces localStorage-based authentication
- ✅ Server-side middleware protects all routes
- ✅ Login, Register, and Guards use real auth
- ✅ Admin user exists in database (not hardcoded)
- ✅ Environment variables properly configured

---

## Task Checklist (Execution Order)

### Block A: Environment & Project Setup

---

#### Task 1: Create Supabase Project

| Field | Value |
|-------|-------|
| **Effort** | 0.5 day |
| **Priority** | P0 — Blocker |
| **Dependencies** | None |
| **Blocks** | Tasks 2, 3, 5, 6, 7, 8, 9, 10+ |

**Subtasks:**
- [ ] Create new Supabase project (choose region closest to target users)
- [ ] Note the project URL, anon key, service role key, and database connection strings
- [ ] Verify PostgreSQL database is accessible via Supabase Studio
- [ ] Set database password (save securely)
- [ ] Configure project settings:
  - Disable email confirmations for development (enable later)
  - Set site URL to `http://localhost:3000`
  - Add `http://localhost:3000/auth/callback` to redirect URLs

**Deliverable:** Supabase project live, credentials documented locally.

---

#### Task 2: Configure Environment Variables

| Field | Value |
|-------|-------|
| **Effort** | 0.5 day |
| **Priority** | P0 — Blocker |
| **Dependencies** | Task 1 |
| **Blocks** | Tasks 3, 5, 6, 7, 8+ |

**Subtasks:**
- [ ] Create `.env.local` file at project root (git-ignored)
- [ ] Add Supabase variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
- [ ] Add Prisma database variables:
  ```
  DATABASE_URL=          (pooled connection — port 6543)
  DIRECT_URL=            (direct connection — port 5432)
  ```
- [ ] Create `.env.local.example` with placeholder values for team documentation
- [ ] Add `.env.local` to `.gitignore` (verify it's already there)
- [ ] Verify environment variables load correctly with a test `console.log` in `next.config.ts`

**Deliverable:** All secrets configured locally, example file committed for team.

---

#### Task 3: Install Dependencies

| Field | Value |
|-------|-------|
| **Effort** | 0.25 day |
| **Priority** | P0 — Blocker |
| **Dependencies** | Task 2 |
| **Blocks** | Tasks 4, 5, 6, 7, 8+ |

**Subtasks:**
- [ ] Install production dependencies:
  ```bash
  npm install @supabase/supabase-js @supabase/ssr prisma @prisma/client
  ```
- [ ] Install dev/utility dependencies:
  ```bash
  npm install -D supabase tsx
  ```
- [ ] Verify no version conflicts with existing Next.js 16 / React 19 packages
- [ ] Run `npx prisma init` to scaffold `prisma/` directory
- [ ] Verify `prisma/schema.prisma` file is created with correct datasource config
- [ ] Add Prisma scripts to `package.json`:
  ```json
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:seed": "tsx prisma/seed.ts",
  "prisma:studio": "prisma studio",
  "db:push": "prisma db push"
  ```
- [ ] Add `"prisma": { "seed": "tsx prisma/seed.ts" }` to `package.json`

**Deliverable:** All packages installed, Prisma initialized, scripts configured.

---

### Block B: Database Schema & Prisma

---

#### Task 4: Write Prisma Schema

| Field | Value |
|-------|-------|
| **Effort** | 2 days |
| **Priority** | P0 — Blocker |
| **Dependencies** | Task 3 |
| **Blocks** | Tasks 5, 6, 7 |

**Subtasks:**
- [ ] Configure `generator` and `datasource` blocks:
  - Provider: `prisma-client-js`
  - Database: `postgresql`
  - URLs from environment variables
- [ ] Define all enums:
  - `UserRole` (USER, ADMIN, SUPER_ADMIN)
  - `UserStatus` (Active, Suspended, Deleted)
  - `PlanType` (FREE, PREMIUM_MONTHLY, PREMIUM_YEARLY)
  - `SubscriptionStatus` (Active, Trial, Expired, Cancelled, Pending)
- [ ] Define **User** model with:
  - UUID primary key (matching Supabase Auth id)
  - Profile fields (name, email, gender, dateOfBirth, heightCm, activityLevel, fitnessGoal)
  - Role/status fields
  - Timestamps (createdAt, updatedAt, lastLoginAt)
  - All relations (17 relation fields)
  - Indexes on email, role, status
  - `@@map("users")` for snake_case table name
- [ ] Define core data models (from migration plan section 8.2):
  - `Subscription`
  - `WeightEntry`
  - `MeasurementEntry`
  - `ProgressPhoto`
  - `Ingredient` (+ relation to RecipeIngredient)
  - `Recipe` (+ relations to RecipeIngredient, RecipeInstruction)
  - `RecipeIngredient`
  - `RecipeInstruction`
  - `Exercise` (+ relation to WorkoutExercise)
  - `Workout` (+ relation to WorkoutDay, TrainingSession)
  - `WorkoutDay` (+ relation to WorkoutExercise)
  - `WorkoutExercise`
  - `TrainingSession` (+ relation to SessionExerciseLog)
  - `SessionExerciseLog` (+ relation to SessionSetLog)
  - `SessionSetLog`
  - `MealLog`
  - `MealPlan`
- [ ] Define secondary models:
  - `Notification`
  - `NotificationPreference`
  - `Recommendation`
  - `RecommendationRule`
  - `AiUsage`
  - `AiChatMessage`
  - `DailyCheckin` (with @@unique on [userId, date])
  - `ShoppingList`
  - `BetaRegistration`
  - `Feedback`
  - `AuditLog`
  - `PlatformSetting`
- [ ] Validate all `@map()` annotations map to snake_case SQL column names
- [ ] Validate all `@@map()` annotations map to snake_case table names
- [ ] Ensure all foreign keys use `onDelete: Cascade` for user-owned data
- [ ] Verify JSONB fields use `Json` type (exercises.instructions, exercises.tips, etc.)
- [ ] Run `npx prisma validate` to check for schema errors

**Deliverable:** Complete `prisma/schema.prisma` with 30+ models, all relations, indexes, and mappings.

---

#### Task 5: Run Initial Database Migration

| Field | Value |
|-------|-------|
| **Effort** | 0.5 day |
| **Priority** | P0 — Blocker |
| **Dependencies** | Tasks 2, 4 |
| **Blocks** | Tasks 6, 7, 10+ |

**Subtasks:**
- [ ] Run `npx prisma migrate dev --name init` to create migration SQL
- [ ] Verify migration file generated in `prisma/migrations/`
- [ ] Check Supabase Studio → Table Editor for all 30+ tables
- [ ] Verify indexes are created (check via SQL Editor):
  - `idx_users_email`, `idx_users_role`, `idx_users_status`
  - `idx_exercises_category`, `idx_exercises_muscle_group`
  - `idx_training_sessions_user_date`
  - `idx_meal_logs_user_date`
  - `idx_notifications_user_status`
  - `idx_audit_log_created_at`
- [ ] Verify enums are created as PostgreSQL enum types
- [ ] Verify foreign key constraints exist (check via relationship diagram in Studio)
- [ ] Run `npx prisma generate` to generate the Prisma Client

**Deliverable:** All tables live in Supabase PostgreSQL, Prisma Client generated.

---

#### Task 6: Create Seed Script

| Field | Value |
|-------|-------|
| **Effort** | 2 days |
| **Priority** | P0 — Critical |
| **Dependencies** | Task 5 |
| **Blocks** | Task 7, Task 13 (admin auth) |

**Subtasks:**
- [ ] Create `prisma/seed.ts` with TypeScript + Prisma Client
- [ ] Seed **Exercises** (50 items from `data/exercises.ts`):
  - Map `id` field (currently numeric strings) to UUIDs via a deterministic mapping
  - Store old ID → new UUID in a map for use in workout template seeding
  - Map `instructions`, `tips`, `commonMistakes` as JSON arrays
- [ ] Seed **Ingredients** (50 items from `data/ingredients-seed.ts`):
  - Map to correct decimal types for nutritional values
- [ ] Seed **Recipes** (12 items from `data/recipes.ts`):
  - Create recipe records
  - Create nested `RecipeIngredient` records (link to ingredient UUIDs where possible)
  - Create nested `RecipeInstruction` records
- [ ] Seed **Workout Templates** (8 items from `data/workouts.ts`):
  - Set `isTemplate: true`, `userId: null`
  - Create `WorkoutDay` records for each template
  - Create `WorkoutExercise` records linking to exercise UUIDs
- [ ] Seed **Recommendation Rules** (14 rules from `lib/recommendation-engine.ts`):
  - Map DEFAULT_RULES array to `RecommendationRule` records
- [ ] Seed **Platform Settings** (default feature toggles):
  - Key: `feature_toggles`, Value: `{ aiCoach: true, mealPlanner: true, ... }`
  - Key: `platform_name`, Value: `"Movive"`
- [ ] Seed **Super Admin User**:
  - Create user record in `users` table (role: SUPER_ADMIN)
  - Note: Supabase Auth user must be created separately (Task 13)
  - Use a known UUID that matches the Supabase Auth user ID
- [ ] Add idempotency: use `upsert` or check existence before insert
- [ ] Run `npx prisma db seed` and verify data in Supabase Studio
- [ ] Verify: 50 exercises, 50 ingredients, 12 recipes, 8 templates, 14 rules, 1 admin, default settings

**Deliverable:** Populated database with all reference data, ready for application use.

---

#### Task 7: Verify Database Integrity

| Field | Value |
|-------|-------|
| **Effort** | 0.25 day |
| **Priority** | P0 |
| **Dependencies** | Task 6 |
| **Blocks** | Block C |

**Subtasks:**
- [ ] Open Supabase Studio and verify all tables have correct row counts
- [ ] Spot-check relational integrity:
  - Recipe → RecipeIngredients → Ingredient links
  - Workout Template → WorkoutDays → WorkoutExercises → Exercise links
- [ ] Run a test query via Prisma Client (create a simple script):
  ```typescript
  const exercises = await prisma.exercise.findMany({ take: 5 });
  const template = await prisma.workout.findFirst({
    where: { isTemplate: true },
    include: { workoutDays: { include: { exercises: true } } }
  });
  ```
- [ ] Verify JSON fields are queryable
- [ ] Confirm no orphaned records

**Deliverable:** Database confirmed operational with correct data and relationships.

---

### Block C: Supabase Client Infrastructure

---

#### Task 8: Create Supabase Server Client Utility

| Field | Value |
|-------|-------|
| **Effort** | 0.5 day |
| **Priority** | P0 — Blocker |
| **Dependencies** | Tasks 2, 3 |
| **Blocks** | Tasks 10, 11, 12, 14, 15 |

**Subtasks:**
- [ ] Create `lib/supabase/server.ts`:
  - Export `createServerClient()` function
  - Uses `@supabase/ssr` `createServerClient` with Next.js cookie handling
  - Reads/writes cookies for session management in Server Components and Route Handlers
  - Handles the `cookies()` async API from Next.js 16
- [ ] Create `lib/supabase/client.ts`:
  - Export `createBrowserClient()` function
  - Uses `@supabase/ssr` `createBrowserClient`
  - For use in Client Components ("use client")
  - Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Create `lib/supabase/admin.ts`:
  - Export `createAdminClient()` function
  - Uses `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to client)
  - For admin operations: creating users, bypassing RLS
- [ ] Verify server client can connect:
  - Temporary test: call `supabase.auth.getUser()` in a Server Component and log result

**Deliverable:** Three Supabase client utilities (server, browser, admin) ready for use.

---

#### Task 9: Create Prisma Client Singleton

| Field | Value |
|-------|-------|
| **Effort** | 0.25 day |
| **Priority** | P0 — Blocker |
| **Dependencies** | Task 5 |
| **Blocks** | Tasks 10, 11, 14, 15 |

**Subtasks:**
- [ ] Create `lib/prisma.ts`:
  - Singleton pattern to avoid multiple Prisma Client instances in development (hot reload)
  - Store instance on `globalThis` in development
  - Export typed `prisma` client
  ```typescript
  import { PrismaClient } from "@prisma/client";
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
  export const prisma = globalForPrisma.prisma || new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
  ```
- [ ] Add `lib/prisma.ts` to the project
- [ ] Verify Prisma Client can query the database (test in a temporary API route or script)

**Deliverable:** Prisma Client singleton ready for import across all API routes.

---

### Block D: Authentication Migration

---

#### Task 10: Configure Supabase Auth Providers

| Field | Value |
|-------|-------|
| **Effort** | 0.5 day |
| **Priority** | P0 |
| **Dependencies** | Task 1 |
| **Blocks** | Tasks 11, 12, 13 |

**Subtasks:**
- [ ] In Supabase Dashboard → Authentication → Providers:
  - Enable **Email** provider
  - Set "Confirm email" to `false` for dev (toggle to `true` before production)
  - Set "Secure email change" to `true`
  - Set minimum password length to 8 characters
- [ ] Configure **Email Templates** (Authentication → Email Templates):
  - Confirm signup template
  - Reset password template
  - Magic link template (optional)
  - Set "From" address and "Subject" lines
- [ ] Configure **URL Configuration** (Authentication → URL Configuration):
  - Site URL: `http://localhost:3000`
  - Redirect URLs: `http://localhost:3000/auth/callback`
  - Add production URL when deploying later
- [ ] Configure **JWT Settings**:
  - JWT expiry: `3600` seconds (1 hour)
  - Enable refresh token rotation
- [ ] (Optional — can defer to post-Phase 1) Enable **Google OAuth**:
  - Create Google Cloud Console OAuth 2.0 Client
  - Add Client ID and Secret in Supabase Dashboard
  - Set authorized redirect URI to Supabase callback URL

**Deliverable:** Supabase Auth configured and ready to accept signUp/signIn requests.

---

#### Task 11: Create Auth Callback Route

| Field | Value |
|-------|-------|
| **Effort** | 0.25 day |
| **Priority** | P0 |
| **Dependencies** | Tasks 8, 10 |
| **Blocks** | Task 12 (OAuth flow) |

**Subtasks:**
- [ ] Create `app/auth/callback/route.ts`:
  - Handle GET request (OAuth redirects)
  - Extract `code` from URL search params
  - Exchange code for session using `supabase.auth.exchangeCodeForSession(code)`
  - Redirect to `/dashboard` on success
  - Redirect to `/login?error=auth` on failure
- [ ] Verify the route is accessible at `/auth/callback`

**Deliverable:** OAuth callback route functional, ready for Google/Apple login.

---

#### Task 12: Implement Server-Side Middleware

| Field | Value |
|-------|-------|
| **Effort** | 1.5 days |
| **Priority** | P0 — Blocker |
| **Dependencies** | Tasks 8, 9, 10 |
| **Blocks** | Tasks 14, 15 |

**Subtasks:**
- [ ] Create `middleware.ts` at project root
- [ ] Implement auth token refresh logic:
  - Create Supabase client with middleware cookie handling
  - Call `supabase.auth.getUser()` to verify/refresh session
  - Update response cookies with refreshed tokens
- [ ] Define route protection rules:
  - **Public routes** (no auth required): `/`, `/login`, `/register`, `/beta`, `/onboarding`, `/forbidden`, `/auth/callback`
  - **Protected routes** (require valid session): `/dashboard/*`, `/training/*`, `/nutrition/*`, `/progress/*`, `/profile/*`, `/settings/*`, `/ai/*`, `/ai-coach/*`, `/notifications/*`, `/recommendations/*`, `/feedback/*`, `/pricing/*`, `/subscription/*`, `/meal-planner/*`, `/shopping-list/*`, `/workouts/*`
  - **Admin routes** (require ADMIN or SUPER_ADMIN role): `/admin/*`
- [ ] Implement redirect logic:
  - No session + protected route → redirect to `/login`
  - No session + admin route → redirect to `/login`
  - Has session + USER role + admin route → redirect to `/forbidden`
  - Has session + public auth pages (`/login`, `/register`) → redirect to `/dashboard`
- [ ] For admin role checking:
  - After auth verification, query `users` table for role (using Prisma or Supabase query)
  - Cache role in a custom header or cookie to avoid repeated DB queries
- [ ] Configure `matcher` to run only on relevant paths:
  ```typescript
  export const config = {
    matcher: [
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
  };
  ```
- [ ] Add security headers in middleware response:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Test: unauthenticated access to `/dashboard` redirects to `/login`
- [ ] Test: authenticated access to `/login` redirects to `/dashboard`
- [ ] Test: USER role access to `/admin` redirects to `/forbidden`

**Deliverable:** Server-side route protection active on all paths, security headers applied.

---

#### Task 13: Create Admin User in Supabase Auth

| Field | Value |
|-------|-------|
| **Effort** | 0.25 day |
| **Priority** | P0 |
| **Dependencies** | Tasks 6, 10 |
| **Blocks** | Task 15 (AdminGuard) |

**Subtasks:**
- [ ] Create admin user in Supabase Auth via Dashboard or Admin API:
  - Email: `admin@movive.app`
  - Password: Strong password (not the old `Admin123!`)
  - Set email as confirmed
- [ ] Note the Supabase Auth UUID assigned to this user
- [ ] Update the Prisma seed script to use this exact UUID for the admin `User` record
- [ ] Re-run `npx prisma db seed` to ensure the `users` table admin row matches the Auth user ID
- [ ] Verify: login with admin credentials via Supabase Auth returns a valid session with matching UUID
- [ ] Create a Supabase database trigger (or handle in application) to auto-create a `users` row on signup:
  - Option A: SQL trigger `on auth.users INSERT` → insert into `public.users`
  - Option B: Handle in RegisterForm after `signUp()` succeeds (create profile via Prisma)
  - **Recommended: Option B** (more control, TypeScript types, works with Prisma)

**Deliverable:** Admin user exists in both Supabase Auth and `users` table with matching UUID.

---

#### Task 14: Replace LoginForm with Supabase Auth

| Field | Value |
|-------|-------|
| **Effort** | 1 day |
| **Priority** | P0 |
| **Dependencies** | Tasks 8, 12 |
| **Blocks** | None (can be tested independently) |

**Subtasks:**
- [ ] Modify `components/auth/LoginForm.tsx`:
  - Import `createBrowserClient` from `lib/supabase/client.ts`
  - Replace `handleSubmit` logic:
    - Remove localStorage reads (`fitnessapp_session`, `fitnessapp_user`, `fitnessapp_admin`)
    - Remove `seedSuperAdmin()` call
    - Call `supabase.auth.signInWithPassword({ email, password })`
    - On success: `router.push("/dashboard")` (middleware handles admin redirect)
    - On error: display Supabase error message
  - Keep the Google OAuth button:
    - Wire to `supabase.auth.signInWithOAuth({ provider: "google" })`
    - Or leave as non-functional with a "Coming soon" tooltip if Google OAuth not configured
  - Remove the `getSuperAdmin()` import and check
  - Remove the manual session object creation
  - Keep "Remember me" checkbox (maps to `supabase.auth.signInWithPassword` persistence options)
- [ ] Update the "Forgot password?" link:
  - Change from `/forgot-password` (404) to trigger `supabase.auth.resetPasswordForEmail(email)`
  - Or create a dedicated `/forgot-password` page (can defer to end of Phase 1)
- [ ] Test: valid credentials → redirects to dashboard
- [ ] Test: invalid credentials → shows error message
- [ ] Test: admin credentials → redirects to /admin (via middleware)
- [ ] Test: empty fields → shows validation error

**Deliverable:** LoginForm authenticates against Supabase Auth instead of localStorage.

---

#### Task 15: Replace RegisterForm with Supabase Auth

| Field | Value |
|-------|-------|
| **Effort** | 1 day |
| **Priority** | P0 |
| **Dependencies** | Tasks 8, 9, 12 |
| **Blocks** | None |

**Subtasks:**
- [ ] Modify `components/auth/RegisterForm.tsx`:
  - Import `createBrowserClient` from `lib/supabase/client.ts`
  - Replace `handleSubmit` logic:
    - Remove `localStorage.setItem("fitnessapp_user", ...)` call
    - Call `supabase.auth.signUp({ email, password, options: { data: { name } } })`
    - On success: create profile in `users` table via API route:
      ```
      POST /api/users (body: { name, email })
      ```
    - Or create user profile via direct Prisma call from a server action
    - Then redirect to `/onboarding`
    - On error: display Supabase error message (e.g., "User already registered")
  - Keep all existing validation (name, email format, password length, confirm match, terms)
  - Remove plain text password storage
- [ ] Create `app/api/users/route.ts` (POST handler):
  - Verify Supabase session exists (user just signed up)
  - Create `User` record in database via Prisma:
    ```typescript
    await prisma.user.create({
      data: { id: user.id, email, name, role: "USER", status: "Active" }
    });
    ```
  - Also create default `Subscription` (FREE plan)
  - Also create default `NotificationPreference`
- [ ] Test: new user registers → Supabase Auth user created → users table row created → redirects to onboarding
- [ ] Test: duplicate email → shows "User already registered" error
- [ ] Test: weak password → shows validation error

**Deliverable:** RegisterForm creates real Supabase Auth users with linked database profiles.

---

#### Task 16: Update AuthGuard Component

| Field | Value |
|-------|-------|
| **Effort** | 0.5 day |
| **Priority** | P0 |
| **Dependencies** | Tasks 8, 12 |
| **Blocks** | None |

**Subtasks:**
- [ ] Modify `components/auth/AuthGuard.tsx`:
  - Replace `localStorage.getItem("fitnessapp_session")` with Supabase session check
  - Use `createBrowserClient` and `supabase.auth.getSession()`
  - On no session: redirect to `/login` (backup for middleware)
  - On valid session: render children
  - Keep loading spinner during session verification
  - Note: primary protection is now in `middleware.ts`; this is a UI-level fallback
- [ ] Modify `components/admin/AdminGuard.tsx`:
  - Replace localStorage role check with Supabase session + database role query
  - Get user ID from session, fetch role from API or pass via context
  - On role = USER: redirect to `/dashboard`
  - On role = ADMIN or SUPER_ADMIN: render children
- [ ] Consider creating a `useUser()` hook:
  - Returns: `{ user, role, isLoading, isAuthenticated }`
  - Sources data from Supabase session + database profile
  - Reusable across AuthGuard, AdminGuard, and any component needing user context

**Deliverable:** Guards use Supabase Auth; localStorage auth checks completely removed.

---

#### Task 17: Create Role Checking Utility

| Field | Value |
|-------|-------|
| **Effort** | 0.25 day |
| **Priority** | P0 |
| **Dependencies** | Tasks 8, 9 |
| **Blocks** | Task 12 (middleware uses it), Task 16 |

**Subtasks:**
- [ ] Create `lib/auth/roles.ts`:
  - Export `getUserRole(userId: string): Promise<UserRole>` — queries `users` table via Prisma
  - Export `requireRole(allowedRoles: UserRole[]): Promise<User | null>` — verifies session + role
  - Export `isAdmin(userId: string): Promise<boolean>` — checks ADMIN or SUPER_ADMIN
  - Export type re-exports for `UserRole`
- [ ] Cache role in the Supabase session's user metadata (optional optimization):
  - On login/signup, store role in `user_metadata`
  - Avoids DB query on every middleware invocation
  - Invalidate cache on role change (admin action)

**Deliverable:** Reusable role-checking functions for middleware, API routes, and components.

---

#### Task 18: Create API Error Handling Utility

| Field | Value |
|-------|-------|
| **Effort** | 0.25 day |
| **Priority** | P1 |
| **Dependencies** | None |
| **Blocks** | None (nice to have for Task 15's API route) |

**Subtasks:**
- [ ] Create `lib/api/errors.ts`:
  - Export `AppError` class (statusCode, code, message)
  - Export `handleApiError(error: unknown): Response` function
  - Standard error codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`
- [ ] Create `lib/api/response.ts`:
  - Export `success(data, meta?)` helper
  - Export `error(code, message, status)` helper
  - Ensures consistent response format across all future API routes

**Deliverable:** Standardized API error/response utilities ready for all route handlers.

---

#### Task 19: Remove Deprecated Auth Files

| Field | Value |
|-------|-------|
| **Effort** | 0.25 day |
| **Priority** | P1 |
| **Dependencies** | Tasks 14, 15, 16 |
| **Blocks** | None |

**Subtasks:**
- [ ] Delete `lib/auth/seed-admin.ts` (admin now created via Prisma seed + Supabase Auth)
- [ ] Remove `seedSuperAdmin()` import from `LoginForm.tsx` (done in Task 14)
- [ ] Remove `getSuperAdmin()` import from `LoginForm.tsx` (done in Task 14)
- [ ] Search for any remaining references to:
  - `localStorage.getItem("fitnessapp_session")` in non-guard files
  - `localStorage.getItem("fitnessapp_user")` in auth context
  - `localStorage.getItem("fitnessapp_admin")`
  - `localStorage.setItem("fitnessapp_session", ...)`
- [ ] Document any remaining localStorage references that belong to Phase 2+ (data stores)
- [ ] Verify app compiles without errors: `npm run build`

**Deliverable:** Old auth infrastructure removed; no plain-text passwords anywhere in auth flow.

---

### Block E: Row Level Security & Validation

---

#### Task 20: Enable Row Level Security

| Field | Value |
|-------|-------|
| **Effort** | 1 day |
| **Priority** | P0 |
| **Dependencies** | Tasks 5, 13 |
| **Blocks** | None (but critical for security) |

**Subtasks:**
- [ ] Enable RLS on all tables via Supabase SQL Editor:
  ```sql
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
  -- ... repeat for all tables
  ```
- [ ] Create policies for **users** table:
  - SELECT own: `auth.uid() = id`
  - UPDATE own: `auth.uid() = id`
  - Admin SELECT all: check role in subquery
- [ ] Create policies for **user-scoped tables** (same pattern):
  - `weight_entries`, `measurement_entries`, `progress_photos`, `training_sessions`, `session_exercise_logs`, `session_set_logs`, `meal_logs`, `meal_plans`, `notifications`, `notification_preferences`, `recommendations`, `daily_checkins`, `ai_chat_messages`, `shopping_lists`, `subscriptions`, `ai_usage`, `feedback`
  - Pattern: `auth.uid() = user_id` for all operations
- [ ] Create policies for **shared read tables**:
  - `exercises`, `ingredients`, `recipes`, `recipe_ingredients`, `recipe_instructions`, `workout_exercises`, `workout_days`, `workouts` (templates)
  - SELECT: `auth.uid() IS NOT NULL` (any authenticated user)
  - INSERT/UPDATE/DELETE: admin only (role check via subquery)
- [ ] Create policies for **admin-only tables**:
  - `audit_log`, `platform_settings`, `recommendation_rules`, `beta_registrations`
  - All operations: admin role check
- [ ] Test RLS:
  - As regular user: can read exercises, cannot modify them
  - As regular user: can CRUD own training sessions, cannot see others'
  - As admin: can read all users, modify exercises
- [ ] Note: API routes using `SUPABASE_SERVICE_ROLE_KEY` bypass RLS (for admin operations)

**Deliverable:** All tables protected by RLS; data isolation enforced at database level.

---

### Block F: Integration Verification

---

#### Task 21: End-to-End Auth Flow Testing

| Field | Value |
|-------|-------|
| **Effort** | 0.5 day |
| **Priority** | P0 |
| **Dependencies** | Tasks 14, 15, 16, 19 |
| **Blocks** | Phase 1 completion |

**Subtasks:**
- [ ] Test complete registration flow:
  1. Navigate to `/register`
  2. Fill form with new credentials
  3. Submit → Supabase Auth user created
  4. Database `users` row created
  5. Redirected to `/onboarding`
  6. Session cookie set
- [ ] Test complete login flow:
  1. Navigate to `/login`
  2. Enter valid credentials
  3. Submit → session established
  4. Redirected to `/dashboard`
  5. Subsequent page navigations work without re-login
- [ ] Test admin login flow:
  1. Login with admin credentials
  2. Redirected to `/admin`
  3. Admin panel accessible
  4. User routes also accessible
- [ ] Test middleware protection:
  1. Clear cookies / open incognito
  2. Navigate to `/dashboard` → redirected to `/login`
  3. Navigate to `/admin` → redirected to `/login`
  4. Login as USER → navigate to `/admin` → redirected to `/forbidden`
- [ ] Test logout:
  1. Call `supabase.auth.signOut()` (add temporary logout button if needed)
  2. Session cookie cleared
  3. Protected routes become inaccessible
- [ ] Test session persistence:
  1. Login → close browser → reopen → still authenticated (cookie persists)
- [ ] Verify build succeeds: `npm run build` (no TypeScript errors)

**Deliverable:** All auth flows verified working end-to-end.

---

#### Task 22: Create Supabase Storage Bucket (Preparation)

| Field | Value |
|-------|-------|
| **Effort** | 0.25 day |
| **Priority** | P1 |
| **Dependencies** | Task 1 |
| **Blocks** | Phase 2 (photo upload) |

**Subtasks:**
- [ ] Create storage bucket `progress-photos` in Supabase Dashboard:
  - Public: `false` (private bucket, accessed via signed URLs)
  - File size limit: 5 MB
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- [ ] Create RLS policies for the bucket:
  - Users can upload to their own folder: `auth.uid()::text = (storage.foldername(name))[1]`
  - Users can read their own files
  - Users can delete their own files
- [ ] Document bucket name and policies for Phase 2 implementation

**Deliverable:** Storage bucket ready for Phase 2 photo migration.

---

## Dependency Graph

```
Task 1 (Supabase Project)
  ├── Task 2 (Env Vars)
  │     └── Task 3 (Dependencies)
  │           ├── Task 4 (Prisma Schema)
  │           │     └── Task 5 (Migration)
  │           │           ├── Task 6 (Seed Script)
  │           │           │     └── Task 7 (Verify DB)
  │           │           └── Task 9 (Prisma Singleton)
  │           └── Task 8 (Supabase Clients)
  │                 ├── Task 11 (Auth Callback)
  │                 ├── Task 12 (Middleware)
  │                 │     ├── Task 14 (LoginForm)
  │                 │     ├── Task 15 (RegisterForm)
  │                 │     └── Task 16 (Guards)
  │                 └── Task 17 (Role Utils)
  ├── Task 10 (Auth Providers Config)
  │     ├── Task 11
  │     ├── Task 12
  │     └── Task 13 (Admin User)
  └── Task 22 (Storage Bucket)

Task 18 (Error Utils) — Independent
Task 19 (Remove Old Auth) — After 14, 15, 16
Task 20 (RLS) — After 5, 13
Task 21 (E2E Testing) — After 14, 15, 16, 19
```

---

## Effort Summary

| Block | Tasks | Effort |
|-------|-------|--------|
| **A: Environment & Setup** | 1, 2, 3 | 1.25 days |
| **B: Database & Prisma** | 4, 5, 6, 7 | 4.75 days |
| **C: Supabase Infrastructure** | 8, 9 | 0.75 days |
| **D: Auth Migration** | 10, 11, 12, 13, 14, 15, 16, 17, 18, 19 | 5.75 days |
| **E: Row Level Security** | 20 | 1 day |
| **F: Integration Verification** | 21, 22 | 0.75 days |
| **TOTAL** | **22 tasks** | **14.25 days (~3 weeks)** |

---

## Success Criteria (Phase 1 Gate)

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Supabase project live with PostgreSQL | Supabase Studio shows all tables |
| 2 | Prisma schema compiles without errors | `npx prisma validate` passes |
| 3 | All 30+ tables created with correct indexes | Check via Studio + migration file |
| 4 | Seed data populated | 50 exercises + 50 ingredients + 12 recipes + 8 templates |
| 5 | Registration creates real user | Supabase Auth + `users` table row |
| 6 | Login returns valid JWT session | Cookie set, `getUser()` returns data |
| 7 | Middleware protects all routes | Unauthenticated → `/login` redirect |
| 8 | Admin routes require admin role | USER role → `/forbidden` redirect |
| 9 | RLS policies active | User cannot query other users' data |
| 10 | `npm run build` succeeds | 0 TypeScript errors |
| 11 | No plain-text passwords in codebase | `seed-admin.ts` deleted, no LS passwords |
| 12 | Storage bucket configured | Ready for Phase 2 photo uploads |

---

## What Phase 1 Does NOT Include

These items are explicitly deferred to Phase 2+:

- ❌ API routes for data CRUD (exercises, workouts, nutrition, etc.)
- ❌ Replacing localStorage data stores with API calls
- ❌ Client-side data fetching hooks (SWR/React Query)
- ❌ Photo upload to Supabase Storage
- ❌ Stripe/payment integration
- ❌ Email notifications (Resend/SendGrid)
- ❌ Real AI provider integration
- ❌ Rate limiting (Upstash Redis)
- ❌ Sentry error monitoring
- ❌ CI/CD pipeline

---

## Files Created in Phase 1

| File | Purpose |
|------|---------|
| `.env.local` | Environment variables (git-ignored) |
| `.env.local.example` | Template for team |
| `prisma/schema.prisma` | Complete database schema |
| `prisma/seed.ts` | Seed script for reference data |
| `lib/supabase/server.ts` | Server-side Supabase client |
| `lib/supabase/client.ts` | Browser-side Supabase client |
| `lib/supabase/admin.ts` | Admin Supabase client (service role) |
| `lib/prisma.ts` | Prisma Client singleton |
| `lib/auth/roles.ts` | Role checking utilities |
| `lib/api/errors.ts` | Standardized error handling |
| `lib/api/response.ts` | Response format helpers |
| `middleware.ts` | Root middleware (auth + protection) |
| `app/auth/callback/route.ts` | OAuth callback handler |
| `app/api/users/route.ts` | POST: create user profile on registration |

## Files Modified in Phase 1

| File | Change |
|------|--------|
| `package.json` | New dependencies + scripts |
| `components/auth/LoginForm.tsx` | Supabase Auth signIn |
| `components/auth/RegisterForm.tsx` | Supabase Auth signUp + API profile creation |
| `components/auth/AuthGuard.tsx` | Supabase session check |
| `components/admin/AdminGuard.tsx` | Supabase session + role check |
| `.gitignore` | Ensure `.env.local` is ignored |

## Files Deleted in Phase 1

| File | Reason |
|------|--------|
| `lib/auth/seed-admin.ts` | Replaced by Prisma seed + Supabase Auth user |

---

*Next Phase: Phase 2 — Core API Routes & Service Layer (Week 4-6)*
