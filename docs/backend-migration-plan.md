# Movive — Complete Backend Migration Plan

**Version:** 1.0.0  
**Date:** August 25, 2026  
**Status:** Planning  
**Author:** Generated from codebase analysis

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Target Architecture](#3-target-architecture)
4. [Database Migration Strategy](#4-database-migration-strategy)
5. [Authentication Migration Strategy](#5-authentication-migration-strategy)
6. [localStorage Migration Strategy](#6-localstorage-migration-strategy)
7. [API Architecture](#7-api-architecture)
8. [Prisma Schema Generation Plan](#8-prisma-schema-generation-plan)
9. [Estimated Effort](#9-estimated-effort)
10. [Risk Assessment & Mitigation](#10-risk-assessment--mitigation)
11. [Implementation Phases](#11-implementation-phases)

---

## 1. Executive Summary

### Current State

The Movive is a **120+ page frontend prototype** built with Next.js 16, React 19, and TypeScript. All data persistence relies on browser `localStorage`, with no backend infrastructure, no real authentication, and no database connection.

### Target State

Migrate to a production-ready architecture using:

| Layer | Technology |
|-------|-----------|
| **Database** | PostgreSQL (via Supabase) |
| **ORM** | Prisma |
| **Authentication** | Supabase Auth |
| **File Storage** | Supabase Storage |
| **API Layer** | Next.js Route Handlers (`app/api/`) |
| **Real-time** | Supabase Realtime (future) |

### Migration Scope

- **31 localStorage keys** → PostgreSQL tables via Prisma
- **Simulated auth** → Supabase Auth (JWT + RLS)
- **Base64 images** → Supabase Storage buckets
- **15 store files** → Server-side API routes
- **0 API routes** → ~45 route handlers

---

## 2. Current Architecture Analysis

### 2.1 localStorage Keys Inventory

| # | Key | Module | Data Type | Avg Size |
|---|-----|--------|-----------|----------|
| 1 | `fitnessapp_session` | Auth | Object | <1 KB |
| 2 | `fitnessapp_user` | Auth/Profile | Object | 1-2 KB |
| 3 | `fitnessapp_admin` | Auth | Object | <1 KB |
| 4 | `fitnessapp_workouts` | Workouts | Array | 5-50 KB |
| 5 | `fitnessapp_workout_templates` | Workouts | Array | 20-50 KB |
| 6 | `fitnessapp_training_sessions` | Training | Array | 10-100 KB |
| 7 | `fitnessapp_active_session` | Training | Object/null | 2-5 KB |
| 8 | `fitnessapp_recipes` | Nutrition | Array | 10-30 KB |
| 9 | `fitnessapp_ingredients` | Nutrition | Array | 10-20 KB |
| 10 | `fitnessapp_exercises` | Exercises | Array | 30-50 KB |
| 11 | `fitnessapp_progress_photos` | Progress | Array | 500 KB-5 MB (base64) |
| 12 | `fitnessapp_nutrition_meals` | Nutrition | Array | 5-50 KB |
| 13 | `fitnessapp_platform_users` | Admin | Array | 2-5 KB |
| 14 | `fitnessapp_audit_log` | Admin | Array (max 100) | 5-15 KB |
| 15 | `fitnessapp_platform_settings` | Admin | Object | <1 KB |
| 16 | `fitnessapp_notifications` | Notifications | Array | 5-20 KB |
| 17 | `fitnessapp_notification_preferences` | Notifications | Object | <1 KB |
| 18 | `fitnessapp_subscription` | Billing | Object | <1 KB |
| 19 | `fitnessapp_all_subscriptions` | Admin/Billing | Array | 2-5 KB |
| 20 | `fitnessapp_daily_checkins` | AI Coach | Array | 2-10 KB |
| 21 | `fitnessapp_coach_chat` | AI Coach | Array | 5-50 KB |
| 22 | `fitnessapp_recommendations` | Recommendations | Array | 3-10 KB |
| 23 | `fitnessapp_recommendation_rules` | Recommendations | Array | 3-5 KB |
| 24 | `fitnessapp_tracking_events` | Monitoring | Array (max 200) | 10-30 KB |
| 25 | `fitnessapp_error_log` | Monitoring | Array (max 100) | 5-15 KB |
| 26 | `fitnessapp_measurement_history` | Progress | Array | 5-20 KB |
| 27 | `fitnessapp_progress` | Progress | Object | 1-5 KB |
| 28 | `fitnessapp_weekly_meal_plan` | Meal Planner | Object | 2-10 KB |
| 29 | `fitnessapp_saved_meal_plans` | Meal Planner | Array | 5-30 KB |
| 30 | `fitnessapp_smart_shopping_list` | Shopping | Object | 2-10 KB |
| 31 | `fitnessapp_backups_metadata` | Data Export | Array | 1-5 KB |

### 2.2 Current Store Files

| File | Functions | Dependencies |
|------|-----------|-------------|
| `lib/workouts-store.ts` | load/save/add/update/delete/duplicate + templates | `data/workouts.ts` |
| `lib/recipes-store.ts` | load/save/add/update/delete/getById | `data/recipes.ts` |
| `lib/ingredients-store.ts` | load/save/add/update/delete | `data/ingredients-seed.ts` |
| `lib/training-store.ts` | sessions CRUD, active session, PRs, stats | `data/training-sessions.ts` |
| `lib/exercises-store.ts` | load/save/add/update/delete/getById | `data/exercises.ts` |
| `lib/progress-photos-store.ts` | load/save/add/delete, stats, achievements | — |
| `lib/admin-platform.ts` | users CRUD, audit log, settings, stats, roles | — |
| `lib/subscription.ts` | plans, upgrade/cancel/trial, feature gates, usage | — |
| `lib/notifications.ts` | CRUD, preferences, reminders, stats | — |
| `lib/ai-coach.ts` | check-ins, chat, rule engine, responses | — |
| `lib/recommendation-engine.ts` | rules, engine, generate, weekly summary | — |
| `lib/data-export.ts` | export/import, backup/restore, validation | — |
| `lib/monitoring.ts` | event/error logging, stats | — |
| `lib/ai/provider.ts` | AI providers (all placeholder) | `lib/ai/types.ts` |
| `lib/ai/context-manager.ts` | Build AI context from localStorage | — |
| `lib/ai/prompt-builder.ts` | System prompts, chat prompts | `lib/ai/types.ts` |

### 2.3 Current Auth Implementation

```
┌─ Registration ─┐       ┌─ Login ─────────────┐       ┌─ Route Guard ────────┐
│ RegisterForm    │       │ LoginForm            │       │ AuthGuard            │
│ • Saves plain   │       │ • Compares plain     │       │ • Checks localStorage│
│   password to   │       │   password from      │       │   for session key    │
│   localStorage  │       │   localStorage       │       │ • Client-side only   │
│ • Redirects to  │       │ • Creates session    │       │ • Easily bypassed    │
│   /onboarding   │       │   object in LS       │       └──────────────────────┘
└─────────────────┘       │ • Role-based redirect│
                          └──────────────────────┘

Session Object: { isAuthenticated, loginAt, userId, name, email, role }
Admin: Hardcoded in lib/auth/seed-admin.ts (admin@movive.app / Admin123!)
Roles: USER, ADMIN, SUPER_ADMIN (enforced only client-side)
```

---

## 3. Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                       │
│  Next.js 16 App Router + React 19 + TypeScript               │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │ Pages/Routes │  │ Components    │  │ Client Hooks     │  │
│  │ (unchanged) │  │ (minor edits) │  │ (new: useSWR/TQ) │  │
│  └─────────────┘  └───────────────┘  └──────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP (fetch)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS API LAYER                          │
│  app/api/                                                    │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │ Auth Routes│  │ CRUD Routes  │  │ AI Proxy Routes     │ │
│  │ (Supabase) │  │ (Prisma)     │  │ (server-side only)  │ │
│  └────────────┘  └──────────────┘  └─────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Middleware: Auth verification, RBAC, Rate limiting      │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │ Prisma Client
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                       SUPABASE                               │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ PostgreSQL   │  │ Supabase Auth │  │ Supabase Storage│  │
│  │ (25 tables)  │  │ (JWT + RLS)   │  │ (photos/files) │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
│  ┌──────────────┐  ┌───────────────┐                        │
│  │ Row Level    │  │ Realtime      │                        │
│  │ Security     │  │ (future)      │                        │
│  └──────────────┘  └───────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Database Migration Strategy

### 4.1 Approach

Use **Prisma Migrate** to manage schema evolution. The existing `docs/database-schema.sql` serves as the reference blueprint but will be translated into Prisma schema format for type safety and migration management.

### 4.2 Table Mapping (localStorage → PostgreSQL)

| localStorage Key | Target Table(s) | Migration Notes |
|-----------------|-----------------|-----------------|
| `fitnessapp_user` | `users` | Split auth data to Supabase Auth, profile data to `users` |
| `fitnessapp_admin` | `users` (role=SUPER_ADMIN) | Seed via Prisma seed script |
| `fitnessapp_session` | Supabase Auth sessions | Managed by Supabase, not stored in DB |
| `fitnessapp_platform_users` | `users` | Real users table replaces seed data |
| `fitnessapp_workouts` | `workouts` + `workout_days` + `workout_exercises` | Denormalized → normalized (3 tables) |
| `fitnessapp_workout_templates` | `workouts` (is_template=true) | Same table, flagged as template |
| `fitnessapp_training_sessions` | `training_sessions` + `session_exercise_logs` + `session_set_logs` | 3-level normalization |
| `fitnessapp_active_session` | `training_sessions` (status='In Progress') | Query filter, no separate table |
| `fitnessapp_exercises` | `exercises` | Direct mapping, JSONB for arrays |
| `fitnessapp_recipes` | `recipes` + `recipe_ingredients` + `recipe_instructions` | Normalize ingredients/steps |
| `fitnessapp_ingredients` | `ingredients` | Direct mapping |
| `fitnessapp_nutrition_meals` | `meal_logs` | Direct mapping |
| `fitnessapp_progress_photos` | `progress_photos` | Move base64 → Supabase Storage, store URL |
| `fitnessapp_measurement_history` | `measurement_entries` | Flatten nested measurements object |
| `fitnessapp_daily_checkins` | `daily_checkins` | Direct mapping |
| `fitnessapp_subscription` | `subscriptions` | Direct mapping |
| `fitnessapp_all_subscriptions` | `subscriptions` | Merge into single table |
| `fitnessapp_notifications` | `notifications` | Direct mapping |
| `fitnessapp_notification_preferences` | `notification_preferences` (new) | Separate table per user |
| `fitnessapp_recommendations` | `recommendations` | Direct mapping |
| `fitnessapp_recommendation_rules` | `recommendation_rules` (new) | Admin-managed rules table |
| `fitnessapp_coach_chat` | `ai_chat_messages` (new) | Per-user conversation history |
| `fitnessapp_weekly_meal_plan` | `meal_plans` | JSONB for plan_data |
| `fitnessapp_saved_meal_plans` | `meal_plans` | Multiple rows per user |
| `fitnessapp_smart_shopping_list` | `shopping_lists` (new) | Generated from meal plans |
| `fitnessapp_audit_log` | `audit_log` | Direct mapping |
| `fitnessapp_platform_settings` | `platform_settings` (new) | Key-value or single row |
| `fitnessapp_tracking_events` | `analytics_events` (new) | High-volume, consider partitioning |
| `fitnessapp_error_log` | External (Sentry) | Don't store in DB, send to monitoring |
| `fitnessapp_backups_metadata` | `backups` (new) | Metadata only, files in Storage |
| `fitnessapp_progress` | `weight_entries` | Normalize weight log entries |

### 4.3 Migration Steps

```
Step 1: Create Supabase project
Step 2: Generate Prisma schema from docs/database-schema.sql
Step 3: Add new tables not in original schema
Step 4: Run prisma migrate dev (creates initial migration)
Step 5: Create seed script from data/ directory
Step 6: Run prisma db seed
Step 7: Enable Row Level Security policies
Step 8: Verify with Supabase Studio
```

### 4.4 New Tables (Not in Original Schema)

| Table | Purpose | Columns |
|-------|---------|---------|
| `notification_preferences` | Per-user notification settings | user_id, workout_reminders, nutrition_reminders, progress_reminders, etc. |
| `recommendation_rules` | Admin-configurable rule definitions | id, name, category, description, enabled, priority, evaluator_type |
| `ai_chat_messages` | Conversation persistence | id, user_id, role, content, timestamp, session_id |
| `shopping_lists` | Generated shopping lists | id, user_id, items (JSONB), meal_plan_id, created_at |
| `platform_settings` | Global app configuration | id, key, value (JSONB), updated_at |
| `analytics_events` | Usage tracking | id, user_id, type, name, properties (JSONB), timestamp |
| `backups` | Backup metadata | id, user_id, file_url, file_size, categories, created_at |

### 4.5 Data Type Conversions

| localStorage Type | PostgreSQL Type | Notes |
|-------------------|----------------|-------|
| `string` (UUID) | `UUID` | Use `gen_random_uuid()` |
| `string` (date) | `DATE` or `TIMESTAMPTZ` | Parse ISO strings |
| `number` | `DECIMAL` or `INT` | Based on precision needs |
| `boolean` | `BOOLEAN` | Direct mapping |
| `string[]` | `JSONB` or normalized table | Depends on query needs |
| `object` (nested) | `JSONB` or normalized table | Normalize if queried frequently |
| `base64 string` | `TEXT` (URL) + Supabase Storage | Move binary data out of DB |

---

## 5. Authentication Migration Strategy

### 5.1 Current vs Target

| Aspect | Current (localStorage) | Target (Supabase Auth) |
|--------|----------------------|----------------------|
| Registration | Saves plain text to `fitnessapp_user` | `supabase.auth.signUp()` with email/password |
| Login | Compares plain text strings | `supabase.auth.signInWithPassword()` |
| Session | JSON in `fitnessapp_session` | JWT in HTTP-only cookie |
| Route Protection | Client-side `AuthGuard` component | Server-side `middleware.ts` + client guard |
| Password Storage | Plain text in localStorage | bcrypt hash in Supabase Auth |
| Roles | Field in session object | Custom claims or `users.role` column |
| Admin Access | Hardcoded credentials | Database-defined SUPER_ADMIN role |
| Social Login | UI button only (non-functional) | Supabase OAuth (Google, Apple, GitHub) |
| Email Verification | None | Supabase built-in email confirmation |
| Password Reset | None (link to `/forgot-password` 404s) | Supabase built-in reset flow |

### 5.2 Migration Steps

#### Phase 1: Supabase Auth Setup

```
1. Enable Email/Password provider in Supabase Dashboard
2. Configure email templates (confirmation, reset, magic link)
3. Enable Google OAuth provider
4. Set JWT expiry and refresh token rotation
5. Configure redirect URLs for auth flows
```

#### Phase 2: Create Server-Side Auth Utilities

```typescript
// lib/supabase/server.ts — Server-side Supabase client
// lib/supabase/client.ts — Browser-side Supabase client
// lib/supabase/middleware.ts — Auth middleware helper
// lib/auth/roles.ts — Role checking utilities
```

#### Phase 3: Implement Middleware

```typescript
// middleware.ts (root)
// - Verify JWT on every request
// - Refresh expired tokens
// - Redirect unauthenticated users to /login
// - Redirect non-admin users from /admin/* to /dashboard
// - Set user context for downstream API routes
```

#### Phase 4: Replace Auth Components

| Component | Change Required |
|-----------|----------------|
| `components/auth/LoginForm.tsx` | Replace localStorage logic with `supabase.auth.signInWithPassword()` |
| `components/auth/RegisterForm.tsx` | Replace localStorage save with `supabase.auth.signUp()` |
| `components/auth/AuthGuard.tsx` | Become thin wrapper; primary protection moves to middleware |
| `components/admin/AdminGuard.tsx` | Check role from Supabase session, keep as UI fallback |
| `lib/auth/seed-admin.ts` | Replace with Prisma seed + Supabase admin user creation |

#### Phase 5: Role-Based Access Control

```
Supabase Auth (auth.users)          App Database (public.users)
┌─────────────────────────┐         ┌─────────────────────────┐
│ id (UUID)               │────────▶│ id (UUID, FK)           │
│ email                   │         │ role (USER/ADMIN/SUPER)  │
│ encrypted_password      │         │ status (Active/Suspended)│
│ email_confirmed_at      │         │ profile data...          │
│ created_at              │         └─────────────────────────┘
└─────────────────────────┘

Strategy: 
- Supabase Auth manages identity (email/password/OAuth)
- public.users stores role + profile (linked by id)
- RLS policies use auth.uid() to filter data
- Middleware checks role for admin routes
```

#### Phase 6: Session Management

```
Current:  localStorage.getItem("fitnessapp_session")
Target:   Supabase manages JWT in HTTP-only cookies

Flow:
1. User logs in → Supabase returns access_token + refresh_token
2. @supabase/ssr sets cookies automatically
3. middleware.ts reads cookie, verifies JWT, refreshes if needed
4. API routes access user via supabase.auth.getUser()
5. Logout → supabase.auth.signOut() clears cookies
```

### 5.3 Social Login Integration

| Provider | Setup | Redirect URL |
|----------|-------|-------------|
| Google | Enable in Supabase, add OAuth client ID/secret | `/auth/callback` |
| Apple | Enable in Supabase, add Service ID + key | `/auth/callback` |
| GitHub | Enable in Supabase, add OAuth app credentials | `/auth/callback` |

### 5.4 Auth Callback Route

```
Create: app/auth/callback/route.ts
Purpose: Handle OAuth redirects, exchange code for session
```

---

## 6. localStorage Migration Strategy

### 6.1 Migration Approach

Use a **parallel operation pattern**: implement the new backend while keeping localStorage as a read fallback during the transition period. This ensures zero data loss for beta users.

```
┌─────────────────────────────────────────────────────────────────┐
│                     MIGRATION PHASES                              │
├──────────────────┬──────────────────┬───────────────────────────┤
│ Phase A          │ Phase B          │ Phase C                   │
│ (Dual Write)     │ (Backend Primary)│ (Backend Only)            │
├──────────────────┼──────────────────┼───────────────────────────┤
│ Write: API + LS  │ Write: API only  │ Write: API only           │
│ Read: API (LS    │ Read: API only   │ Read: API only            │
│   fallback)      │ LS: deprecated   │ LS: removed              │
│ Duration: 2 wks  │ Duration: 2 wks  │ Final state              │
└──────────────────┴──────────────────┴───────────────────────────┘
```

### 6.2 Store-by-Store Migration Plan

#### Priority 1 — Critical Path (Week 1-2)

| Store File | New Location | Strategy |
|-----------|-------------|----------|
| `lib/auth/seed-admin.ts` | Prisma seed script | Delete file; admin created via `prisma db seed` |
| Auth (session/user/admin) | Supabase Auth | Full replacement; no fallback needed |

#### Priority 2 — Core Data (Week 3-5)

| Store File | New Service | API Routes |
|-----------|-------------|-----------|
| `lib/exercises-store.ts` | `lib/services/exercises.ts` | `GET/POST/PUT/DELETE /api/exercises` |
| `lib/ingredients-store.ts` | `lib/services/ingredients.ts` | `GET/POST/PUT/DELETE /api/ingredients` |
| `lib/recipes-store.ts` | `lib/services/recipes.ts` | `GET/POST/PUT/DELETE /api/recipes` |
| `lib/workouts-store.ts` | `lib/services/workouts.ts` | `GET/POST/PUT/DELETE /api/workouts` |
| `lib/training-store.ts` | `lib/services/training.ts` | `GET/POST/PUT/PATCH /api/training` |

#### Priority 3 — User Data (Week 5-7)

| Store File | New Service | API Routes |
|-----------|-------------|-----------|
| `lib/progress-photos-store.ts` | `lib/services/photos.ts` | `GET/POST/DELETE /api/photos` + Supabase Storage |
| `lib/notifications.ts` | `lib/services/notifications.ts` | `GET/POST/PATCH /api/notifications` |
| `lib/subscription.ts` | `lib/services/subscriptions.ts` | `GET/POST/PATCH /api/subscriptions` |
| `lib/ai-coach.ts` | `lib/services/ai-coach.ts` | `GET/POST /api/ai/chat`, `/api/ai/checkin` |
| `lib/recommendation-engine.ts` | `lib/services/recommendations.ts` | `GET/POST/PATCH /api/recommendations` |

#### Priority 4 — Admin & Support (Week 7-8)

| Store File | New Service | API Routes |
|-----------|-------------|-----------|
| `lib/admin-platform.ts` | `lib/services/admin.ts` | `GET/PUT/DELETE /api/admin/*` |
| `lib/data-export.ts` | `lib/services/exports.ts` | `POST /api/exports`, `GET /api/backups` |
| `lib/monitoring.ts` | External (Sentry) | Remove; replace with Sentry SDK |

### 6.3 Client-Side Data Fetching Pattern

Replace direct localStorage calls with React hooks:

```typescript
// BEFORE (current):
import { loadWorkouts } from "@/lib/workouts-store";
const workouts = loadWorkouts(); // synchronous, localStorage

// AFTER (target):
import { useWorkouts } from "@/hooks/useWorkouts";
const { data: workouts, isLoading, error } = useWorkouts(); // async, API
```

**Recommended fetching library:** `swr` or `@tanstack/react-query`

### 6.4 Beta User Data Migration Tool

For existing beta users with data in localStorage:

```typescript
// One-time migration script (client-side)
// Shown to users on first login after backend deployment

async function migrateUserData(userId: string) {
  const keys = Object.keys(localStorage).filter(k => k.startsWith("fitnessapp_"));
  
  for (const key of keys) {
    const data = JSON.parse(localStorage.getItem(key) || "null");
    if (!data) continue;
    
    await fetch("/api/migrate/import", {
      method: "POST",
      body: JSON.stringify({ key, data, userId }),
    });
  }
  
  // Mark migration complete
  localStorage.setItem("fitnessapp_migrated", "true");
}
```

---

## 7. API Architecture

### 7.1 Route Structure

```
app/api/
├── auth/
│   └── callback/
│       └── route.ts              # OAuth callback handler
├── users/
│   ├── route.ts                  # GET (profile), PATCH (update profile)
│   └── [id]/
│       └── route.ts              # Admin: GET/PUT/DELETE user
├── exercises/
│   ├── route.ts                  # GET (list), POST (create)
│   └── [id]/
│       └── route.ts              # GET, PUT, DELETE
├── ingredients/
│   ├── route.ts                  # GET (list), POST (create)
│   └── [id]/
│       └── route.ts              # GET, PUT, DELETE
├── recipes/
│   ├── route.ts                  # GET (list), POST (create)
│   └── [id]/
│       └── route.ts              # GET, PUT, DELETE
├── workouts/
│   ├── route.ts                  # GET (list), POST (create)
│   ├── [id]/
│   │   └── route.ts             # GET, PUT, DELETE
│   └── templates/
│       └── route.ts              # GET templates
├── training/
│   ├── sessions/
│   │   ├── route.ts             # GET (history), POST (start)
│   │   ├── [id]/
│   │   │   └── route.ts        # GET, PATCH (update), DELETE
│   │   └── active/
│   │       └── route.ts         # GET/PUT active session
│   ├── stats/
│   │   └── route.ts             # GET training stats
│   └── records/
│       └── route.ts              # GET personal records
├── nutrition/
│   ├── meals/
│   │   ├── route.ts             # GET (list by date), POST (log)
│   │   └── [id]/
│   │       └── route.ts        # PUT, DELETE
│   ├── goals/
│   │   └── route.ts             # GET, PUT
│   └── meal-plans/
│       ├── route.ts             # GET (list), POST (create)
│       └── [id]/
│           └── route.ts         # GET, PUT, DELETE
├── progress/
│   ├── measurements/
│   │   ├── route.ts             # GET (history), POST (add)
│   │   └── [id]/
│   │       └── route.ts        # PUT, DELETE
│   ├── photos/
│   │   ├── route.ts             # GET (list), POST (upload)
│   │   └── [id]/
│   │       └── route.ts        # GET, DELETE
│   ├── weight/
│   │   └── route.ts             # GET (history), POST (add)
│   └── checkins/
│       └── route.ts              # GET, POST (daily check-in)
├── notifications/
│   ├── route.ts                  # GET (list), POST (create)
│   ├── [id]/
│   │   └── route.ts             # PATCH (read/archive), DELETE
│   ├── preferences/
│   │   └── route.ts             # GET, PUT
│   └── mark-all-read/
│       └── route.ts              # POST
├── recommendations/
│   ├── route.ts                  # GET (list), POST (generate)
│   └── [id]/
│       └── route.ts              # PATCH (status update)
├── subscriptions/
│   ├── route.ts                  # GET (current), POST (upgrade)
│   ├── cancel/
│   │   └── route.ts             # POST
│   └── trial/
│       └── route.ts              # POST (start trial)
├── ai/
│   ├── chat/
│   │   └── route.ts             # POST (send message, get response)
│   ├── recommendations/
│   │   └── route.ts             # POST (generate AI recommendations)
│   └── settings/
│       └── route.ts              # GET, PUT (AI provider config)
├── shopping-list/
│   └── route.ts                  # GET, POST (generate from meal plan)
├── admin/
│   ├── users/
│   │   ├── route.ts             # GET (all users)
│   │   └── [id]/
│   │       └── route.ts        # PATCH (role, status), DELETE
│   ├── stats/
│   │   └── route.ts             # GET platform stats
│   ├── settings/
│   │   └── route.ts             # GET, PUT platform settings
│   ├── audit-log/
│   │   └── route.ts             # GET audit entries
│   └── rules/
│       ├── route.ts             # GET, POST recommendation rules
│       └── [id]/
│           └── route.ts         # PUT, DELETE
├── exports/
│   ├── route.ts                  # POST (generate export)
│   └── backups/
│       ├── route.ts             # GET (list), POST (create)
│       └── [id]/
│           └── route.ts         # GET (download), DELETE
├── migrate/
│   └── import/
│       └── route.ts              # POST (one-time localStorage migration)
└── webhooks/
    └── stripe/
        └── route.ts              # POST (Stripe webhook handler — future)
```

### 7.2 API Design Patterns

#### Authentication

```typescript
// Every API route starts with auth verification
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // ... handler logic
}
```

#### Role-Based Admin Protection

```typescript
import { requireRole } from "@/lib/auth/roles";

export async function GET(request: Request) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  if (!user) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  // ... admin logic
}
```

#### Standard Response Format

```typescript
// Success
{ "data": {...}, "meta": { "total": 100, "page": 1, "limit": 20 } }

// Error
{ "error": { "code": "NOT_FOUND", "message": "Resource not found" } }
```

#### Pagination

```typescript
// GET /api/exercises?page=1&limit=20&category=Strength&search=squat
interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
```

### 7.3 Middleware Stack

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // 1. Rate limiting (check Upstash Redis)
  // 2. Auth token refresh (Supabase)
  // 3. Route protection rules
  // 4. CORS headers
  // 5. Security headers (CSP, X-Frame-Options, etc.)
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/training/:path*",
    "/nutrition/:path*",
    "/progress/:path*",
  ],
};
```

### 7.4 Error Handling

```typescript
// lib/api/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      { error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }
  // Log to Sentry
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
    { status: 500 }
  );
}
```

---

## 8. Prisma Schema Generation Plan

### 8.1 Schema File Structure

```
prisma/
├── schema.prisma          # Main schema file
├── migrations/            # Auto-generated migration files
│   └── 001_initial/
│       └── migration.sql
└── seed.ts                # Seed script (exercises, ingredients, recipes, admin)
```

### 8.2 Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ── Users & Auth ─────────────────────────────────────────────────

enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  Active
  Suspended
  Deleted
}

model User {
  id            String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String     @unique @db.VarChar(255)
  name          String     @db.VarChar(255)
  gender        String?    @db.VarChar(20)
  dateOfBirth   DateTime?  @map("date_of_birth") @db.Date
  heightCm      Decimal?   @map("height_cm") @db.Decimal(5, 1)
  activityLevel String?    @map("activity_level") @db.VarChar(50)
  fitnessGoal   String?    @map("fitness_goal") @db.VarChar(50)
  role          UserRole   @default(USER)
  status        UserStatus @default(Active)
  createdAt     DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime   @updatedAt @map("updated_at") @db.Timestamptz
  lastLoginAt   DateTime?  @map("last_login_at") @db.Timestamptz

  // Relations
  subscriptions      Subscription[]
  weightEntries      WeightEntry[]
  measurementEntries MeasurementEntry[]
  progressPhotos     ProgressPhoto[]
  workouts           Workout[]
  trainingSessions   TrainingSession[]
  mealLogs           MealLog[]
  mealPlans          MealPlan[]
  notifications      Notification[]
  recommendations    Recommendation[]
  aiUsage            AiUsage[]
  dailyCheckins      DailyCheckin[]
  feedback           Feedback[]
  chatMessages       AiChatMessage[]
  shoppingLists      ShoppingList[]
  notificationPrefs  NotificationPreference?

  @@index([email])
  @@index([role])
  @@index([status])
  @@map("users")
}

// ── Subscriptions ────────────────────────────────────────────────

enum PlanType {
  FREE
  PREMIUM_MONTHLY
  PREMIUM_YEARLY
}

enum SubscriptionStatus {
  Active
  Trial
  Expired
  Cancelled
  Pending
}

model Subscription {
  id             String             @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String             @map("user_id") @db.Uuid
  plan           PlanType           @default(FREE)
  status         SubscriptionStatus @default(Active)
  startDate      DateTime           @default(now()) @map("start_date") @db.Date
  renewalDate    DateTime?          @map("renewal_date") @db.Date
  expirationDate DateTime?          @map("expiration_date") @db.Date
  createdAt      DateTime           @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("subscriptions")
}

// ── Weight & Measurements ────────────────────────────────────────

model WeightEntry {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  date      DateTime @db.Date
  weightKg  Decimal  @map("weight_kg") @db.Decimal(5, 1)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("weight_entries")
}

model MeasurementEntry {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  date         DateTime @db.Date
  weightKg     Decimal? @map("weight_kg") @db.Decimal(5, 1)
  neckCm       Decimal? @map("neck_cm") @db.Decimal(5, 1)
  chestCm      Decimal? @map("chest_cm") @db.Decimal(5, 1)
  waistCm      Decimal? @map("waist_cm") @db.Decimal(5, 1)
  hipsCm       Decimal? @map("hips_cm") @db.Decimal(5, 1)
  leftArmCm    Decimal? @map("left_arm_cm") @db.Decimal(5, 1)
  rightArmCm   Decimal? @map("right_arm_cm") @db.Decimal(5, 1)
  leftThighCm  Decimal? @map("left_thigh_cm") @db.Decimal(5, 1)
  rightThighCm Decimal? @map("right_thigh_cm") @db.Decimal(5, 1)
  leftCalfCm   Decimal? @map("left_calf_cm") @db.Decimal(5, 1)
  rightCalfCm  Decimal? @map("right_calf_cm") @db.Decimal(5, 1)
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, date])
  @@map("measurement_entries")
}

// ── Progress Photos ──────────────────────────────────────────────

model ProgressPhoto {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String   @map("user_id") @db.Uuid
  photoType  String   @map("photo_type") @db.VarChar(10) // Front, Side, Back
  imageUrl   String   @map("image_url") @db.Text
  weightKg   Decimal? @map("weight_kg") @db.Decimal(5, 1)
  notes      String?  @db.Text
  uploadDate DateTime @default(now()) @map("upload_date") @db.Date
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("progress_photos")
}

// ── Ingredients ──────────────────────────────────────────────────

model Ingredient {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String   @db.VarChar(255)
  category        String   @db.VarChar(50)
  caloriesPer100g Decimal  @map("calories_per_100g") @db.Decimal(7, 1)
  proteinPer100g  Decimal  @map("protein_per_100g") @db.Decimal(6, 1)
  carbsPer100g    Decimal  @map("carbs_per_100g") @db.Decimal(6, 1)
  fatPer100g      Decimal  @map("fat_per_100g") @db.Decimal(6, 1)
  unit            String   @default("g") @db.VarChar(20)
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz

  recipeIngredients RecipeIngredient[]

  @@map("ingredients")
}

// ── Recipes ──────────────────────────────────────────────────────

model Recipe {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String   @db.VarChar(255)
  description String?  @db.Text
  goal        String?  @db.VarChar(30)
  servings    Int      @default(1)
  prepTime    Int?     @map("prep_time")
  imageUrl    String?  @map("image_url") @db.Text
  calories    Int?
  protein     Int?
  carbs       Int?
  fat         Int?
  createdBy   String?  @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  ingredients  RecipeIngredient[]
  instructions RecipeInstruction[]

  @@map("recipes")
}

model RecipeIngredient {
  id           String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  recipeId     String  @map("recipe_id") @db.Uuid
  ingredientId String? @map("ingredient_id") @db.Uuid
  name         String  @db.VarChar(255)
  quantity     Decimal @db.Decimal(8, 2)
  unit         String  @db.VarChar(20)
  sortOrder    Int     @default(0) @map("sort_order")

  recipe     Recipe      @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  ingredient Ingredient? @relation(fields: [ingredientId], references: [id])

  @@map("recipe_ingredients")
}

model RecipeInstruction {
  id          String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  recipeId    String @map("recipe_id") @db.Uuid
  stepNumber  Int    @map("step_number")
  instruction String @db.Text

  recipe Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@map("recipe_instructions")
}

// ── Exercises ────────────────────────────────────────────────────

model Exercise {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name           String   @db.VarChar(255)
  description    String?  @db.Text
  category       String   @db.VarChar(30)
  muscleGroup    String   @map("muscle_group") @db.VarChar(30)
  equipment      String   @db.VarChar(30)
  difficulty     String   @db.VarChar(20)
  instructions   Json     @default("[]")
  tips           Json     @default("[]")
  commonMistakes Json     @default("[]") @map("common_mistakes")
  imageUrl       String?  @map("image_url") @db.Text
  videoUrl       String?  @map("video_url") @db.Text
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz

  workoutExercises WorkoutExercise[]

  @@index([category])
  @@index([muscleGroup])
  @@map("exercises")
}

// ── Workouts ─────────────────────────────────────────────────────

model Workout {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String?  @map("user_id") @db.Uuid
  name        String   @db.VarChar(255)
  description String?  @db.Text
  goal        String?  @db.VarChar(30)
  difficulty  String?  @db.VarChar(20)
  duration    Int?
  isTemplate  Boolean  @default(false) @map("is_template")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  user             User?             @relation(fields: [userId], references: [id], onDelete: Cascade)
  workoutDays      WorkoutDay[]
  trainingSessions TrainingSession[]

  @@map("workouts")
}

model WorkoutDay {
  id        String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workoutId String @map("workout_id") @db.Uuid
  dayName   String @map("day_name") @db.VarChar(15)
  sortOrder Int    @default(0) @map("sort_order")

  workout   Workout           @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  exercises WorkoutExercise[]

  @@map("workout_days")
}

model WorkoutExercise {
  id           String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  workoutDayId String  @map("workout_day_id") @db.Uuid
  exerciseId   String? @map("exercise_id") @db.Uuid
  exerciseName String  @map("exercise_name") @db.VarChar(255)
  sets         Int     @default(3)
  reps         Int     @default(10)
  restSeconds  Int     @default(60) @map("rest_seconds")
  notes        String? @db.Text
  sortOrder    Int     @default(0) @map("sort_order")

  workoutDay WorkoutDay @relation(fields: [workoutDayId], references: [id], onDelete: Cascade)
  exercise   Exercise?  @relation(fields: [exerciseId], references: [id])

  @@map("workout_exercises")
}

// ── Training Sessions ────────────────────────────────────────────

model TrainingSession {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String    @map("user_id") @db.Uuid
  workoutId       String?   @map("workout_id") @db.Uuid
  workoutName     String?   @map("workout_name") @db.VarChar(255)
  date            DateTime  @default(now()) @db.Date
  startTime       DateTime  @map("start_time") @db.Timestamptz
  endTime         DateTime? @map("end_time") @db.Timestamptz
  durationMinutes Int?      @map("duration_minutes")
  status          String    @default("In Progress") @db.VarChar(20)
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz

  user         User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  workout      Workout?             @relation(fields: [workoutId], references: [id])
  exerciseLogs SessionExerciseLog[]

  @@index([userId, date])
  @@map("training_sessions")
}

model SessionExerciseLog {
  id           String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionId    String @map("session_id") @db.Uuid
  exerciseId   String? @map("exercise_id") @db.Uuid
  exerciseName String @map("exercise_name") @db.VarChar(255)
  sortOrder    Int    @default(0) @map("sort_order")

  session TrainingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  sets    SessionSetLog[]

  @@map("session_exercise_logs")
}

model SessionSetLog {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  exerciseLogId   String   @map("exercise_log_id") @db.Uuid
  setNumber       Int      @map("set_number")
  targetReps      Int?     @map("target_reps")
  completedReps   Int?     @map("completed_reps")
  targetWeight    Decimal? @map("target_weight") @db.Decimal(6, 1)
  completedWeight Decimal? @map("completed_weight") @db.Decimal(6, 1)
  completed       Boolean  @default(false)
  notes           String?  @db.Text

  exerciseLog SessionExerciseLog @relation(fields: [exerciseLogId], references: [id], onDelete: Cascade)

  @@map("session_set_logs")
}

// ── Nutrition / Meal Logging ─────────────────────────────────────

model MealLog {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  mealType    String   @map("meal_type") @db.VarChar(20)
  name        String   @db.VarChar(255)
  description String?  @db.Text
  calories    Int      @default(0)
  protein     Int      @default(0)
  carbs       Int      @default(0)
  fat         Int      @default(0)
  date        DateTime @db.Date
  time        DateTime? @db.Time()
  photoUrl    String?  @map("photo_url") @db.Text
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, date])
  @@map("meal_logs")
}

// ── Meal Plans ───────────────────────────────────────────────────

model MealPlan {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  weekStartDate DateTime @map("week_start_date") @db.Date
  weekEndDate   DateTime @map("week_end_date") @db.Date
  planData      Json     @map("plan_data")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("meal_plans")
}

// ── Notifications ────────────────────────────────────────────────

model Notification {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  type      String    @db.VarChar(50)
  title     String    @db.VarChar(255)
  message   String    @db.Text
  priority  String    @default("Medium") @db.VarChar(20)
  status    String    @default("Unread") @db.VarChar(20)
  actionUrl String?   @map("action_url") @db.Text
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz
  readAt    DateTime? @map("read_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@map("notifications")
}

model NotificationPreference {
  id                          String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId                      String  @unique @map("user_id") @db.Uuid
  workoutReminders            Boolean @default(true) @map("workout_reminders")
  nutritionReminders          Boolean @default(true) @map("nutrition_reminders")
  progressReminders           Boolean @default(true) @map("progress_reminders")
  achievementNotifications    Boolean @default(true) @map("achievement_notifications")
  recommendationNotifications Boolean @default(true) @map("recommendation_notifications")
  subscriptionNotifications   Boolean @default(true) @map("subscription_notifications")
  reminderFrequency           String  @default("Daily") @map("reminder_frequency") @db.VarChar(20)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notification_preferences")
}

// ── Recommendations ──────────────────────────────────────────────

model Recommendation {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  category      String   @db.VarChar(50)
  priority      String   @db.VarChar(20)
  title         String   @db.VarChar(255)
  description   String   @db.Text
  status        String   @default("New") @db.VarChar(20)
  generatedDate DateTime @default(now()) @map("generated_date") @db.Date
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("recommendations")
}

model RecommendationRule {
  id            String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String  @db.VarChar(255)
  category      String  @db.VarChar(50)
  description   String  @db.Text
  enabled       Boolean @default(true)
  priority      String  @db.VarChar(20)
  evaluatorType String  @default("rule-based") @map("evaluator_type") @db.VarChar(30)

  @@map("recommendation_rules")
}

// ── AI Usage & Chat ──────────────────────────────────────────────

model AiUsage {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  provider      String   @db.VarChar(30)
  model         String   @db.VarChar(50)
  tokensUsed    Int      @default(0) @map("tokens_used")
  estimatedCost Decimal  @default(0) @map("estimated_cost") @db.Decimal(8, 6)
  promptType    String?  @map("prompt_type") @db.VarChar(30)
  date          DateTime @default(now()) @db.Date
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("ai_usage")
}

model AiChatMessage {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  role      String   @db.VarChar(20) // user, coach, system
  content   String   @db.Text
  timestamp DateTime @default(now()) @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, timestamp])
  @@map("ai_chat_messages")
}

// ── Daily Check-Ins ──────────────────────────────────────────────

model DailyCheckin {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  date            DateTime @db.Date
  energyLevel     Int      @map("energy_level")
  sleepQuality    Int      @map("sleep_quality")
  stressLevel     Int      @map("stress_level")
  motivationLevel Int      @map("motivation_level")
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date])
  @@map("daily_checkins")
}

// ── Shopping Lists ───────────────────────────────────────────────

model ShoppingList {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  items     Json     @default("[]")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("shopping_lists")
}

// ── Feedback & Beta ──────────────────────────────────────────────

model BetaRegistration {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String   @db.VarChar(255)
  email           String   @unique @db.VarChar(255)
  fitnessGoal     String?  @map("fitness_goal") @db.VarChar(50)
  experienceLevel String?  @map("experience_level") @db.VarChar(30)
  submittedAt     DateTime @default(now()) @map("submitted_at") @db.Timestamptz

  @@map("beta_registrations")
}

model Feedback {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String?  @map("user_id") @db.Uuid
  type        String   @db.VarChar(30)
  title       String   @db.VarChar(255)
  description String?  @db.Text
  priority    String?  @default("Medium") @db.VarChar(20)
  status      String?  @default("Open") @db.VarChar(20)
  submittedAt DateTime @default(now()) @map("submitted_at") @db.Timestamptz

  user User? @relation(fields: [userId], references: [id])

  @@map("feedback")
}

// ── Audit Log ────────────────────────────────────────────────────

model AuditLog {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String?  @map("user_id") @db.Uuid
  action    String   @db.VarChar(255)
  entity    String?  @db.VarChar(255)
  details   String?  @db.Text
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([createdAt(sort: Desc)])
  @@map("audit_log")
}

// ── Platform Settings ────────────────────────────────────────────

model PlatformSetting {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  key       String   @unique @db.VarChar(100)
  value     Json
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  @@map("platform_settings")
}
```

### 8.3 Seed Script Plan

```typescript
// prisma/seed.ts
// Source data from: data/exercises.ts (50 exercises)
//                   data/ingredients-seed.ts (50 ingredients)  
//                   data/recipes.ts (12 recipes)
//                   data/workouts.ts (8 workout templates)
//                   lib/recommendation-engine.ts (14 default rules)

// Order of seeding (respects FK constraints):
// 1. Super Admin user (linked to Supabase Auth user)
// 2. Exercises (no FK dependencies)
// 3. Ingredients (no FK dependencies)
// 4. Recipes + RecipeIngredients + RecipeInstructions
// 5. Workout templates + WorkoutDays + WorkoutExercises
// 6. Recommendation rules
// 7. Platform settings (default feature toggles)
```

### 8.4 Row Level Security (RLS) Policies

```sql
-- Users can only read/write their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

-- Training sessions: user can only access own
CREATE POLICY "Own training sessions" ON training_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Exercises/Ingredients/Recipes: readable by all authenticated users
CREATE POLICY "Authenticated read" ON exercises
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Exercises: writable by admins only
CREATE POLICY "Admin write exercises" ON exercises
  FOR INSERT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

-- Apply similar patterns to all user-scoped tables:
-- weight_entries, measurement_entries, progress_photos, meal_logs,
-- meal_plans, notifications, recommendations, daily_checkins,
-- ai_chat_messages, shopping_lists, subscriptions
```

---

## 9. Estimated Effort

### 9.1 Summary by Category

| Category | Tasks | Effort (1 Dev) | Effort (2 Devs) |
|----------|-------|----------------|-----------------|
| **Supabase Project Setup** | Configure project, auth, storage | 2 days | 1 day |
| **Prisma Schema + Migrations** | Schema, migrate, seed | 4 days | 3 days |
| **Authentication Migration** | Supabase Auth, middleware, components | 5 days | 3 days |
| **API Route Layer** | ~45 route handlers | 15 days | 8 days |
| **Service Layer** | Prisma-based services replacing stores | 10 days | 6 days |
| **Client-Side Refactor** | Replace localStorage calls with hooks | 10 days | 6 days |
| **File Storage Migration** | Progress photos → Supabase Storage | 3 days | 2 days |
| **Admin API & RLS** | Admin endpoints, security policies | 4 days | 3 days |
| **Testing & QA** | Integration tests, manual testing | 5 days | 4 days |
| **Beta Data Migration Tool** | One-time localStorage → DB importer | 2 days | 1 day |
| **Documentation & Deployment** | Env vars, CI/CD, monitoring | 3 days | 2 days |
| **TOTAL** | — | **~63 days (12-13 weeks)** | **~39 days (8 weeks)** |

### 9.2 Detailed Breakdown by Phase

#### Phase 1: Foundation (Week 1-2)

| Task | Days | Priority |
|------|------|----------|
| Create Supabase project + configure auth | 1 | P0 |
| Write Prisma schema from SQL blueprint | 2 | P0 |
| Run initial migration + verify tables | 1 | P0 |
| Create seed script (exercises, ingredients, recipes, templates) | 2 | P0 |
| Setup environment variables (.env.local) | 0.5 | P0 |
| Install dependencies (@supabase/ssr, prisma, @prisma/client) | 0.5 | P0 |
| Create Supabase client utilities (server/browser) | 1 | P0 |
| Create middleware.ts with auth verification | 1.5 | P0 |
| **Subtotal** | **9.5 days** | |

#### Phase 2: Auth Migration (Week 3)

| Task | Days | Priority |
|------|------|----------|
| Replace LoginForm with Supabase signIn | 1 | P0 |
| Replace RegisterForm with Supabase signUp | 1 | P0 |
| Implement OAuth callback route | 0.5 | P1 |
| Replace AuthGuard with session check | 0.5 | P0 |
| Replace AdminGuard with role check | 0.5 | P0 |
| Remove seed-admin.ts, add admin to Prisma seed | 0.5 | P0 |
| Add password reset flow | 1 | P1 |
| Add email verification | 0.5 | P1 |
| **Subtotal** | **5 days** | |

#### Phase 3: Core API Routes (Week 4-6)

| Task | Days | Priority |
|------|------|----------|
| `/api/exercises` (CRUD) | 1.5 | P0 |
| `/api/ingredients` (CRUD) | 1 | P0 |
| `/api/recipes` (CRUD + nested) | 2 | P0 |
| `/api/workouts` (CRUD + days + exercises) | 2.5 | P0 |
| `/api/training/sessions` (CRUD + active + stats) | 2.5 | P0 |
| `/api/training/records` (computed PRs) | 1 | P1 |
| `/api/nutrition/meals` (CRUD) | 1.5 | P0 |
| `/api/nutrition/meal-plans` (CRUD) | 1.5 | P1 |
| `/api/progress/measurements` (CRUD) | 1 | P0 |
| `/api/progress/photos` (+ Supabase Storage) | 2 | P0 |
| `/api/progress/weight` (CRUD) | 0.5 | P0 |
| `/api/progress/checkins` (CRUD) | 0.5 | P1 |
| **Subtotal** | **17.5 days** | |

#### Phase 4: Secondary API Routes (Week 7-8)

| Task | Days | Priority |
|------|------|----------|
| `/api/notifications` (CRUD + preferences) | 1.5 | P1 |
| `/api/recommendations` (CRUD + generate) | 2 | P1 |
| `/api/subscriptions` (CRUD + upgrade/cancel) | 1.5 | P1 |
| `/api/ai/chat` (proxy + persistence) | 2 | P1 |
| `/api/shopping-list` (generate) | 1 | P2 |
| `/api/admin/*` (users, stats, settings, rules, audit) | 3 | P1 |
| `/api/exports` (backup/restore) | 1.5 | P2 |
| `/api/users` (profile CRUD) | 1 | P0 |
| `/api/migrate/import` (one-time migration) | 1.5 | P1 |
| **Subtotal** | **15.5 days** | |

#### Phase 5: Client Refactor (Week 9-10)

| Task | Days | Priority |
|------|------|----------|
| Install SWR or React Query | 0.5 | P0 |
| Create custom hooks for all data fetching | 3 | P0 |
| Replace localStorage calls in page components | 5 | P0 |
| Update admin pages to use API | 2 | P1 |
| Remove old store files (or mark deprecated) | 0.5 | P2 |
| **Subtotal** | **11 days** | |

#### Phase 6: Polish & Deploy (Week 11-12)

| Task | Days | Priority |
|------|------|----------|
| End-to-end testing (auth flow, CRUD, admin) | 3 | P0 |
| Fix edge cases (error handling, loading states) | 2 | P0 |
| Deploy to Vercel with environment variables | 1 | P0 |
| Supabase Storage bucket configuration | 0.5 | P0 |
| RLS policy verification | 1 | P0 |
| Beta user data migration testing | 1 | P1 |
| Documentation update (README, env example) | 0.5 | P2 |
| **Subtotal** | **9 days** | |

### 9.3 Dependencies Between Packages

```
npm install @supabase/supabase-js @supabase/ssr prisma @prisma/client
npm install -D supabase  # CLI for local development
```

Optional but recommended:
```
npm install swr          # or @tanstack/react-query
npm install zod          # Input validation
npm install @upstash/ratelimit @upstash/redis  # Rate limiting
```

---

## 10. Risk Assessment & Mitigation

### 10.1 High-Risk Items

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Beta user data loss during migration | Critical | Medium | Build localStorage → DB import tool; test thoroughly; keep localStorage as read fallback for 2 weeks |
| Supabase Auth session incompatibility | High | Low | Use `@supabase/ssr` which handles Next.js 16 cookie management |
| Performance regression (network latency vs localStorage) | Medium | Medium | Implement optimistic updates, SWR caching, loading skeletons |
| Prisma schema mismatch with existing SQL | Medium | Low | Generated from same source; validate with `prisma db pull` comparison |
| RLS policies blocking legitimate access | High | Medium | Test every role/route combination; use Supabase Studio to debug |
| Large photo uploads overwhelming Storage | Medium | Low | Implement client-side compression before upload; set 5MB limit |

### 10.2 Breaking Changes

| Change | Affected Components | Mitigation |
|--------|-------------------|------------|
| Auth flow changes | All protected pages | Middleware handles redirect; AuthGuard remains as loading indicator |
| Async data loading (was sync) | Every page using stores | Add loading states, SWR/React Query with staleWhileRevalidate |
| UUID format change | URL params with exercise/recipe IDs | Keep string IDs; old numeric IDs mapped in seed |
| Workout normalization (nested → relational) | Workout detail pages | API returns joined data in same shape |

---

## 11. Implementation Phases

### Phase Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ WEEK 1-2    Foundation & Database                                │
│ ─────────────────────────────────────────────────────────────── │
│ • Supabase project setup                                        │
│ • Prisma schema + first migration                               │
│ • Seed data (50 exercises, 50 ingredients, 12 recipes, etc.)    │
│ • Supabase client utilities                                     │
│ • middleware.ts (auth + admin protection)                        │
├─────────────────────────────────────────────────────────────────┤
│ WEEK 3      Authentication                                       │
│ ─────────────────────────────────────────────────────────────── │
│ • Supabase Auth: signUp, signIn, signOut                        │
│ • OAuth (Google) callback                                       │
│ • Email verification + password reset                           │
│ • Replace AuthGuard + AdminGuard logic                          │
│ • Remove seed-admin.ts                                          │
├─────────────────────────────────────────────────────────────────┤
│ WEEK 4-6    Core API Layer                                       │
│ ─────────────────────────────────────────────────────────────── │
│ • Exercise CRUD, Ingredient CRUD, Recipe CRUD                   │
│ • Workout CRUD (multi-level join)                               │
│ • Training session CRUD + active session                        │
│ • Nutrition meal logging + meal plans                           │
│ • Progress: measurements, photos (Supabase Storage), weight     │
├─────────────────────────────────────────────────────────────────┤
│ WEEK 7-8    Secondary APIs & Admin                               │
│ ─────────────────────────────────────────────────────────────── │
│ • Notifications + preferences                                   │
│ • Recommendations + engine rules                                │
│ • Subscriptions (future Stripe prep)                            │
│ • AI chat proxy + persistence                                   │
│ • Admin endpoints (users, stats, settings, audit)               │
│ • Data export/backup endpoints                                  │
├─────────────────────────────────────────────────────────────────┤
│ WEEK 9-10   Client-Side Refactor                                 │
│ ─────────────────────────────────────────────────────────────── │
│ • Install SWR/React Query                                       │
│ • Create hooks for all data domains                             │
│ • Replace localStorage reads in all page components             │
│ • Add loading states and error boundaries                       │
│ • Update admin panel pages                                      │
├─────────────────────────────────────────────────────────────────┤
│ WEEK 11-12  Testing, Migration & Deployment                      │
│ ─────────────────────────────────────────────────────────────── │
│ • Integration testing (auth flows, CRUD, admin)                 │
│ • Beta user data migration tool                                 │
│ • RLS policy audit                                              │
│ • Performance testing                                           │
│ • Vercel deployment with env configuration                      │
│ • Documentation update                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Success Criteria

| Metric | Target |
|--------|--------|
| All 120+ pages functional | ✅ No regressions |
| Auth works across devices | ✅ JWT session persisted |
| Data survives browser clear | ✅ Stored in PostgreSQL |
| Admin operations server-verified | ✅ RLS + middleware |
| Photo upload < 3 seconds | ✅ Compressed + CDN |
| Page load < 2 seconds | ✅ SWR caching |
| Zero data loss for beta users | ✅ Migration tool tested |
| All API routes authenticated | ✅ Middleware enforced |

### Environment Variables Required

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (Prisma)
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

# AI (future)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Monitoring (future)
SENTRY_DSN=https://...@sentry.io/...

# Rate Limiting (future)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Appendix A: Files to Create

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema |
| `prisma/seed.ts` | Seed script |
| `lib/supabase/server.ts` | Server-side Supabase client |
| `lib/supabase/client.ts` | Browser-side Supabase client |
| `lib/supabase/middleware.ts` | Middleware helper |
| `lib/auth/roles.ts` | Role checking utilities |
| `lib/api/errors.ts` | Standardized API error handling |
| `lib/api/validate.ts` | Zod validation helpers |
| `middleware.ts` | Root middleware (auth + routing) |
| `app/auth/callback/route.ts` | OAuth callback handler |
| `app/api/**/*.ts` | ~45 API route handlers |
| `hooks/use*.ts` | ~15 data fetching hooks |
| `.env.local.example` | Environment variable template |

## Appendix B: Files to Delete/Replace

| File | Action | Reason |
|------|--------|--------|
| `lib/auth/seed-admin.ts` | Delete | Replaced by Prisma seed |
| `lib/workouts-store.ts` | Replace | → `lib/services/workouts.ts` + API |
| `lib/recipes-store.ts` | Replace | → `lib/services/recipes.ts` + API |
| `lib/ingredients-store.ts` | Replace | → `lib/services/ingredients.ts` + API |
| `lib/training-store.ts` | Replace | → `lib/services/training.ts` + API |
| `lib/exercises-store.ts` | Replace | → `lib/services/exercises.ts` + API |
| `lib/progress-photos-store.ts` | Replace | → `lib/services/photos.ts` + Storage |
| `lib/admin-platform.ts` | Replace | → `lib/services/admin.ts` + API |
| `lib/subscription.ts` | Refactor | Keep types/constants, move logic to API |
| `lib/notifications.ts` | Replace | → `lib/services/notifications.ts` + API |
| `lib/ai-coach.ts` | Refactor | Keep rules, move storage to API |
| `lib/recommendation-engine.ts` | Refactor | Keep engine, move storage to API |
| `lib/data-export.ts` | Refactor | Server-side export generation |
| `lib/monitoring.ts` | Delete | Replaced by Sentry SDK |

## Appendix C: Migration Checklist

```
[ ] Supabase project created
[ ] PostgreSQL database provisioned
[ ] Prisma schema written and validated
[ ] Initial migration run successfully
[ ] Seed script creates all reference data
[ ] Supabase Auth configured (email + Google)
[ ] middleware.ts protecting all routes
[ ] LoginForm uses Supabase Auth
[ ] RegisterForm uses Supabase Auth
[ ] All 45 API routes implemented
[ ] All pages use hooks instead of localStorage
[ ] Progress photos upload to Supabase Storage
[ ] RLS policies applied to all tables
[ ] Admin endpoints role-protected
[ ] Beta migration tool tested
[ ] Integration tests passing
[ ] Environment variables configured on Vercel
[ ] Production deployment successful
[ ] Zero data loss verified
```

---

*This document should be reviewed and updated as implementation progresses. Each phase completion should trigger an update to the checklist in Appendix C.*
