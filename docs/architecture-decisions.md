# FitnessApp — Architecture Decision Log

**Date:** August 25, 2026  
**Status:** Locked (ready for implementation)  
**Architecture:** Supabase Only (no Prisma)

---

## Locked Decisions

| ID | Decision | Choice | Rationale |
|----|----------|--------|-----------|
| D1 | Denormalize `user_id` on child tables | ✅ **Yes** | Simpler RLS policies, better Realtime compatibility, avoids JOIN-based policy performance issues |
| D2 | Subscriptions RLS: user read-only | ✅ **Yes** | Only webhook/admin can modify subscriptions. Prevents self-upgrade exploit |
| D3 | Trigger scope | ✅ **Minimal (users only)** | Trigger creates `users` row on signup. `subscriptions` and `notification_preferences` created at application level for visibility and control |
| D4 | Column type for enums | ✅ **PostgreSQL enums** | Better type generation, DB-level validation, compile-time safety |
| D5 | RPC functions for multi-table inserts | ❌ **Deferred** | Not implementing until real performance need arises. Sequential client calls are fine for 100-1K users |
| D6 | Local Supabase for development | ❌ **Remote project for Phase 1** | Simpler setup; revisit for Phase 2 |
| D7 | Rate limiting | 🔜 **Upstash Redis (Phase 3)** | Will implement when AI routes are built |
| D8 | Type helper convention | ✅ **Centralized `types/database.ts`** | Clean aliases for all tables + manual union types for enums |

---

## Architectural Constraints

| Constraint | Rule |
|-----------|------|
| **No Prisma** | All data access via Supabase JS Client |
| **No Realtime in MVP** | Deferred to post-MVP. App must work without WebSockets |
| **No RPC functions unless needed** | Use sequential client calls; create RPC only when performance demands it |
| **API routes only for secrets** | AI proxy, Stripe webhooks, server-side exports. No CRUD API routes |
| **RLS is mandatory** | Every table has RLS enabled with at least one policy |
| **100-1,000 users** | Architecture optimized for this scale. No premature optimization |
| **Solo developer** | Minimize abstraction layers, maximize simplicity |

---

## Schema Impact of D1 (Denormalized `user_id`)

The following tables will have a **`user_id` column added** (not in the original `database-schema.sql`):

| Table | Current FK Chain | Added Column |
|-------|-----------------|--------------|
| `session_exercise_logs` | → `training_sessions.user_id` | `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE` |
| `session_set_logs` | → `session_exercise_logs` → `training_sessions.user_id` | `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE` |
| `workout_days` | → `workouts.user_id` | `user_id UUID REFERENCES users(id) ON DELETE CASCADE` (nullable for templates) |
| `workout_exercises` | → `workout_days` → `workouts.user_id` | `user_id UUID REFERENCES users(id) ON DELETE CASCADE` (nullable for templates) |

**RLS simplification result:**
```sql
-- BEFORE (without denormalization): complex JOIN-based policy
CREATE POLICY "own_set_logs" ON session_set_logs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM session_exercise_logs sel
    JOIN training_sessions ts ON ts.id = sel.session_id
    WHERE sel.id = session_set_logs.exercise_log_id
    AND ts.user_id = auth.uid()
  )
);

-- AFTER (with denormalization): simple direct check
CREATE POLICY "own_set_logs" ON session_set_logs FOR ALL USING (
  auth.uid() = user_id
);
```

---

## Schema Impact of D2 (Read-Only Subscriptions)

```sql
-- Users can ONLY read their own subscription
CREATE POLICY "user_read_own_subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for regular users
-- Only service_role (webhook handler) can modify subscriptions
```

**Application impact:**
- Upgrade/cancel UI shows Stripe Checkout / Customer Portal
- Subscription changes happen ONLY via Stripe webhook → service role UPDATE
- Client can verify subscription status but cannot modify it

---

## Schema Impact of D3 (Minimal Trigger)

```sql
-- Trigger ONLY creates the users row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'user_name',
      split_part(NEW.email, '@', 1)
    ),
    'USER',
    'Active',
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block auth signup
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Application responsibility (after signup):**
```typescript
// After successful signUp, client calls:
await supabase.from('subscriptions').insert({ user_id: user.id, plan: 'FREE', status: 'Active', start_date: today });
await supabase.from('notification_preferences').insert({ user_id: user.id });
```

This makes subscription and preference creation **visible, testable, and extendable** at the application level.

---

## Schema Impact of D4 (PostgreSQL Enums)

Replace VARCHAR columns with PostgreSQL enum types:

```sql
-- Create enum types
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE user_status AS ENUM ('Active', 'Suspended', 'Deleted');
CREATE TYPE plan_type AS ENUM ('FREE', 'PREMIUM_MONTHLY', 'PREMIUM_YEARLY');
CREATE TYPE subscription_status AS ENUM ('Active', 'Trial', 'Expired', 'Cancelled', 'Pending');
CREATE TYPE exercise_category AS ENUM ('Strength', 'Calisthenics', 'Cardio', 'Mobility', 'Flexibility');
CREATE TYPE exercise_difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE meal_type AS ENUM ('Breakfast', 'Lunch', 'Dinner', 'Snack');
CREATE TYPE notification_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
CREATE TYPE notification_status AS ENUM ('Unread', 'Read', 'Archived');
CREATE TYPE session_status AS ENUM ('In Progress', 'Completed', 'Cancelled');
CREATE TYPE photo_type AS ENUM ('Front', 'Side', 'Back');

-- Usage in tables:
ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;
ALTER TABLE users ALTER COLUMN status TYPE user_status USING status::user_status;
-- ... etc
```

**Generated TypeScript result:**
```typescript
// supabase gen types will produce:
export type Database = {
  public: {
    Enums: {
      user_role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
      user_status: 'Active' | 'Suspended' | 'Deleted';
      plan_type: 'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY';
      // ... all enums as union types
    };
  };
};
```

---

## Schema Impact of D8 (Centralized Types)

Create `types/database.ts` alongside the generated `types/supabase.ts`:

```typescript
// types/database.ts — Clean aliases for daily use
import type { Database } from './supabase';

// ── Table Row Types ─────────────────────────────────────────
export type User = Database['public']['Tables']['users']['Row'];
export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type Ingredient = Database['public']['Tables']['ingredients']['Row'];
export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type Workout = Database['public']['Tables']['workouts']['Row'];
export type WorkoutDay = Database['public']['Tables']['workout_days']['Row'];
export type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];
export type TrainingSession = Database['public']['Tables']['training_sessions']['Row'];
export type MealLog = Database['public']['Tables']['meal_logs']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
// ... all 32+ tables

// ── Insert Types ────────────────────────────────────────────
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type ExerciseInsert = Database['public']['Tables']['exercises']['Insert'];
// ... as needed

// ── Update Types ────────────────────────────────────────────
export type UserUpdate = Database['public']['Tables']['users']['Update'];
// ... as needed

// ── Enum Types (from PostgreSQL enums) ──────────────────────
export type UserRole = Database['public']['Enums']['user_role'];
export type UserStatus = Database['public']['Enums']['user_status'];
export type PlanType = Database['public']['Enums']['plan_type'];
export type SubscriptionStatus = Database['public']['Enums']['subscription_status'];
export type ExerciseCategory = Database['public']['Enums']['exercise_category'];
export type ExerciseDifficulty = Database['public']['Enums']['exercise_difficulty'];
export type MealType = Database['public']['Enums']['meal_type'];
export type SessionStatus = Database['public']['Enums']['session_status'];
export type PhotoType = Database['public']['Enums']['photo_type'];

// ── Composite Types (relations) ─────────────────────────────
export type WorkoutWithDays = Workout & {
  workout_days: (WorkoutDay & {
    workout_exercises: WorkoutExercise[];
  })[];
};

export type RecipeWithDetails = Recipe & {
  recipe_ingredients: Database['public']['Tables']['recipe_ingredients']['Row'][];
  recipe_instructions: Database['public']['Tables']['recipe_instructions']['Row'][];
};

export type TrainingSessionWithLogs = TrainingSession & {
  session_exercise_logs: (Database['public']['Tables']['session_exercise_logs']['Row'] & {
    session_set_logs: Database['public']['Tables']['session_set_logs']['Row'][];
  })[];
};
```

---

## What Is NOT in the MVP

| Feature | Status | When |
|---------|--------|------|
| Supabase Realtime | ❌ Excluded | Post-MVP (after 500+ users) |
| RPC functions | ❌ Excluded | Only if performance requires |
| Supabase Edge Functions | ❌ Excluded | Only if cron jobs needed (subscription expiry) |
| Rate limiting | 🔜 Phase 3 | When AI routes are built |
| Stripe integration | 🔜 Phase 3 | After core data migration complete |
| AI provider integration | 🔜 Phase 3 | After core data migration complete |
| pg_cron | ❌ Excluded | Requires Pro plan; use Vercel Cron if needed |
| Multi-region / Read replicas | ❌ Excluded | Not needed at this scale |
| Local Supabase (Docker) | ❌ Phase 1 | May adopt in Phase 2 |

---

## Implementation Order (Updated Phase 1)

With these decisions locked, the Phase 1 implementation follows `docs/phase-1-supabase-only.md` with these modifications:

1. **Migration SQL** (P1-05) now includes:
   - PostgreSQL enum type definitions (D4)
   - `user_id` columns on child tables (D1)
   - No `password_hash` on `users`

2. **Trigger** (P1-14) is minimal:
   - Only creates `users` row (D3)
   - Includes EXCEPTION handler for safety
   - Handles multiple OAuth name formats

3. **RegisterForm** (P1-16) now also:
   - Creates `subscriptions` row (FREE plan) after signup
   - Creates `notification_preferences` row after signup
   - Both via direct Supabase client INSERT (D3)

4. **RLS policies** (P1-10) are simplified:
   - Child tables use direct `auth.uid() = user_id` (D1)
   - Subscriptions are SELECT-only for users (D2)
   - No complex JOIN-based policies needed

5. **Type generation** (P1-08) produces enum union types:
   - PostgreSQL enums → TypeScript union types automatically (D4)
   - `types/database.ts` provides clean aliases (D8)

---

## Sign-Off

These decisions are **final for Phase 1 implementation**. Any changes require a new decision record with justification.

| Role | Status |
|------|--------|
| Architecture | ✅ Approved |
| Implementation | 🟡 Ready to begin |
| Review | Pending (post-implementation) |
