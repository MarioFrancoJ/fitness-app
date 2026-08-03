# Requirements Document

## Introduction

FitCoach is a production-ready, multi-tenant SaaS fitness platform that connects coaches with their clients.
It provides tools for nutrition tracking, workout programming, progress monitoring, AI-assisted coaching,
and scheduling — all accessible via a responsive web app and installable Progressive Web App (PWA).

The platform is built on **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS v4**,
**PostgreSQL** with **Prisma ORM**, **Auth.js (NextAuth v5)**, **OpenAI API**, and **Stripe** (future).
It targets deployment on **Vercel** and is designed following Clean Architecture principles — with a
clear separation between domain logic, application services, infrastructure adapters, and the Next.js
presentation layer.

The system supports three primary user roles — **Admin**, **Coach**, and **Client** — and must scale
comfortably to thousands of concurrent users.

---

## Glossary

- **Platform**: The FitCoach SaaS application in its entirety.
- **Admin**: A super-user who manages the platform, users, and global configuration.
- **Coach**: A fitness professional who creates programs and manages one or more Clients.
- **Client**: An end-user who follows programs created by a Coach or independently.
- **Tenant**: A Coach account together with all the Clients that Coach manages.
- **Program**: A structured multi-week workout or nutrition plan assigned to a Client.
- **Exercise**: A single catalogued movement with name, category, muscle groups, and instructions.
- **Workout**: A dated session composed of one or more Exercise sets.
- **Meal_Plan**: A dated nutritional schedule composed of Recipes and Foods for a Client.
- **Recipe**: A named combination of Ingredients with calculated macronutrient totals.
- **Ingredient**: A raw food item with a per-unit macronutrient and calorie profile.
- **Measurement**: A body-composition data point (e.g., weight, body fat %) recorded by a Client.
- **Progress_Photo**: An image uploaded by a Client to document physical change over time.
- **AI_Assistant**: The OpenAI-backed conversational agent embedded in the platform.
- **Notification**: An in-app or push alert delivered to a user for a time-sensitive event.
- **Shopping_List**: A list of Ingredients auto-generated from a Meal_Plan for a given date range.
- **Server_Action**: A Next.js 16 App Router server-side mutation invoked via React's action mechanism.
- **Route_Handler**: A Next.js 16 `route.ts` file that exposes an HTTP endpoint under `app/api/`.
- **RSC**: React Server Component — a component rendered exclusively on the server.
- **Session**: A JWT stored in an HttpOnly cookie managed by Auth.js, containing userId and role.
- **RBAC**: Role-Based Access Control — permission gates enforced per user role.
- **PWA**: Progressive Web Application — the platform installed to a device home screen.
- **DAL**: Data Access Layer — the Prisma-based repository layer that owns all DB queries.
- **Service_Layer**: The application use-case layer that orchestrates DAL calls and business rules.
- **Stripe**: The payment-processor integration (planned for a future release).
- **VAPID**: Voluntary Application Server Identity — key pair used for Web Push Notifications.

---

## Requirements

---

### Requirement 1: Project Structure and Folder Organisation

**User Story:** As a developer, I want a well-defined, Clean Architecture folder structure, so that every
file has a predictable home and the codebase remains maintainable as it grows.

#### Acceptance Criteria

1. THE Platform SHALL organise source code inside a `src/` directory at the project root, separating
   application code from Next.js configuration files (`next.config.ts`, `tailwind.config.ts`,
   `tsconfig.json`, `prisma/`).
2. THE Platform SHALL provide a `src/app/` directory that serves exclusively as the Next.js 16 App
   Router routing layer — containing only `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`,
   `not-found.tsx`, `route.ts`, and metadata-convention files (`manifest.ts`, `sitemap.ts`, `robots.ts`).
3. THE Platform SHALL provide a `src/modules/` directory where each feature module (`auth`, `nutrition`,
   `workouts`, `progress`, `calendar`, `notifications`, `ai-assistant`, `payments`, `admin`) is a
   self-contained folder containing its own `components/`, `actions/`, `services/`, `repositories/`,
   `types/`, and `validations/` sub-folders.
4. THE Platform SHALL provide a `src/lib/` directory for shared infrastructure code including
   `db.ts` (Prisma client singleton), `auth.ts` (Auth.js configuration), `openai.ts`
   (OpenAI client), `stripe.ts` (Stripe client), and `session.ts` (session helpers).
5. THE Platform SHALL provide a `src/components/` directory for global, reusable UI components
   organised into `ui/` (design-system primitives), `layout/` (shell components), and `shared/`
   (cross-module composites).
6. THE Platform SHALL provide a `src/hooks/` directory for global React custom hooks, and a
   `src/stores/` directory for Zustand global state slices.
7. THE Platform SHALL provide a `src/types/` directory for global TypeScript type declarations
   and a `src/utils/` directory for pure utility functions with no side effects.
8. THE Platform SHALL provide a `prisma/` directory at the project root containing `schema.prisma`
   and a `migrations/` subfolder managed by Prisma Migrate.
9. THE Platform SHALL provide a `public/` directory containing PWA assets: `manifest.json`,
   `sw.js` (service worker), `icons/` (at minimum 192 × 192 and 512 × 512 PNG icons), and
   static SVG/image assets.
10. THE Platform SHALL provide a `src/config/` directory containing typed constant files:
    `routes.ts` (all route path constants), `permissions.ts` (RBAC rules matrix), and
    `metadata.ts` (default SEO metadata).

---

### Requirement 2: Application Architecture

**User Story:** As a developer, I want a clearly defined layered architecture, so that business logic,
data access, and presentation remain decoupled and independently testable.

#### Acceptance Criteria

1. THE Platform SHALL enforce a four-layer architecture: **Presentation** (Next.js App Router pages,
   layouts, and Server Actions), **Application** (Service_Layer use-case functions in
   `src/modules/<module>/services/`), **Domain** (TypeScript types and validation schemas in
   `src/modules/<module>/types/` and `src/modules/<module>/validations/`), and **Infrastructure**
   (DAL repositories in `src/modules/<module>/repositories/` and external clients in `src/lib/`).
2. THE Service_Layer SHALL be the only layer permitted to call DAL repositories; Next.js pages and
   Server Actions SHALL NOT import repository functions directly.
3. THE Service_Layer functions SHALL be annotated with `import 'server-only'` to prevent accidental
   import into Client Components and to produce a build-time error if violated.
4. THE Platform SHALL use **Prisma ORM** as the sole data access mechanism; raw SQL SHALL only be
   used inside DAL repositories and only when Prisma's query builder cannot express the required query.
5. THE Platform SHALL use **Zod** for all input validation at the Server Action boundary and at all
   Route_Handler entry points; unvalidated input SHALL NOT be passed to the Service_Layer.
6. THE Platform SHALL use **React Server Components** (RSC) as the default rendering mode for all
   data-fetching pages; `'use client'` SHALL be added only to components that require interactivity,
   browser APIs, or React state.
7. THE Platform SHALL use **Next.js 16 Server Actions** (annotated with `'use server'`) for all
   data mutations triggered from the UI; Route_Handlers SHALL be used only for external-facing API
   endpoints (e.g., webhooks, OAuth callbacks, public REST consumers).
8. THE Platform SHALL use the `use cache` directive and `cacheLife` helper (Next.js 16 cache API)
   to cache expensive reads (e.g., exercise catalogue, food database) with appropriate lifetimes.
9. THE Platform SHALL use `revalidatePath` or `updateTag` inside Server Actions after every mutation
   so that the RSC tree reflects updated data within the same HTTP roundtrip.
10. THE Platform SHALL never expose raw Prisma model objects from Server Actions or Route_Handlers;
    the Service_Layer SHALL map database records to typed DTO objects before returning them to the
    Presentation layer.

---

### Requirement 3: User Roles and Permissions (RBAC)

**User Story:** As a platform operator, I want well-defined roles with explicit permissions, so that
Admins, Coaches, and Clients can only perform the actions appropriate to their role.

#### Acceptance Criteria

1. THE Platform SHALL support exactly three roles: **ADMIN**, **COACH**, and **CLIENT**, stored as a
   Prisma enum on the `User` model.
2. THE Platform SHALL enforce route-level access control in `middleware.ts` by reading the role
   from the decoded Session JWT; routes under `/admin` SHALL be accessible only to ADMIN,
   routes under `/coach` SHALL be accessible only to ADMIN and COACH, and routes under `/dashboard`
   SHALL be accessible to all authenticated roles.
3. THE Platform SHALL enforce action-level access control inside every Server Action and
   Route_Handler by calling a `requireRole(session, allowedRoles)` helper from `src/lib/auth.ts`;
   IF the caller's role is not in `allowedRoles`, THEN THE Server_Action SHALL throw an
   `UnauthorizedError` and return an error response without performing the mutation.
4. WHEN a Coach is authenticated, THE Platform SHALL scope all DAL queries so that the Coach
   can only read and write data belonging to the Coach's own Tenant (Clients assigned to that Coach).
5. WHEN a Client is authenticated, THE Platform SHALL scope all DAL queries so that the Client
   can only read and write the Client's own data.
6. THE Platform SHALL allow an ADMIN to impersonate any user for support purposes by swapping the
   `impersonatedUserId` field in the Session; WHILE impersonation is active, THE Platform SHALL
   display a persistent banner indicating the impersonation state.
7. IF a route requires authentication and the request carries no valid Session, THEN THE Platform
   SHALL redirect the request to `/login` with the original URL encoded as a `callbackUrl`
   query parameter.

---

### Requirement 4: Authentication Flow

**User Story:** As a user, I want secure sign-up, login, and session management, so that my account
and data are protected at all times.

#### Acceptance Criteria

1. THE Platform SHALL use **Auth.js v5 (NextAuth)** to manage all authentication; custom credential
   flows and OAuth provider flows SHALL both be configured in `src/lib/auth.ts`.
2. THE Platform SHALL support email/password credentials as the primary authentication method;
   WHEN a user submits login credentials via a Server Action, THE Platform SHALL validate them
   with Zod, hash comparison with `bcryptjs`, and call `Auth.js signIn()`.
3. THE Platform SHALL support Google OAuth as an optional social login provider; WHERE Google OAuth
   is configured, THE Platform SHALL allow users to authenticate via their Google account.
4. THE Platform SHALL store the Session as a stateless JWT in an **HttpOnly, Secure, SameSite=Lax**
   cookie with a 7-day expiry; THE Session payload SHALL contain only `userId`, `role`, `tenantId`,
   and `expiresAt`.
5. WHEN a returning user accesses the platform within the session window, THE Platform SHALL
   automatically refresh the session cookie expiry to extend the session by an additional 7 days.
6. THE Platform SHALL provide a password-reset flow: WHEN a user requests a reset, THE Platform
   SHALL generate a signed, time-limited token (valid 1 hour), store its hash in the database,
   and send a reset link to the user's registered email address.
7. IF a password-reset token has expired or is not found in the database, THEN THE Platform SHALL
   return a descriptive error and SHALL NOT update the user's password.
8. WHEN a new user registers, THE Platform SHALL validate that the email address is not already
   registered; IF the email is already registered, THEN THE Platform SHALL return a
   "Email already in use" error without creating a duplicate account.
9. WHEN registration succeeds, THE Platform SHALL hash the password with `bcryptjs` (cost factor ≥ 12)
   before persisting it; THE Platform SHALL NEVER store plaintext passwords.
10. THE Platform SHALL implement **CSRF protection** for all Server Actions; Next.js 16 enforces
    `Origin` vs `Host` header comparison automatically, and the Platform SHALL not disable this check.
11. THE Platform SHALL implement **rate limiting** on the login and registration Server Actions,
    rejecting more than 10 attempts per IP address per minute with a 429 response.

---

### Requirement 5: Route Structure

**User Story:** As a developer, I want a predictable URL and file-system route structure, so that
navigation is intuitive and the App Router layout hierarchy is clean.

#### Acceptance Criteria

1. THE Platform SHALL use **route groups** (parenthesis folders) in `src/app/` to partition the
   application into four layout zones without affecting URLs:
   `(marketing)` for public pages, `(auth)` for login/register flows,
   `(app)` for authenticated user pages, and `(admin)` for the admin dashboard.
2. THE Platform SHALL expose the following public marketing routes under `(marketing)`:
   `/` (landing page), `/pricing`, `/about`, `/contact`, and `/blog/[slug]`.
3. THE Platform SHALL expose the following authentication routes under `(auth)`:
   `/login`, `/register`, `/forgot-password`, `/reset-password/[token]`,
   and `/auth/callback` (OAuth callback handler).
4. THE Platform SHALL expose the following authenticated routes under `(app)`:
   `/dashboard`, `/nutrition/foods`, `/nutrition/recipes`, `/nutrition/meal-plans`,
   `/nutrition/meal-plans/[id]`, `/nutrition/shopping-lists`,
   `/workouts/programs`, `/workouts/programs/[id]`, `/workouts/exercises`,
   `/progress/measurements`, `/progress/photos`,
   `/calendar`, `/notifications`, `/ai-assistant`,
   `/profile`, `/settings`, and `/coach/clients`, `/coach/clients/[clientId]`.
5. THE Platform SHALL expose the following admin routes under `(admin)`:
   `/admin`, `/admin/users`, `/admin/users/[id]`, `/admin/coaches`,
   `/admin/content`, `/admin/analytics`, and `/admin/settings`.
6. THE Platform SHALL expose public REST endpoints as Route_Handlers under `src/app/api/`:
   `api/auth/[...nextauth]/route.ts` (Auth.js), `api/webhooks/stripe/route.ts`,
   `api/webhooks/openai/route.ts`, and `api/v1/` (future public API).
7. THE Platform SHALL use **dynamic segments** (`[id]`, `[clientId]`, `[slug]`) for resource-
   specific routes; the segment value SHALL always be a CUID2 string except for blog slugs.
8. THE Platform SHALL provide `loading.tsx` skeleton screens for all routes under `(app)` and
   `(admin)` to support React Suspense streaming.
9. THE Platform SHALL provide `error.tsx` Client Component error boundaries for all route groups
   to gracefully handle Server Component render errors.
10. THE Platform SHALL provide a `not-found.tsx` page at the root app level and within `(app)`
    for 404 handling.

---

### Requirement 6: Database Entities and Relationships

**User Story:** As a developer, I want a complete, normalised database schema, so that all platform
data is stored consistently and relationships are enforced at the database level.

#### Acceptance Criteria

1. THE Platform SHALL define the following core Prisma models in `prisma/schema.prisma`:
   `User`, `Account` (OAuth), `Session` (DB sessions if enabled), `VerificationToken`,
   `Coach`, `Client`, `CoachClientRelationship`.
2. THE `User` model SHALL contain: `id` (CUID2), `email` (unique), `passwordHash` (nullable),
   `name`, `avatarUrl`, `role` (enum: ADMIN | COACH | CLIENT), `emailVerified` (DateTime),
   `createdAt`, `updatedAt`, and `deletedAt` (soft-delete).
3. THE Platform SHALL define the following nutrition models:
   `Food` (global ingredient catalogue), `Ingredient` (Food + quantity used in a Recipe),
   `Recipe` (Coach or Client authored), `RecipeIngredient`, `MealPlan`, `MealPlanEntry`,
   `ShoppingList`, `ShoppingListItem`.
4. THE Platform SHALL define the following workout models:
   `Exercise` (global catalogue), `MuscleGroup`, `ExerciseMuscleGroup`,
   `WorkoutProgram`, `WorkoutDay`, `WorkoutSet`, `WorkoutLog`, `WorkoutLogEntry`.
5. THE Platform SHALL define the following progress models:
   `Measurement` (weight, body fat %, waist, hips, chest, arms, legs), `ProgressPhoto`.
6. THE Platform SHALL define the following scheduling and notification models:
   `CalendarEvent`, `Notification`, `PushSubscription`.
7. THE Platform SHALL define the following AI and payment models:
   `AIChatSession`, `AIChatMessage`, `Subscription` (Stripe), `Invoice`.
8. WHEN a `User` is soft-deleted (`deletedAt` is set), THE DAL SHALL exclude that User from
   all standard queries by appending `WHERE deletedAt IS NULL` to every User lookup.
9. THE Platform SHALL enforce foreign-key cascade rules in Prisma: deleting a `Coach` SHALL
   cascade-delete `WorkoutProgram`, `MealPlan`, and `Recipe` records authored by that Coach;
   deleting a `Client` SHALL cascade-delete all `Measurement`, `ProgressPhoto`, `WorkoutLog`,
   and `MealPlanEntry` records belonging to that Client.
10. THE Platform SHALL use **Prisma Migrate** for all schema changes; direct DDL mutations
    to the production database SHALL be performed only via `prisma migrate deploy`.

---

### Requirement 7: Landing Page

**User Story:** As a visitor, I want to see a compelling marketing landing page, so that I understand
the platform's value and am motivated to register.

#### Acceptance Criteria

1. THE Platform SHALL render the landing page (`/`) as a React Server Component with full SSR
   and static generation where possible; the page SHALL achieve a Lighthouse performance score
   ≥ 90 on mobile.
2. THE Landing_Page SHALL include a hero section with a headline, sub-headline, primary CTA
   ("Start Free Trial"), and a product screenshot or illustration.
3. THE Landing_Page SHALL include a features section highlighting at least six platform modules
   with icons and brief descriptions.
4. THE Landing_Page SHALL include a social-proof section with at least three testimonials.
5. THE Landing_Page SHALL include a pricing section that references the subscription tiers
   (rendered from a static `PRICING_PLANS` config constant).
6. THE Landing_Page SHALL include a footer with navigation links, legal links (`/privacy`, `/terms`),
   and social media icons.
7. THE Landing_Page SHALL be fully responsive across viewport widths from 320 px to 1920 px.
8. THE Landing_Page SHALL include structured data (`application/ld+json`) for the Organisation
   schema to support SEO.

---

### Requirement 8: Dashboard

**User Story:** As an authenticated user, I want a personalised dashboard, so that I can see my
most important information at a glance when I log in.

#### Acceptance Criteria

1. WHEN a Client accesses `/dashboard`, THE Dashboard SHALL display: today's Meal_Plan summary,
   today's scheduled Workout, a body-weight trend sparkline for the last 30 days, recent
   Notifications, and a streak counter for consecutive logged days.
2. WHEN a Coach accesses `/dashboard`, THE Dashboard SHALL display: total active Client count,
   Client compliance rate (workouts logged / workouts scheduled, last 7 days), upcoming
   check-in calendar events, and a list of Clients sorted by last activity date.
3. WHEN an Admin accesses `/dashboard`, THE Dashboard SHALL redirect to `/admin`.
4. THE Dashboard SHALL render primary metrics as React Server Components fetching data from the
   Service_Layer; interactive widgets (charts, sparklines) SHALL be Client Components that
   receive serialised data as props.
5. THE Dashboard SHALL include a quick-action bar with links to the most common tasks for the
   user's role (e.g., "Log Workout", "Add Meal", "Message Coach").
6. WHEN the dashboard data fetch exceeds 3 seconds, THE Dashboard SHALL display skeleton
   loaders provided by the route's `loading.tsx` file.

---

### Requirement 9: Nutrition Module

**User Story:** As a user, I want to manage foods, recipes, meal plans, and shopping lists, so that
I can track and plan my dietary intake precisely.

#### Acceptance Criteria

1. THE Nutrition_Module SHALL provide a global `Food` catalogue searchable by name, barcode, and
   nutrient profile; each `Food` record SHALL store: name, brand (optional), calories (kcal),
   protein (g), carbohydrates (g), fat (g), fibre (g), serving size, and serving unit.
2. WHEN a user searches the Food catalogue, THE Platform SHALL return matching results within
   500 ms for a catalogue of up to 500,000 items (supported by a full-text index on the Food
   `name` field).
3. THE Nutrition_Module SHALL allow a Coach or Client to create, read, update, and delete
   `Recipe` records; each Recipe SHALL automatically calculate and store total macronutrients
   by summing the macronutrients of all its `RecipeIngredient` records weighted by quantity.
4. FOR ALL valid Recipe objects, serialising then deserialising the macronutrient totals SHALL
   produce numerically equivalent values (round-trip property).
5. THE Nutrition_Module SHALL allow a Coach to create a `MealPlan` and assign it to a Client;
   a MealPlan SHALL contain one or more `MealPlanEntry` records, each referencing a Recipe or
   Food with a scheduled date, meal type (BREAKFAST | LUNCH | DINNER | SNACK), and portion.
6. THE Nutrition_Module SHALL allow a Client to view, log actual intake against, and mark meals
   as completed within an assigned `MealPlan`.
7. THE Nutrition_Module SHALL provide a `ShoppingList` generator: WHEN a user requests a
   shopping list for a MealPlan date range, THE Platform SHALL aggregate all Ingredient
   quantities across the selected MealPlanEntries, de-duplicate by Food item, and render
   a printable/shareable `ShoppingList`.
8. IF a `MealPlanEntry` references a deleted `Recipe`, THEN THE Platform SHALL display a
   "Recipe no longer available" placeholder and SHALL NOT crash the MealPlan view.
9. THE Nutrition_Module SHALL display caloric and macronutrient totals per day on the MealPlan
   view, colour-coded against the Client's configured daily targets.
10. THE Platform SHALL parse and serialise Nutrition data to/from JSON for export; FOR ALL valid
    MealPlan objects, parsing the exported JSON then re-exporting SHALL produce an equivalent
    object (round-trip property).

---

### Requirement 10: Workout Module

**User Story:** As a user, I want to browse exercises and follow structured workout programs, so that
I can train efficiently according to my Coach's plan.

#### Acceptance Criteria

1. THE Workout_Module SHALL provide a global `Exercise` catalogue with: name, category
   (STRENGTH | CARDIO | FLEXIBILITY | BALANCE), primary and secondary muscle groups,
   description, video URL (optional), and thumbnail image URL (optional).
2. THE Workout_Module SHALL allow an Admin or Coach to create, read, update, and delete
   `Exercise` records in the global catalogue; Clients SHALL have read-only access to exercises.
3. THE Workout_Module SHALL allow a Coach to create a `WorkoutProgram` consisting of one or
   more `WorkoutDay` records; each WorkoutDay SHALL contain one or more `WorkoutSet` records
   referencing an Exercise, with sets, reps, weight, rest period, and notes.
4. THE Workout_Module SHALL allow a Coach to assign a `WorkoutProgram` to one or more Clients
   with a start date; WHEN a Program is assigned, THE Platform SHALL generate `CalendarEvent`
   records for each WorkoutDay in the program.
5. WHEN a Client logs a completed `Workout`, THE Platform SHALL create a `WorkoutLog` record
   linking to the corresponding WorkoutDay, and SHALL record the actual sets, reps, and weight
   performed in `WorkoutLogEntry` records.
6. THE Workout_Module SHALL calculate and display a volume metric (sum of sets × reps × weight)
   per muscle group per week on the Client's workout analytics view.
7. IF a Client attempts to log a Workout for a day that already has a `WorkoutLog`, THEN THE
   Platform SHALL ask the Client to confirm before overwriting the existing log.
8. THE Workout_Module SHALL support an optional Rest day entry in a WorkoutProgram with no
   Exercise sets, so that the full weekly structure is represented in the calendar.

---

### Requirement 11: Progress Tracking Module

**User Story:** As a Client, I want to record body measurements and upload progress photos, so that
I can visualise my transformation over time.

#### Acceptance Criteria

1. THE Progress_Module SHALL allow a Client to create `Measurement` records containing date,
   body weight (kg or lb), body fat percentage, and optional circumference measurements
   (waist, hips, chest, left arm, right arm, left thigh, right thigh) in centimetres or inches.
2. THE Platform SHALL allow each Client to set a preferred unit system (METRIC | IMPERIAL); WHEN
   a Client's unit preference changes, THE Platform SHALL display all stored measurements
   converted to the new unit system without modifying the stored values.
3. THE Progress_Module SHALL render a line chart of body weight over time on the measurements
   page; the chart SHALL support date-range filtering (30 days, 90 days, 6 months, 1 year, all).
4. THE Progress_Module SHALL allow a Client to upload `ProgressPhoto` records: each photo SHALL
   include a date, pose tag (FRONT | BACK | SIDE_LEFT | SIDE_RIGHT), and optional notes.
5. WHEN a ProgressPhoto is uploaded, THE Platform SHALL store the original image in object
   storage (e.g., Vercel Blob or AWS S3), and SHALL generate a thumbnail (max 400 × 400 px)
   for display in the gallery grid.
6. THE Progress_Module SHALL display ProgressPhotos in a side-by-side comparison view allowing
   the Client to select any two dates and poses to compare.
7. IF a ProgressPhoto upload fails due to file size exceeding 10 MB or unsupported format,
   THEN THE Platform SHALL return a descriptive validation error and SHALL NOT partially
   persist the record.
8. THE Progress_Module SHALL allow a Coach to view (read-only) their Clients' measurements
   and photos; a Client's data SHALL NOT be readable by other Clients or unrelated Coaches.

---

### Requirement 12: Calendar Module

**User Story:** As a user, I want a unified calendar view, so that I can see scheduled workouts,
meals, and check-ins in one place.

#### Acceptance Criteria

1. THE Calendar_Module SHALL display `CalendarEvent` records for the authenticated user in a
   monthly and weekly view; events SHALL be colour-coded by type (WORKOUT | MEAL_PLAN | CHECK_IN
   | REMINDER | CUSTOM).
2. THE Calendar_Module SHALL allow a Coach or Client to create custom `CalendarEvent` records
   with title, type, date, optional start time, optional end time, and optional notes.
3. WHEN a `WorkoutProgram` is assigned to a Client, THE Platform SHALL automatically create
   `CalendarEvent` records of type WORKOUT for each WorkoutDay in the program.
4. WHEN a `MealPlan` is created for a Client, THE Platform SHALL automatically create
   `CalendarEvent` records of type MEAL_PLAN for each planned day.
5. THE Calendar_Module SHALL allow a Coach to schedule CHECK_IN events for a Client; WHEN a
   check-in event is due within 24 hours, THE Platform SHALL send a Notification to both
   the Coach and the Client.
6. THE Calendar_Module client-side view SHALL be a `'use client'` React component that
   renders the calendar grid interactively; calendar data SHALL be fetched server-side and
   passed as serialised props to minimise client-side data fetching.

---

### Requirement 13: Notifications Module

**User Story:** As a user, I want to receive timely in-app and push notifications, so that I never
miss an important event or message from my Coach.

#### Acceptance Criteria

1. THE Notifications_Module SHALL store `Notification` records in the database with:
   `id`, `userId` (recipient), `type` (WORKOUT_REMINDER | MEAL_REMINDER | CHECK_IN |
   NEW_PROGRAM | COACH_MESSAGE | SYSTEM), `title`, `body`, `readAt` (nullable), `createdAt`,
   and optional `linkUrl`.
2. THE Notifications_Module SHALL expose a real-time unread count badge in the application
   shell; WHEN a new Notification is created for the current user, THE Platform SHALL update
   the badge count without requiring a full page reload.
3. THE Platform SHALL implement **Web Push Notifications** using the VAPID protocol; WHEN a
   user grants push permission, THE Platform SHALL store a `PushSubscription` record linked
   to the user; WHEN a Notification is created, THE Platform SHALL attempt to send a push
   notification to all active PushSubscription records for that user.
4. IF a push delivery fails due to an expired or invalid subscription, THEN THE Platform
   SHALL delete the stale `PushSubscription` record from the database.
5. THE Notifications_Module SHALL allow a user to mark individual notifications as read or
   mark all notifications as read in a single action.
6. THE Notifications_Module SHALL allow a user to configure notification preferences
   (per-type opt-in/opt-out) stored on the `User` record as a JSON preferences field.
7. THE Platform SHALL implement push notification delivery in a background queue (e.g.,
   Vercel Cron Job or a background Server Action) and SHALL NOT block the primary request
   while sending push messages.

---

### Requirement 14: AI Assistant Module

**User Story:** As a user, I want to chat with an AI fitness assistant, so that I can get
personalised advice, recipe suggestions, and workout modifications without waiting for my Coach.

#### Acceptance Criteria

1. THE AI_Assistant SHALL use the **OpenAI Chat Completions API** (model: `gpt-4o`) with a
   system prompt that constrains responses to fitness, nutrition, and wellness topics.
2. THE AI_Assistant SHALL maintain conversation history by persisting `AIChatSession` and
   `AIChatMessage` records in the database; WHEN a user continues a previous session, THE
   Platform SHALL pass the last 20 messages as context to the OpenAI API.
3. THE Platform SHALL stream AI responses to the client using Next.js 16 streaming and React
   Suspense; THE UI SHALL display a typing indicator while the stream is in progress.
4. THE Platform SHALL inject the authenticated user's relevant context (goal, current program
   name, recent measurements) into the system prompt to personalise responses.
5. IF the OpenAI API returns an error or times out after 30 seconds, THEN THE AI_Assistant
   SHALL display a user-readable error message and SHALL offer a "Retry" action.
6. THE AI_Assistant SHALL enforce a monthly usage cap per user (configurable via an
   `AI_MONTHLY_MESSAGE_LIMIT` environment variable); WHEN a user reaches their cap, THE
   Platform SHALL display a clear message and, WHERE a paid plan is configured, SHALL prompt
   the user to upgrade.
7. THE Platform SHALL NEVER include a user's password hash, payment details, or another user's
   personal data in the OpenAI API request payload.

---

### Requirement 15: Payments Module (Future — Stripe)

**User Story:** As a platform operator, I want Stripe-powered subscriptions, so that Coaches can
monetise their services and the platform generates recurring revenue.

#### Acceptance Criteria

1. THE Payments_Module SHALL use the **Stripe** Node.js SDK (v5+) to manage subscription
   billing; Stripe keys SHALL be stored in environment variables and SHALL NEVER be committed
   to version control.
2. THE Payments_Module SHALL support at minimum two subscription tiers: **Free** (limited
   features) and **Pro** (full access); tier definitions SHALL be stored in a
   `PRICING_PLANS` constant and mirrored as Stripe Products.
3. THE Payments_Module SHALL handle the following Stripe webhook events via the
   `api/webhooks/stripe/route.ts` Route_Handler: `checkout.session.completed`,
   `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed`.
4. WHEN a Stripe webhook is received, THE Platform SHALL verify the webhook signature using
   `stripe.webhooks.constructEvent` before processing the payload; IF the signature is
   invalid, THEN THE Route_Handler SHALL return a 400 response and SHALL NOT update
   any database records.
5. THE Payments_Module SHALL create or update a `Subscription` record in the database
   upon receipt of a verified `checkout.session.completed` or `customer.subscription.updated`
   webhook event.
6. WHEN a subscription lapses (`customer.subscription.deleted`), THE Platform SHALL downgrade
   the affected user's access to the Free tier within 1 hour of the webhook receipt.

---

### Requirement 16: Admin Dashboard

**User Story:** As an Admin, I want a comprehensive admin dashboard, so that I can manage users,
monitor platform health, and configure global settings.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display platform-wide KPIs: total registered users, active
   subscriptions, monthly active users (MAU), and AI message volume.
2. THE Admin_Dashboard SHALL allow an Admin to search, view, edit role, suspend, and
   soft-delete any `User` account.
3. THE Admin_Dashboard SHALL allow an Admin to view all `Coach` profiles and the list of
   Clients assigned to each Coach.
4. THE Admin_Dashboard SHALL allow an Admin to moderate the global `Exercise` and `Food`
   catalogues: approving Coach-submitted entries and deleting inappropriate content.
5. THE Admin_Dashboard SHALL provide an audit log of all administrative actions (user role
   changes, suspensions, content deletions) stored as immutable `AuditLog` records in
   the database.
6. THE Admin_Dashboard routes SHALL be protected by both the middleware role check (ADMIN only)
   and an additional Server Action–level role assertion; access by non-ADMIN sessions SHALL
   return a 403 response regardless of URL manipulation.

---

### Requirement 17: Component Organisation and Design System

**User Story:** As a developer, I want a well-structured design system with reusable components,
so that the UI is consistent, accessible, and easy to extend.

#### Acceptance Criteria

1. THE Platform SHALL implement a design system in `src/components/ui/` based on **shadcn/ui**
   primitives (Radix UI + Tailwind CSS v4); ALL design-system components SHALL meet
   **WCAG 2.1 AA** accessibility standards (keyboard navigable, ARIA attributes, colour contrast).
2. THE Design_System SHALL define a token set in `tailwind.config.ts` covering: colour palette
   (primary, secondary, accent, neutral, success, warning, error, and their dark-mode variants),
   typography scale (xs through 4xl), spacing scale, border-radius scale, and shadow scale.
3. THE Platform SHALL implement a dark mode toggle that persists the user's preference in a
   cookie; WHEN the platform loads, THE Platform SHALL apply the stored preference before
   first paint to prevent a flash of unstyled content.
4. THE Platform SHALL organise module-level components within `src/modules/<module>/components/`
   following this naming convention: `<EntityName><VariantOrRole>.tsx` (e.g.,
   `WorkoutProgramCard.tsx`, `NutritionMacroChart.tsx`, `ClientProfileHeader.tsx`).
5. THE Platform SHALL define the following global layout shell components in
   `src/components/layout/`: `AppShell.tsx` (authenticated shell with sidebar and topbar),
   `MarketingShell.tsx` (public layout with nav and footer), `AdminShell.tsx`
   (admin layout with sidebar), `Sidebar.tsx`, `Topbar.tsx`, `Footer.tsx`.
6. THE Platform SHALL use Tailwind CSS v4 exclusively for styling; CSS-in-JS libraries SHALL
   NOT be introduced; custom CSS SHALL be limited to `src/app/globals.css` for CSS custom
   properties (design tokens).
7. ALL interactive UI components (buttons, form inputs, modals) SHALL include `aria-label`,
   `role`, or `aria-describedby` attributes as appropriate to support screen readers.

---

### Requirement 18: State Management Strategy

**User Story:** As a developer, I want a clear and consistent state management approach, so that
client-side state is predictable and does not duplicate server-authoritative data.

#### Acceptance Criteria

1. THE Platform SHALL treat the Next.js 16 RSC data model as the **primary source of truth** for
   server-authoritative data; client-side state SHALL NOT shadow or re-fetch data already
   provided by Server Components.
2. THE Platform SHALL use **Zustand** for global client-side state that persists across
   navigations and is not server-authoritative; each Zustand slice SHALL reside in
   `src/stores/<sliceName>.store.ts` and SHALL be typed with a TypeScript interface.
3. THE Platform SHALL use **React `useState` and `useReducer`** for local component state that
   does not need to be shared beyond a single component tree.
4. THE Platform SHALL use **`useActionState` (React 19)** for Server Action form state,
   including pending indicators and validation error display; the deprecated `useFormState`
   SHALL NOT be used.
5. THE Platform SHALL use the Next.js router cache for navigation state; direct manipulation
   of browser History API SHALL NOT be used.
6. THE Platform SHALL implement an **optimistic update** pattern for high-frequency mutations
   (e.g., marking a notification as read, completing a workout set) using React's
   `useOptimistic` hook, so the UI updates immediately while the Server Action completes.
7. THE Platform SHALL use **URL search parameters** (via `useSearchParams` and `useRouter`)
   for filter, sort, and pagination state on list pages so that state is shareable via URL.

---

### Requirement 19: Naming Conventions

**User Story:** As a developer, I want enforced naming conventions, so that any contributor can
navigate the codebase intuitively and code reviews focus on logic rather than style.

#### Acceptance Criteria

1. THE Platform SHALL use **PascalCase** for all React component file names and exported
   component identifiers (e.g., `WorkoutProgramCard.tsx`, `export default function WorkoutProgramCard`).
2. THE Platform SHALL use **camelCase** for all TypeScript variable, function, and parameter
   names; **SCREAMING_SNAKE_CASE** for environment variables and compile-time constants.
3. THE Platform SHALL name all Prisma model fields in **camelCase** in `schema.prisma`; the
   corresponding PostgreSQL column names SHALL use **snake_case** via Prisma's `@map` annotation.
4. THE Platform SHALL name all Next.js App Router special files using the exact convention
   defined by Next.js 16: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`,
   `not-found.tsx`, `route.ts`, `middleware.ts`, `manifest.ts`.
5. THE Platform SHALL name all Server Action files `actions.ts` within their module folder
   (e.g., `src/modules/workouts/actions.ts`) and SHALL prefix exported action function names
   with the verb that describes the mutation (e.g., `createWorkoutProgram`,
   `updateMealPlanEntry`, `deleteProgressPhoto`).
6. THE Platform SHALL name all Zod validation schema constants with the suffix `Schema`
   (e.g., `createWorkoutProgramSchema`, `updateMealPlanEntrySchema`).
7. THE Platform SHALL name all TypeScript DTO types with the suffix `Dto` and all Prisma
   input types with the suffix `Input` (e.g., `WorkoutProgramDto`, `CreateWorkoutProgramInput`).
8. THE Platform SHALL name all Zustand store files with the suffix `.store.ts` and all custom
   React hook files with the prefix `use` (e.g., `useWorkoutTimer.ts`).

---

### Requirement 20: API Architecture

**User Story:** As a developer, I want a well-defined API layer, so that mutations and external
integrations are handled consistently and securely.

#### Acceptance Criteria

1. THE Platform SHALL use **Next.js 16 Server Actions** as the primary mutation API for all
   UI-driven operations; Route_Handlers SHALL be reserved for external webhooks and any future
   public REST API surface.
2. ALL Server Actions SHALL: (a) call `auth()` to retrieve the Session, (b) assert the required
   role with `requireRole()`, (c) validate all input with a Zod schema, (d) delegate to the
   Service_Layer, and (e) call `revalidatePath` or `updateTag` before returning.
3. ALL Route_Handlers SHALL respond with `Response.json()` and appropriate HTTP status codes:
   200 for success, 201 for resource creation, 400 for validation errors, 401 for missing
   authentication, 403 for insufficient permissions, 404 for missing resources, and 500 for
   unexpected errors.
4. THE Platform SHALL implement a centralised error-handling utility `src/lib/errors.ts` that
   defines typed error classes (`UnauthorizedError`, `ForbiddenError`, `NotFoundError`,
   `ValidationError`) and a `handleActionError` function that maps them to structured error
   responses.
5. THE Platform SHALL version the public REST API under `/api/v1/` to allow non-breaking
   evolution; breaking changes SHALL be introduced under `/api/v2/`.
6. ALL Route_Handlers that accept JSON payloads SHALL parse and validate the body with Zod
   before passing data to the Service_Layer; raw `req.body` SHALL NEVER be passed directly
   to database operations.
7. THE Platform SHALL return consistent JSON error envelopes from Route_Handlers in the shape:
   `{ "error": { "code": string, "message": string, "details"?: unknown } }`.

---

### Requirement 21: Progressive Web App (PWA)

**User Story:** As a mobile user, I want to install the platform to my home screen and receive
push notifications, so that I have a native-app experience without visiting an app store.

#### Acceptance Criteria

1. THE Platform SHALL provide a `src/app/manifest.ts` file that exports a valid Web App Manifest
   with: `name`, `short_name`, `description`, `start_url: "/"`, `display: "standalone"`,
   `background_color`, `theme_color`, and icon entries for 192 × 192 and 512 × 512 PNG sizes.
2. THE Platform SHALL register a Service Worker from `public/sw.js` using
   `navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })`
   inside a `'use client'` component mounted in the root layout.
3. THE Service Worker SHALL handle `push` events by displaying a notification with the
   received `title`, `body`, and `icon`; THE Service Worker SHALL handle `notificationclick`
   events by opening or focusing the platform URL.
4. THE Platform SHALL use VAPID keys (stored in `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and
   `VAPID_PRIVATE_KEY` environment variables) for all Web Push Notifications.
5. WHEN a user grants push permission, THE Platform SHALL call the `subscribeUser` Server
   Action to persist the `PushSubscription` in the database.
6. THE Platform SHALL serve the following HTTP security headers via `next.config.ts` on all
   routes: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
   `Referrer-Policy: strict-origin-when-cross-origin`.
7. THE Platform SHALL serve `sw.js` with `Cache-Control: no-cache, no-store, must-revalidate`
   to ensure users always execute the latest service worker.
8. WHEN the platform is accessed on iOS, THE Platform SHALL display an install-to-home-screen
   prompt explaining the Safari share menu flow, shown only when
   `display-mode: standalone` is not active.

---

### Requirement 22: Security Considerations

**User Story:** As a platform operator, I want comprehensive security controls, so that user data
and the platform infrastructure are protected from common attack vectors.

#### Acceptance Criteria

1. THE Platform SHALL store all secrets (database URL, session secret, API keys, VAPID keys,
   Stripe keys) in environment variables; secrets SHALL NEVER be hard-coded in source files
   or committed to version control.
2. THE Platform SHALL annotate all server-only modules (DAL repositories, Service_Layer
   functions, session utilities) with `import 'server-only'` to produce a build-time error
   if they are accidentally imported in Client Components.
3. THE Platform SHALL sanitise all user-supplied string inputs before persisting them to
   the database; Zod `z.string().trim()` SHALL be applied to all text fields in validation
   schemas.
4. THE Platform SHALL use parameterised queries exclusively through Prisma ORM; raw SQL
   SHALL only be executed via `prisma.$queryRaw` with tagged template literals to prevent
   SQL injection.
5. THE Platform SHALL implement a Content Security Policy (CSP) header via `next.config.ts`
   that restricts script sources to `'self'` and approved CDN origins.
6. THE Platform SHALL configure Prisma connection pooling with a maximum of 10 connections
   per serverless function instance to prevent database connection exhaustion.
7. THE Platform SHALL enforce HTTPS across all routes on Vercel (automatic); the `Secure`
   flag on session cookies SHALL always be `true` in production.
8. WHEN a user changes their password or email, THE Platform SHALL invalidate all existing
   sessions for that user by rotating the session secret or expiring all Session records.
9. THE Platform SHALL log all authentication failures (invalid password, expired token)
   with timestamps and anonymised IP addresses for security monitoring; full IP addresses
   SHALL NOT be logged in compliance with privacy regulations.
10. THE Platform SHALL comply with GDPR right-to-erasure: WHEN an Admin or user requests
    account deletion, THE Platform SHALL set `deletedAt` on the User record and anonymise
    personally identifiable fields (name, email) within 30 days.

---

### Requirement 23: Multi-Tenant Coach–Client Architecture

**User Story:** As a Coach, I want to manage multiple Clients under my account, so that I can run
my fitness business from a single platform without Clients seeing each other's data.

#### Acceptance Criteria

1. THE Platform SHALL model the Coach–Client relationship via a `CoachClientRelationship`
   join table with fields: `coachId`, `clientId`, `status` (ACTIVE | PAUSED | ARCHIVED),
   `startDate`, and `endDate`.
2. WHEN a Coach invites a new Client, THE Platform SHALL generate a time-limited (48-hour)
   invite token, send an invitation email to the Client's address, and create a
   `CoachClientRelationship` record with status PENDING.
3. WHEN a Client accepts an invitation, THE Platform SHALL set the relationship status to
   ACTIVE and associate the Client's `userId` with the `CoachClientRelationship` record.
4. THE Platform SHALL scope all Coach data fetches using a `tenantId` extracted from the
   Coach's Session so that a Coach can never read another Coach's Clients' data.
5. THE Platform SHALL allow a single User account to hold both COACH and CLIENT roles
   in separate tenants (i.e., a Coach can also be a Client of another Coach); the active
   role context SHALL be determined by the current route group (`/coach` vs `/dashboard`).
6. THE Platform SHALL allow a Client to be reassigned from one Coach to another by an Admin;
   WHEN reassignment occurs, THE Platform SHALL create an audit log entry and notify both
   the old and new Coach.

---

### Requirement 24: Future Scalability Considerations

**User Story:** As a platform architect, I want the system designed for growth, so that scaling
to tens of thousands of users requires evolutionary changes rather than rewrites.

#### Acceptance Criteria

1. THE Platform SHALL use **Prisma connection pooling** (PgBouncer or Prisma Accelerate) to
   support concurrent serverless invocations without exhausting database connections.
2. THE Platform SHALL implement **Next.js 16 `use cache`** on all expensive, low-change-rate
   reads (food catalogue, exercise catalogue, pricing plans) with appropriate `cacheLife`
   profiles to reduce database read load.
3. THE Platform SHALL be deployable to **Vercel Edge Functions** for latency-critical routes
   (middleware, authentication checks); the middleware SHALL use the Edge Runtime and SHALL
   NOT import Node.js-only modules.
4. THE Platform SHALL implement **cursor-based pagination** (using `cursor` + `take`) for all
   list endpoints that can return more than 50 records; offset-based pagination SHALL NOT
   be used for large collections.
5. THE Platform SHALL externalise file storage to an object-storage service (Vercel Blob or
   AWS S3) and SHALL NEVER store binary assets in the PostgreSQL database.
6. THE Platform SHALL design the AI_Assistant module so that the LLM provider can be swapped
   by updating the `src/lib/openai.ts` adapter and the system prompt; no OpenAI-specific
   types SHALL leak into the Service_Layer.
7. THE Platform SHALL design the Payments_Module as an isolated adapter so that Stripe can be
   replaced by another payment processor by updating `src/lib/stripe.ts` and the webhook
   Route_Handler without touching the Service_Layer.
8. THE Platform SHALL instrument all Server Actions and Route_Handlers with OpenTelemetry
   spans (via `instrumentation.ts`) so that distributed traces are available in a compatible
   APM tool (e.g., Vercel Observability, Datadog) without code changes to business logic.
9. THE Platform SHALL use **feature flags** (stored as a JSON field on the `Config` database
   model) to enable or disable modules and experimental features without a redeploy.
10. THE Platform SHALL design the notification delivery pipeline so that the transport layer
    (currently Web Push) can be extended to include email (Resend/SendGrid) and SMS (Twilio)
    by adding new delivery adapters under `src/modules/notifications/adapters/` without
    modifying the notification Service_Layer.
