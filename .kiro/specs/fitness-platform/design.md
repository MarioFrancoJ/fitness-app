# FitCoach Platform — Epic 01: Foundation — Technical Design Document

> **Scope:** Epic 01 — Foundation only. Nutrition, Workouts, Progress, AI, Payments,
> Notifications, and Calendar are explicitly out of scope.
> **Stack:** Next.js 16.x · React 19 · TypeScript 5 · Tailwind CSS v4 · Auth.js v5 ·
> Prisma ORM · PostgreSQL · Vercel

---

## Overview

## 1. Overview and Architecture Diagram

FitCoach is a multi-tenant SaaS fitness platform following **Clean Architecture** principles.
The codebase is split into four clearly bounded layers:

```
┌─────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER  (src/app/ — Next.js 16 App Router)         │
│  Pages · Layouts · Server Actions · Route Handlers              │
├─────────────────────────────────────────────────────────────────┤
│  APPLICATION LAYER   (src/modules/<module>/services/)            │
│  Use-case orchestration · DTO mapping · Business rules           │
├─────────────────────────────────────────────────────────────────┤
│  DOMAIN LAYER        (src/modules/<module>/types/ + validations/)│
│  TypeScript types · Zod schemas · Domain constants               │
├─────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER (src/modules/<module>/repositories/)       │
│  Prisma DAL · External adapters (src/lib/)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                    PostgreSQL (Prisma + PgBouncer)
```

**High-level request flow:**

```
Browser → proxy.ts (RBAC check, CSP, rate-limit hints)
        → Next.js App Router (RSC render / Server Action)
        → Service Layer (use-case function)
        → Repository (Prisma query)
        → PostgreSQL
        → Service Layer (DTO mapping)
        → RSC / Server Action return value
        → Browser (Flight payload / JSON)
```


---

## 2. Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) | RSC-first, `cacheComponents`, streaming, Server Actions |
| Language | TypeScript 5 (strict) | Type safety across all layers |
| UI Library | React 19 | `useActionState`, `useOptimistic`, `<Activity>` state preservation |
| Styling | Tailwind CSS v4 | CSS-first config, no `tailwind.config.ts` required |
| Component Primitives | shadcn/ui (Radix UI) | Accessible, unstyled, composable |
| ORM | Prisma 6 | Type-safe DAL, migrations, connection pooling |
| Database | PostgreSQL 16 | ACID, JSONB, full-text search |
| Auth | Auth.js v5 (NextAuth) | Credentials + OAuth, stateless JWT, Edge-compatible |
| Validation | Zod 3 | Runtime schema validation at Server Action boundaries |
| Global State | Zustand 5 | Minimal, typed client-side state slices |
| Caching | Next.js `use cache` + `cacheLife` | Replaces `unstable_cache`; requires `cacheComponents: true` |
| Password Hashing | bcryptjs (cost ≥ 12) | Battle-tested, pure-JS, Edge-safe |
| IDs | CUID2 | URL-safe, collision-resistant, sortable |
| Deployment | Vercel | Edge Functions, Blob storage, Cron, Observability |

> **Next.js 16 breaking changes observed in this project:**
> - `middleware.ts` is **deprecated** and renamed to `proxy.ts` (file + exported function both renamed).
> - `params` and `searchParams` in page/layout props are now `Promise<…>` — must `await` them.
> - `unstable_cache` is replaced by the `'use cache'` directive + `cacheLife`/`cacheTag` (requires `cacheComponents: true` in `next.config.ts`).
> - `experimental.ppr` removed — Partial Prerendering is now part of `cacheComponents`.
> - `middleware` runs in Node.js runtime by default (no longer Edge-only).
> - `updateTag` (Server Actions only) vs `revalidateTag` (anywhere) have distinct semantics.


---

## 3. Folder Structure

Every directory and its purpose is described below.

```
fitness-app/
├── prisma/
│   ├── schema.prisma          # Single source of truth for the DB schema
│   └── migrations/            # Prisma Migrate history (never edit manually)
│
├── public/
│   ├── manifest.json          # PWA Web App Manifest (static fallback)
│   ├── sw.js                  # Service Worker (push notifications, offline cache)
│   └── icons/                 # PWA icons: icon-192.png, icon-512.png, apple-touch.png
│
├── src/
│   ├── app/                   # Next.js 16 App Router — ROUTING LAYER ONLY
│   │   ├── (marketing)/       # Route group — public marketing pages, MarketingShell layout
│   │   ├── (auth)/            # Route group — login/register/forgot/reset flows, no shell
│   │   ├── (app)/             # Route group — all authenticated user pages, AppShell layout
│   │   ├── (admin)/           # Route group — admin-only pages, AdminShell layout
│   │   ├── api/               # Route Handlers (external webhooks, OAuth callback, future REST)
│   │   ├── globals.css        # CSS custom properties (design tokens) — Tailwind v4 source
│   │   ├── layout.tsx         # Root layout: <html>, font loading, ServiceWorkerRegistrar
│   │   ├── not-found.tsx      # Root 404 page
│   │   ├── manifest.ts        # PWA manifest (Next.js file convention)
│   │   ├── sitemap.ts         # Dynamic sitemap
│   │   └── robots.ts          # robots.txt generation
│   │
│   ├── modules/               # Feature modules — one per domain
│   │   ├── auth/
│   │   │   ├── actions.ts     # Server Actions: registerUser, loginUser, logoutUser, resetPassword
│   │   │   ├── services/      # authService.ts — use-case orchestration
│   │   │   ├── repositories/  # userRepository.ts — all User Prisma queries
│   │   │   ├── components/    # LoginForm.tsx, RegisterForm.tsx, ResetPasswordForm.tsx
│   │   │   ├── types/         # SessionPayload, UserDto, AuthErrorCode
│   │   │   └── validations/   # loginSchema.ts, registerSchema.ts, resetPasswordSchema.ts
│   │   │
│   │   └── admin/             # Admin module (mirrors auth structure)
│   │
│   ├── components/            # Global reusable components
│   │   ├── ui/                # Design-system primitives (shadcn/ui generated + custom)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx        # Wrapper around react-hook-form + Zod
│   │   │   ├── label.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── sheet.tsx       # Mobile drawer
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   └── tooltip.tsx
│   │   │
│   │   ├── layout/            # Shell / structural components
│   │   │   ├── AppShell.tsx        # Authenticated shell: sidebar + topbar
│   │   │   ├── MarketingShell.tsx  # Public shell: nav + footer
│   │   │   ├── AdminShell.tsx      # Admin shell: collapsible sidebar
│   │   │   ├── Sidebar.tsx         # Role-aware navigation sidebar
│   │   │   ├── Topbar.tsx          # User menu, notifications bell, dark mode toggle
│   │   │   └── Footer.tsx          # Marketing footer with links
│   │   │
│   │   └── shared/            # Cross-module composites (no module-specific logic)
│   │       ├── RoleGate.tsx        # Client-side role gate for conditional rendering
│   │       ├── ImpersonationBanner.tsx
│   │       ├── ErrorMessage.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── PageHeader.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── lib/                   # Shared infrastructure singletons
│   │   ├── db.ts              # Prisma client singleton (import 'server-only')
│   │   ├── auth.ts            # Auth.js v5 configuration + requireRole helper
│   │   ├── session.ts         # JWT encrypt/decrypt, createSession, updateSession
│   │   ├── errors.ts          # Typed error classes + handleActionError
│   │   ├── logger.ts          # Structured logger with IP anonymisation
│   │   ├── rate-limit.ts      # In-memory / Redis rate limiter
│   │   ├── openai.ts          # OpenAI client stub (server-only)
│   │   └── stripe.ts          # Stripe client stub (server-only)
│   │
│   ├── config/                # Typed constants — no runtime logic
│   │   ├── routes.ts          # All route path constants (ROUTES object)
│   │   ├── permissions.ts     # RBAC rules matrix
│   │   └── metadata.ts        # Default SEO metadata
│   │
│   ├── hooks/                 # Global custom React hooks (client-only)
│   │   ├── useSession.ts      # Reads session from Zustand / RSC context
│   │   ├── useTheme.ts        # Dark mode toggle with cookie persistence
│   │   └── useToast.ts        # Toast notification helper
│   │
│   ├── stores/                # Zustand state slices
│   │   ├── auth.store.ts      # Session snapshot for client-side role gates
│   │   └── ui.store.ts        # Sidebar open state, toast queue
│   │
│   ├── types/                 # Global TypeScript declarations
│   │   ├── index.ts           # Re-exports
│   │   ├── next.d.ts          # Augmented Next.js types (PageProps helper usage)
│   │   └── prisma.d.ts        # Prisma generated type re-exports
│   │
│   └── utils/                 # Pure utility functions (no side effects)
│       ├── cn.ts              # clsx + tailwind-merge helper
│       ├── format.ts          # Date/number formatters
│       ├── id.ts              # CUID2 generator wrapper
│       └── ip.ts              # IP anonymisation (last octet zeroing)
│
├── next.config.ts             # Next.js config: cacheComponents, CSP headers, security headers
├── tailwind.config.ts         # Tailwind v4: minimal; most config lives in globals.css
├── tsconfig.json              # TypeScript strict config; path aliases: @/* → src/*
├── eslint.config.mjs          # ESLint flat config
├── postcss.config.mjs         # Tailwind v4 PostCSS plugin
├── prisma/schema.prisma       # (see §19)
├── .env.local                 # Local secrets (never committed)
├── .env.example               # Documented env var template (committed)
└── proxy.ts                   # Next.js 16 Proxy (replaces middleware.ts)
```


---

## Architecture

## 4. Application Architecture (4 Layers)

### Layer 1 — Presentation (src/app/)

The App Router layer contains **only** routing artefacts. No business logic, no direct Prisma calls.

Responsibilities:
- `page.tsx` files fetch data by calling Service Layer functions (RSC).
- `actions.ts` files define Server Actions (`'use server'`), validate with Zod, delegate to services, call `updateTag`/`revalidatePath`, return structured results.
- `layout.tsx` files compose shell components and pass props.
- `loading.tsx` provides Suspense skeletons for streaming.
- `error.tsx` is a Client Component error boundary (`'use client'`).

**Server Action contract (every action must follow this pattern):**

```typescript
// src/modules/auth/actions.ts
'use server'
import 'server-only'
import { auth, requireRole } from '@/lib/auth'
import { loginSchema } from '@/modules/auth/validations/loginSchema'
import { authService } from '@/modules/auth/services/authService'
import { updateTag } from 'next/cache'

export async function loginUser(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 1. Validate input with Zod
  const parsed = loginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }
  // 2. Delegate to service (no Prisma here)
  const result = await authService.login(parsed.data)
  // 3. Invalidate cache if needed (updateTag in Server Actions for read-your-own-writes)
  updateTag('user-session')
  return result
}
```

### Layer 2 — Application (src/modules/<module>/services/)

Service functions are the **sole orchestrators** of business logic.

Rules:
- Every service file has `import 'server-only'` at the top.
- Services call repositories (never Prisma directly).
- Services map repository results to DTO types before returning.
- Services never return raw Prisma model objects.

```typescript
// src/modules/auth/services/authService.ts
import 'server-only'
import { userRepository } from '../repositories/userRepository'
import type { LoginInput, SessionDto } from '../types'

export const authService = {
  async login(input: LoginInput): Promise<SessionDto> {
    const user = await userRepository.findByEmail(input.email)
    // ... bcrypt compare, createSession, return DTO
  },
}
```

### Layer 3 — Domain (src/modules/<module>/types/ + validations/)

Pure TypeScript — no imports from Next.js, Prisma, or React.

- `types/`: DTO types (`UserDto`, `SessionPayload`), domain enums, input types.
- `validations/`: Zod schemas with the `Schema` suffix. All use `.trim()` on string fields.

```typescript
// src/modules/auth/validations/loginSchema.ts
import { z } from 'zod'
export const loginSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(8).trim(),
})
export type LoginInput = z.infer<typeof loginSchema>
```

### Layer 4 — Infrastructure (repositories/ + src/lib/)

Prisma DAL repositories and external client singletons.

Rules:
- Repositories are the **only** place Prisma is imported.
- All queries append `where: { deletedAt: null }` for soft-deleted models.
- Raw SQL (`prisma.$queryRaw`) is used only when Prisma's query builder is insufficient, always with tagged template literals.
- `src/lib/db.ts` exports a single Prisma client instance using the global singleton pattern to avoid connection exhaustion in Next.js dev.

```typescript
// src/lib/db.ts
import 'server-only'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
export const db = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### Caching Strategy (Next.js 16 `cacheComponents`)

`cacheComponents: true` is enabled in `next.config.ts`. This activates the `use cache` directive and `cacheLife`/`cacheTag` APIs, replacing `unstable_cache`.

```typescript
// src/modules/admin/repositories/exerciseCatalogueRepository.ts
import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { db } from '@/lib/db'

export async function getExerciseCatalogue() {
  'use cache'
  cacheLife('days')           // Exercise catalogue changes rarely
  cacheTag('exercise-catalogue')
  return db.exercise.findMany({ orderBy: { name: 'asc' } })
}
```

Server Actions use `updateTag` (immediate, read-your-own-writes) after mutations. Background stale-while-revalidate uses `revalidateTag('tag', 'max')`.


---

## 5. Route Structure

### Route Groups and Layout Zones

| Route Group | URL Prefix | Layout Shell | Auth Required |
|---|---|---|---|
| `(marketing)` | `/`, `/pricing`, `/about`, `/contact`, `/blog` | `MarketingShell` | No |
| `(auth)` | `/login`, `/register`, `/forgot-password`, `/reset-password` | None (full-page forms) | No |
| `(app)` | `/dashboard`, `/profile`, `/settings`, `/coach/*` | `AppShell` | Yes — all roles |
| `(admin)` | `/admin/*` | `AdminShell` | Yes — ADMIN only |

### Complete Route Map (Epic 01)

```
src/app/
│
├── (marketing)/
│   ├── layout.tsx                        # MarketingShell wrapper
│   ├── page.tsx                          # GET /
│   ├── pricing/page.tsx                  # GET /pricing
│   ├── about/page.tsx                    # GET /about
│   ├── contact/page.tsx                  # GET /contact
│   └── blog/
│       └── [slug]/page.tsx               # GET /blog/:slug  (CUID2 excluded; slug is string)
│
├── (auth)/
│   ├── login/page.tsx                    # GET /login
│   ├── register/page.tsx                 # GET /register
│   ├── forgot-password/page.tsx          # GET /forgot-password
│   └── reset-password/
│       └── [token]/page.tsx              # GET /reset-password/:token
│
├── (app)/
│   ├── layout.tsx                        # AppShell wrapper (calls auth(), redirects if no session)
│   ├── loading.tsx                       # Root skeleton for (app) group
│   ├── error.tsx                         # Root error boundary for (app) group
│   ├── not-found.tsx                     # 404 within (app)
│   ├── dashboard/
│   │   ├── page.tsx                      # GET /dashboard
│   │   └── loading.tsx
│   ├── profile/
│   │   └── page.tsx                      # GET /profile
│   ├── settings/
│   │   └── page.tsx                      # GET /settings
│   └── coach/
│       ├── clients/
│       │   ├── page.tsx                  # GET /coach/clients
│       │   └── [clientId]/
│       │       └── page.tsx              # GET /coach/clients/:clientId
│       └── loading.tsx
│
├── (admin)/
│   ├── layout.tsx                        # AdminShell wrapper (re-asserts ADMIN role server-side)
│   ├── loading.tsx
│   ├── error.tsx
│   ├── admin/
│   │   ├── page.tsx                      # GET /admin  (KPI dashboard)
│   │   ├── users/
│   │   │   ├── page.tsx                  # GET /admin/users
│   │   │   └── [id]/page.tsx             # GET /admin/users/:id
│   │   ├── coaches/page.tsx              # GET /admin/coaches
│   │   ├── content/page.tsx              # GET /admin/content
│   │   ├── analytics/page.tsx            # GET /admin/analytics
│   │   └── settings/page.tsx            # GET /admin/settings
│
├── api/
│   ├── auth/
│   │   └── [...nextauth]/route.ts        # Auth.js OAuth callback handler
│   ├── webhooks/
│   │   ├── stripe/route.ts               # Stripe webhook (future)
│   │   └── openai/route.ts               # OpenAI webhook (future)
│   └── v1/                               # Public REST API (future)
│
├── layout.tsx                            # Root layout: html, body, fonts, ServiceWorkerRegistrar
├── not-found.tsx                         # Root 404
├── manifest.ts                           # PWA manifest
├── sitemap.ts
└── robots.ts
```

**Dynamic segment convention:**
- All resource IDs use CUID2 (e.g., `/coach/clients/cm4xyz…`).
- Blog slugs are human-readable strings (e.g., `/blog/top-5-hiit-workouts`).
- `params` is typed as `Promise<{ id: string }>` (Next.js 16 async params).

```typescript
// src/app/(app)/coach/clients/[clientId]/page.tsx
export default async function ClientDetailPage(
  props: PageProps<'/coach/clients/[clientId]'>
) {
  const { clientId } = await props.params  // must await — Next.js 16
  // ...
}
```


---

## 6. Authentication Flow

Auth.js v5 is configured in `src/lib/auth.ts`. Session is stored as a stateless JWT in an
`HttpOnly; Secure; SameSite=Lax` cookie with a 7-day expiry. The JWT payload carries only:
`{ userId, role, tenantId, expiresAt }`.

### 6.1 Registration Flow

```
User fills RegisterForm
  → registerUser Server Action
    → Zod: registerSchema.safeParse(formData)
    → userRepository.findByEmail() — reject if email exists
    → bcrypt.hash(password, 12)
    → userRepository.create({ email, passwordHash, role: 'CLIENT' })
    → session.createSession(userId, role, tenantId)    ← sets HttpOnly cookie
    → redirect('/dashboard')
```

### 6.2 Credentials Login Flow

```
User fills LoginForm
  → loginUser Server Action
    → Zod: loginSchema.safeParse(formData)
    → rate-limit check (10 attempts/IP/min) — 429 if exceeded
    → userRepository.findByEmail() — 401 if not found
    → bcrypt.compare(password, user.passwordHash) — 401 if mismatch
    → logger.authFailure() if mismatch (anonymised IP, timestamp)
    → session.createSession(userId, role, tenantId)
    → redirect(callbackUrl ?? '/dashboard')
```

### 6.3 Google OAuth Flow

```
User clicks "Continue with Google"
  → Auth.js signIn('google') → Google OAuth consent screen
  → Redirect to /api/auth/callback/google (Route Handler)
  → Auth.js: find or create User record (Account link)
  → session.createSession(userId, role, tenantId)
  → redirect('/dashboard')
```

### 6.4 Password Reset Flow

```
User submits forgot-password form
  → forgotPassword Server Action
    → Zod: emailSchema.safeParse()
    → userRepository.findByEmail()    ← always return success (prevent email enumeration)
    → crypto.randomBytes(32) → token
    → bcrypt.hash(token, 10) → tokenHash
    → userRepository.storeResetToken(userId, tokenHash, expiresAt: +1hr)
    → emailAdapter.sendPasswordResetEmail(email, token)

User clicks reset link → /reset-password/:token
  → resetPassword Server Action
    → Zod: resetPasswordSchema.safeParse()
    → userRepository.findByResetToken(tokenHash)
    → reject if not found or expiresAt < now
    → bcrypt.hash(newPassword, 12)
    → userRepository.updatePassword(userId, newPasswordHash)
    → userRepository.clearResetToken(userId)
    → session invalidation (update all sessions for user)
    → redirect('/login')
```

### 6.5 Session Refresh

The `proxy.ts` reads the session cookie on every authenticated request. If the session is
valid and has fewer than 3.5 days remaining, `session.updateSession()` is called to roll
the expiry forward by 7 days. This is done in the proxy to avoid the overhead of a full
RSC render cycle.

### 6.6 Session Helpers

```typescript
// src/lib/session.ts
import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export type SessionPayload = {
  userId: string
  role: 'ADMIN' | 'COACH' | 'CLIENT'
  tenantId: string | null
  expiresAt: Date
}

export async function createSession(payload: SessionPayload): Promise<void> { /* ... */ }
export async function updateSession(): Promise<void> { /* ... */ }
export async function deleteSession(): Promise<void> { /* ... */ }
export async function getSession(): Promise<SessionPayload | null> { /* ... */ }
```

### 6.7 CSRF Protection

Next.js 16 Server Actions enforce CSRF protection automatically by comparing the `Origin`
header against the `Host`/`X-Forwarded-Host` header. This check is **never disabled**.
For deployments behind a proxy or CDN, add trusted origins to `next.config.ts`:

```typescript
serverActions: { allowedOrigins: ['fitcoach.app', '*.fitcoach.app'] }
```


---

## 7. User Roles and RBAC

### 7.1 Role Definitions

| Role | Description | Primary Route Group |
|---|---|---|
| `ADMIN` | Platform super-user. Manages all users, content, and global settings. | `/admin` |
| `COACH` | Fitness professional managing one or more Clients under their tenant. | `/coach/*` + `/dashboard` |
| `CLIENT` | End-user assigned to a Coach or self-registered. Consumes programs and logs progress. | `/dashboard` |

### 7.2 Permissions Matrix (Epic 01)

| Action | ADMIN | COACH | CLIENT |
|---|---|---|---|
| Access `/admin` routes | ✅ | ❌ | ❌ |
| Access `/coach/clients` | ✅ | ✅ (own tenant only) | ❌ |
| Access `/dashboard` | ✅ (redirects to `/admin`) | ✅ | ✅ |
| View any User profile | ✅ | ❌ | ❌ |
| Edit any User's role | ✅ | ❌ | ❌ |
| Soft-delete any User | ✅ | ❌ | ❌ |
| Impersonate any User | ✅ | ❌ | ❌ |
| Invite Clients | ✅ | ✅ | ❌ |
| View own profile/settings | ✅ | ✅ | ✅ |

### 7.3 Proxy-Level Route Protection

`proxy.ts` (the Next.js 16 replacement for `middleware.ts`) runs on every request before
the route is rendered. It decodes the session JWT and enforces coarse-grained role checks:

```typescript
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { ROUTES } from '@/config/routes'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await getSession()

  // Admin routes
  if (pathname.startsWith('/admin') && session?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url))
  }

  // Coach routes
  if (pathname.startsWith('/coach') &&
      session?.role !== 'ADMIN' &&
      session?.role !== 'COACH') {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url))
  }

  // All (app) routes require a valid session
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/profile') ||
      pathname.startsWith('/settings')) {
    if (!session) {
      const callbackUrl = encodeURIComponent(pathname)
      return NextResponse.redirect(
        new URL(`${ROUTES.LOGIN}?callbackUrl=${callbackUrl}`, request.url)
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|icons).*)'],
}
```

> The proxy provides a **fast first gate**. It is NOT the sole security boundary.
> Every Server Action independently calls `requireRole()` and re-reads the session from
> the cookie — never from client-supplied data.

### 7.4 Server Action–Level Authorization

```typescript
// src/lib/auth.ts
import 'server-only'
import { getSession } from './session'
import { UnauthorizedError, ForbiddenError } from './errors'
import type { Role } from '@prisma/client'

export async function auth() {
  const session = await getSession()
  if (!session) throw new UnauthorizedError()
  return session
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await auth()
  if (!allowedRoles.includes(session.role)) {
    throw new ForbiddenError(`Role ${session.role} not permitted`)
  }
  return session
}
```

### 7.5 Tenant Scoping

Every Coach DAL query is scoped by `tenantId` (the Coach's `userId`):

```typescript
// src/modules/auth/repositories/userRepository.ts
export const userRepository = {
  async findClientsByCoach(coachId: string) {
    return db.coachClientRelationship.findMany({
      where: { coachId, status: 'ACTIVE', deletedAt: null },  // tenantId scope
      include: { client: true },
    })
  },
}
```

Client DAL queries always filter by `userId`:

```typescript
async findMeasurementsByClient(clientId: string, requestingUserId: string) {
  // Service layer verifies requestingUserId === clientId OR requestingUserId is the Coach
  return db.measurement.findMany({
    where: { clientId, deletedAt: null },
  })
}
```

### 7.6 Admin Impersonation

When active, the session JWT carries an additional `impersonatedUserId` field. The
`AppShell` server component checks for this field and renders the `ImpersonationBanner`
component. All DAL queries use the impersonated user's ID for the duration of the session.


---

## 8. Layout Architecture

### 8.1 Shell Hierarchy

```
Root layout.tsx                 (html, body, fonts — always present)
  └─ (marketing)/layout.tsx
       └─ MarketingShell.tsx    (Nav + Footer)
            └─ page.tsx

  └─ (auth)/layout.tsx          (centred card container, no nav)
       └─ page.tsx

  └─ (app)/layout.tsx
       └─ AppShell.tsx          (Sidebar + Topbar + main content area)
            └─ page.tsx

  └─ (admin)/layout.tsx
       └─ AdminShell.tsx        (Admin sidebar + Topbar)
            └─ page.tsx
```

### 8.2 Shell Components

**`AppShell.tsx`** — Server Component. Reads session server-side, passes role to
`Sidebar`. Renders `ImpersonationBanner` if `impersonatedUserId` is set.

```typescript
// src/components/layout/AppShell.tsx
import { auth } from '@/lib/auth'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ImpersonationBanner } from '../shared/ImpersonationBanner'

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={session.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {session.impersonatedUserId && <ImpersonationBanner />}
        <Topbar session={session} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
```

**`MarketingShell.tsx`** — Server Component. Renders public nav with conditional
"Sign In" / "Dashboard" CTA based on session (read via `getSession()`).

**`AdminShell.tsx`** — Server Component. Re-asserts `ADMIN` role at render time
(redundant with proxy, but defence-in-depth). Renders collapsible admin sidebar.

**`Sidebar.tsx`** — Client Component (`'use client'`). Receives `role` as a prop
(serialised from server). Drives navigation items from the `ROUTES` config. Handles
mobile collapse state via Zustand `ui.store`.

**`Topbar.tsx`** — Client Component. User avatar, role badge, notifications bell
(unread count from Zustand), dark mode toggle, sign-out button.

### 8.3 Layout Decisions

- Shells are Server Components by default; only interactive sub-components (Sidebar
  collapse, Topbar dropdowns) are Client Components.
- The mobile sidebar uses a `<Sheet>` (shadcn/ui) component — accessible drawer pattern.
- Layouts do **not** fetch data. Data fetching happens in `page.tsx` RSCs that call the
  Service Layer directly.
- Each route group has its own `loading.tsx` that renders skeleton placeholders matching
  the route's visual structure to support React Suspense streaming.


---

## 9. Navigation Strategy

### 9.1 Role-Based Navigation Items

Navigation items are driven by a static config resolved at render time. The `Sidebar`
receives the session `role` as a prop and filters items client-side.

```typescript
// src/config/routes.ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: (token: string) => `/reset-password/${token}`,
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  COACH_CLIENTS: '/coach/clients',
  COACH_CLIENT_DETAIL: (clientId: string) => `/coach/clients/${clientId}`,
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: (id: string) => `/admin/users/${id}`,
  ADMIN_COACHES: '/admin/coaches',
  ADMIN_CONTENT: '/admin/content',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',
} as const
```

### 9.2 Sidebar Navigation Config

```typescript
// src/config/navigation.ts  (used by Sidebar.tsx)
import { ROUTES } from './routes'
import type { Role } from '@prisma/client'

type NavItem = {
  label: string
  href: string
  icon: string          // Lucide icon name
  roles: Role[]         // Empty = all authenticated roles
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',   href: ROUTES.DASHBOARD,     icon: 'LayoutDashboard', roles: [] },
  { label: 'My Clients',  href: ROUTES.COACH_CLIENTS, icon: 'Users',           roles: ['ADMIN', 'COACH'] },
  { label: 'Profile',     href: ROUTES.PROFILE,       icon: 'User',            roles: [] },
  { label: 'Settings',    href: ROUTES.SETTINGS,      icon: 'Settings',        roles: [] },
]

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Overview',   href: ROUTES.ADMIN,           icon: 'BarChart2',    roles: ['ADMIN'] },
  { label: 'Users',      href: ROUTES.ADMIN_USERS,     icon: 'Users',        roles: ['ADMIN'] },
  { label: 'Coaches',    href: ROUTES.ADMIN_COACHES,   icon: 'Briefcase',    roles: ['ADMIN'] },
  { label: 'Content',    href: ROUTES.ADMIN_CONTENT,   icon: 'BookOpen',     roles: ['ADMIN'] },
  { label: 'Analytics',  href: ROUTES.ADMIN_ANALYTICS, icon: 'TrendingUp',   roles: ['ADMIN'] },
  { label: 'Settings',   href: ROUTES.ADMIN_SETTINGS,  icon: 'Settings',     roles: ['ADMIN'] },
]
```

### 9.3 Active State and Prefetching

- Active state is determined using `usePathname()` (client hook) comparing `item.href`
  against the current pathname prefix.
- The `<Link>` component from `next/link` handles prefetching automatically for visible
  links in the viewport. No manual `router.prefetch()` calls are needed.
- Next.js 16 preserves component state (`useState`, form inputs, scroll) across navigations
  via React `<Activity>` — the sidebar open/close state is therefore preserved without
  Zustand for the desktop layout.


---

## Components and Interfaces

## 10. Design System Strategy

### 10.1 Tailwind CSS v4

Tailwind v4 is configured via `@import "tailwindcss"` in `src/app/globals.css` — there is
no `tailwind.config.ts` required for basic setups. Design tokens are defined as CSS custom
properties inside the `@theme` block in `globals.css`.

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Colour palette */
  --color-primary-50:  oklch(0.97 0.02 250);
  --color-primary-500: oklch(0.55 0.22 250);
  --color-primary-900: oklch(0.25 0.12 250);

  --color-secondary-500: oklch(0.60 0.18 160);
  --color-accent-500:    oklch(0.65 0.25 35);
  --color-neutral-50:    oklch(0.98 0.00 0);
  --color-neutral-900:   oklch(0.13 0.00 0);
  --color-success-500:   oklch(0.62 0.18 145);
  --color-warning-500:   oklch(0.75 0.18 65);
  --color-error-500:     oklch(0.58 0.22 25);

  /* Typography */
  --font-sans: 'Inter Variable', system-ui, sans-serif;
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;
  --text-4xl:  2.25rem;

  /* Spacing */
  --spacing-18: 4.5rem;

  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  /* Shadows */
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

/* Dark mode — applied via class on <html> */
.dark {
  --color-neutral-50:  oklch(0.13 0.00 0);
  --color-neutral-900: oklch(0.98 0.00 0);
  color-scheme: dark;
}
```

> **Rationale for CSS custom properties:** Tailwind v4 reads `@theme` tokens at build time
> and generates utility classes from them. Defining tokens as CSS custom properties means
> they are also available for use in arbitrary CSS and JS (e.g., chart colour palettes)
> without duplication.

### 10.2 shadcn/ui Integration

Components are generated into `src/components/ui/` using the shadcn CLI. They are source
files — not a package dependency — giving full ownership. Each component uses Tailwind
utility classes and Radix UI primitives.

```bash
npx shadcn@latest add button input label dialog card badge skeleton
```

All generated components must meet **WCAG 2.1 AA**:
- Minimum colour contrast ratio: 4.5:1 for normal text, 3:1 for large text.
- All interactive elements are keyboard navigable (Tab, Enter, Esc, arrow keys via Radix).
- `aria-label` or visible label required on all form controls.
- Focus rings are always visible (`focus-visible:ring-2 focus-visible:ring-primary-500`).

### 10.3 Dark Mode

Dark mode preference is stored in a cookie (`theme=dark|light`) and applied to `<html>`
**before first paint** to prevent FOUC (Flash of Unstyled Content).

```typescript
// src/app/layout.tsx  (simplified)
import { cookies } from 'next/headers'

export default async function RootLayout({ children }) {
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')?.value ?? 'light'
  return (
    <html lang="en" className={theme === 'dark' ? 'dark' : ''} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
```

The `useTheme` hook (Client Component) toggles the class on `<html>` and writes the
cookie via a lightweight Server Action. No `next-themes` dependency is required.

### 10.4 Component Naming Convention

| Category | Location | Example |
|---|---|---|
| Design system primitives | `src/components/ui/` | `Button.tsx`, `Input.tsx` |
| Layout / shell components | `src/components/layout/` | `AppShell.tsx`, `Sidebar.tsx` |
| Cross-module composites | `src/components/shared/` | `RoleGate.tsx`, `PageHeader.tsx` |
| Module-level components | `src/modules/<module>/components/` | `ClientProfileHeader.tsx` |

All component files use PascalCase. Client Components are co-located with a `'use client'`
directive as the first line.


---

## 11. Component Strategy

### 11.1 Server vs Client Component Decision Tree

```
Does the component need:
  - onClick, onChange, useState, useEffect, browser APIs?
      YES → 'use client' (Client Component)
      NO  → RSC by default (Server Component)

Does the component fetch data?
  - YES, from DB / Service Layer → RSC
  - YES, reactively (search, infinite scroll) → Client Component using Server Actions

Does the component pass data to an interactive child?
  - YES → keep parent as RSC, mark only the interactive child as 'use client'
```

**Rule:** Push `'use client'` as far down the component tree as possible. A page's RSC
shell should fetch data and pass serialised props to small Client Component "islands".

### 11.2 Component Layers

```
Presentation (app/)
    └── Module components  (src/modules/<module>/components/)
            └── Shared composites  (src/components/shared/)
                    └── Layout shells  (src/components/layout/)
                            └── Design system primitives  (src/components/ui/)
```

Lower layers have no knowledge of higher layers. `ui/` components are pure — no
business logic, no auth imports, no direct Prisma references.

### 11.3 Form Pattern

Forms use `useActionState` (React 19) connected to a Server Action. No `react-hook-form`
is needed for simple forms; it is optional for complex multi-step forms.

```typescript
// src/modules/auth/components/LoginForm.tsx
'use client'
import { useActionState } from 'react'
import { loginUser } from '@/modules/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginUser, undefined)
  return (
    <form action={action}>
      <Input name="email" type="email" required aria-label="Email address" />
      {state?.errors?.email && (
        <p role="alert" className="text-error-500 text-sm">{state.errors.email[0]}</p>
      )}
      <Input name="password" type="password" required aria-label="Password" />
      {state?.errors?.password && (
        <p role="alert" className="text-error-500 text-sm">{state.errors.password[0]}</p>
      )}
      <Button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
      {state?.message && <p role="alert">{state.message}</p>}
    </form>
  )
}
```

### 11.4 Data Tables

Admin and Coach list pages use a shared `<Table>` primitive from `src/components/ui/table.tsx`.
Column definitions, sorting, and filtering state live in URL search params (`useSearchParams`
+ `useRouter`) so table state is shareable and bookmarkable.

### 11.5 `cn()` Utility

All class merging uses the `cn()` helper from `src/utils/cn.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```


---

## 12. Global Configuration

### 12.1 `src/config/routes.ts`

All URL path constants live here (see §9.2). No magic strings in components.

### 12.2 `src/config/permissions.ts`

```typescript
// src/config/permissions.ts
import type { Role } from '@prisma/client'

export const PERMISSIONS = {
  viewAdminDashboard:  ['ADMIN'] as Role[],
  manageUsers:         ['ADMIN'] as Role[],
  viewCoachDashboard:  ['ADMIN', 'COACH'] as Role[],
  manageClients:       ['ADMIN', 'COACH'] as Role[],
  viewClientDashboard: ['ADMIN', 'COACH', 'CLIENT'] as Role[],
  impersonateUser:     ['ADMIN'] as Role[],
} as const

export type Permission = keyof typeof PERMISSIONS
```

Usage in Server Actions: `await requireRole(PERMISSIONS.manageClients)`.

### 12.3 `src/config/metadata.ts`

```typescript
// src/config/metadata.ts
import type { Metadata } from 'next'

export const DEFAULT_METADATA: Metadata = {
  title:       { template: '%s | FitCoach', default: 'FitCoach — Your Fitness Platform' },
  description: 'Connect with your coach, track progress, and achieve your fitness goals.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://fitcoach.app'),
  openGraph: {
    type: 'website',
    siteName: 'FitCoach',
  },
  twitter: { card: 'summary_large_image' },
}
```

Each `page.tsx` can export its own `metadata` or `generateMetadata` to override defaults.

### 12.4 `next.config.ts`

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,     // Enables 'use cache', cacheLife, cacheTag; disables unstable_cache
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.vercel-storage.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',            value: 'DENY' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
```

> CSP is applied via `proxy.ts` (nonce-based, per-request) not via static headers, because
> Next.js RSC injects inline scripts that require a nonce for strict CSP compliance.


---

## 13. Environment Variables Strategy

### 13.1 Schema

All environment variables are documented in `.env.example` (committed) and populated in
`.env.local` (git-ignored). A Zod schema in `src/lib/env.ts` validates and types all
env vars at startup.

```typescript
// src/lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL:              z.url(),
  DIRECT_DATABASE_URL:       z.url().optional(),  // Prisma Accelerate direct URL

  // Auth
  AUTH_SECRET:               z.string().min(32),
  AUTH_GOOGLE_ID:            z.string().optional(),
  AUTH_GOOGLE_SECRET:        z.string().optional(),

  // App
  NEXT_PUBLIC_APP_URL:       z.url(),

  // Encryption (stable across deployments for Server Action closure encryption)
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: z.string().min(32),

  // Future integrations (defined but optional in Epic 01)
  OPENAI_API_KEY:            z.string().optional(),
  STRIPE_SECRET_KEY:         z.string().optional(),
  STRIPE_WEBHOOK_SECRET:     z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY:         z.string().optional(),
  AI_MONTHLY_MESSAGE_LIMIT:  z.coerce.number().default(100),
})

export const env = envSchema.parse(process.env)
```

### 13.2 Variable Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Prisma connection string (with PgBouncer params for serverless) |
| `DIRECT_DATABASE_URL` | Optional | Direct URL for Prisma Migrate (bypasses pooler) |
| `AUTH_SECRET` | ✅ | JWT signing secret (≥ 32 chars). Generate: `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Optional | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Optional | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL (e.g., `https://fitcoach.app`) |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | ✅ prod | Stable key for Server Action closure encryption across instances |
| `OPENAI_API_KEY` | Future | OpenAI API key (AI module) |
| `STRIPE_SECRET_KEY` | Future | Stripe secret key (Payments module) |
| `STRIPE_WEBHOOK_SECRET` | Future | Stripe webhook signing secret |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Future | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | Future | VAPID private key (server-only) |
| `AI_MONTHLY_MESSAGE_LIMIT` | Optional | Per-user monthly AI message cap (default: 100) |

### 13.3 Rules

1. Secrets **never** appear in source code or are committed to version control.
2. `NEXT_PUBLIC_*` variables are exposed to the browser — put only non-sensitive values there.
3. Server-only secrets (API keys, DB URL) must never be imported in Client Components.
   Annotate their modules with `import 'server-only'`.
4. `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` must be identical across all Vercel deployment
   instances to prevent "Failed to find Server Action" errors after re-deployments.


---

## Error Handling

## 14. Error Handling Strategy

### 14.1 Typed Error Classes

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403)
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404)
  }
}

export class ValidationError extends AppError {
  constructor(
    message = 'Validation failed',
    public readonly details?: Record<string, string[]>,
  ) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 'CONFLICT', 409)
  }
}
```

### 14.2 Server Action Error Handling

Server Actions return a structured `ActionState` type — they never throw across the
network boundary (throw-based errors are for internal flow control only).

```typescript
// src/types/index.ts
export type ActionState<T = undefined> = {
  data?: T
  message?: string
  errors?: Record<string, string[]>
  error?: { code: string; message: string }
}
```

```typescript
// src/lib/errors.ts (continued)
import type { ActionState } from '@/types'

export function handleActionError(error: unknown): ActionState {
  if (error instanceof ValidationError) {
    return { errors: error.details, error: { code: error.code, message: error.message } }
  }
  if (error instanceof AppError) {
    return { error: { code: error.code, message: error.message } }
  }
  console.error('[Unhandled action error]', error)
  return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } }
}
```

Usage in every Server Action:

```typescript
export async function someAction(formData: FormData): Promise<ActionState> {
  try {
    // ...
  } catch (error) {
    return handleActionError(error)
  }
}
```

### 14.3 Route Handler Error Handling

Route Handlers use the standardised JSON error envelope:

```typescript
return Response.json(
  { error: { code: 'NOT_FOUND', message: 'User not found' } },
  { status: 404 }
)
```

The `unstable_rethrow` utility from `next/cache` is used to re-throw Next.js internal
errors (redirects, not-found) that should not be caught by application error handlers.

### 14.4 Error Boundaries

Every route group has an `error.tsx` Client Component:

```typescript
// src/app/(app)/error.tsx
'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Error boundary]', error)
  }, [error])

  return (
    <div role="alert" className="flex flex-col items-center gap-4 p-8">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-neutral-500 text-sm">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

### 14.5 Not Found Pages

`src/app/not-found.tsx` renders a branded 404 page with a "Go home" CTA.
`src/app/(app)/not-found.tsx` renders a contextualised 404 within the `AppShell`.


---

## 15. Logging Strategy

### 15.1 Logger

The `src/lib/logger.ts` module provides a structured logger. In production it outputs
JSON-serialisable log entries compatible with Vercel Log Drains and observability tools.
All logs go to `stdout`/`stderr` — no third-party logging SDK dependency in Epic 01.

```typescript
// src/lib/logger.ts
import 'server-only'
import { anonymiseIp } from '@/utils/ip'

type LogLevel = 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }
  const output = JSON.stringify(entry)
  if (level === 'error') console.error(output)
  else console.log(output)
}

export const logger = {
  info:  (msg: string, ctx?: LogContext) => log('info', msg, ctx),
  warn:  (msg: string, ctx?: LogContext) => log('warn', msg, ctx),
  error: (msg: string, ctx?: LogContext) => log('error', msg, ctx),

  // Auth-specific helpers
  authFailure(ip: string, email: string, reason: string) {
    log('warn', 'AUTH_FAILURE', {
      ip: anonymiseIp(ip),      // NEVER log full IP — GDPR compliance
      emailHash: hashEmail(email),  // One-way hash for correlating without storing PII
      reason,
    })
  },
  authSuccess(userId: string, role: string) {
    log('info', 'AUTH_SUCCESS', { userId, role })
  },
  adminAction(adminId: string, action: string, targetId: string) {
    log('info', 'ADMIN_ACTION', { adminId, action, targetId,
      timestamp: new Date().toISOString() })
  },
}
```

### 15.2 IP Anonymisation

Per GDPR compliance, full IP addresses are **never** logged. The `anonymiseIp` utility
zeroes the last octet for IPv4 and the last 64 bits for IPv6:

```typescript
// src/utils/ip.ts
export function anonymiseIp(ip: string): string {
  // IPv4: zero last octet  (e.g., 192.168.1.42 → 192.168.1.0)
  if (ip.includes('.') && !ip.includes(':')) {
    return ip.replace(/\.\d+$/, '.0')
  }
  // IPv6: zero last 4 groups  (e.g., 2001:db8::1 → 2001:db8::0)
  // Simplified — production implementation should use a proper IPv6 library
  const parts = ip.split(':')
  if (parts.length >= 4) {
    return parts.slice(0, 4).join(':') + '::0'
  }
  return '0.0.0.0'
}
```

### 15.3 What Gets Logged

| Event | Level | Fields |
|---|---|---|
| Auth failure (bad password / expired token) | `warn` | `AUTH_FAILURE`, anonymised IP, hashed email, reason, timestamp |
| Auth success | `info` | `AUTH_SUCCESS`, userId, role |
| Admin action (role change, suspension, deletion) | `info` | `ADMIN_ACTION`, adminId, action, targetId, timestamp |
| Rate limit exceeded | `warn` | `RATE_LIMIT`, anonymised IP, endpoint |
| Unhandled error in Server Action | `error` | error message, stack digest |
| Stripe webhook received | `info` | event type, Stripe event ID |

### 15.4 Audit Log (Database)

Admin actions are also persisted as immutable `AuditLog` records in the database:

```typescript
// Logged from adminService after every CRUD action on users
await db.auditLog.create({
  data: {
    actorId:    adminSession.userId,
    action:     'USER_ROLE_CHANGED',
    targetId:   userId,
    metadata:   { oldRole, newRole },
    createdAt:  new Date(),
  },
})
```


---

## 16. Security Strategy

### 16.1 Defence-in-Depth Layers

| Layer | Mechanism | Location |
|---|---|---|
| Network / request | CSP headers (nonce-based), security headers (`X-Frame-Options`, etc.) | `proxy.ts`, `next.config.ts` |
| Route access | JWT role check | `proxy.ts` |
| Action access | `requireRole()` + Zod validation | Every Server Action |
| Data access | Tenant scoping, ownership checks | Every repository |
| Input safety | Zod `.trim()` on all string fields | Validation schemas |
| SQL safety | Prisma parameterised queries | All repositories |
| Secret safety | `import 'server-only'`, env vars | Library modules |
| Session safety | HttpOnly + Secure + SameSite=Lax cookie, 7-day expiry | `session.ts` |

### 16.2 Content Security Policy

CSP is implemented via `proxy.ts` using nonce-based headers (see §6 of Next.js 16 CSP
guide). A fresh nonce is generated per request using `crypto.randomUUID()`:

```typescript
// proxy.ts (CSP section)
const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
const isDev = process.env.NODE_ENV === 'development'
const csp = `
  default-src 'self';
  script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'nonce-${nonce}';
  img-src 'self' blob: data: https://*.vercel-storage.com;
  font-src 'self';
  connect-src 'self' https://api.openai.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim()
```

> Because nonce-based CSP requires dynamic rendering, pages that use nonces cannot be
> statically prerendered. For the marketing section (static pages), CSP headers are
> set via `next.config.ts` using `'unsafe-inline'` for styles only (acceptable trade-off
> for public, unauthenticated pages).

### 16.3 Rate Limiting

Rate limiting is applied in `proxy.ts` for the login and registration endpoints using an
in-memory sliding-window counter keyed by anonymised IP. For multi-instance Vercel
deployments, a Redis-backed counter (e.g., Upstash) should be substituted.

```typescript
// src/lib/rate-limit.ts
const WINDOW_MS = 60_000    // 1 minute
const MAX_REQUESTS = 10

const store = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }
  entry.count++
  store.set(key, entry)
  return { allowed: entry.count <= MAX_REQUESTS, remaining: MAX_REQUESTS - entry.count }
}
```

### 16.4 Password Security

- `bcryptjs` with a cost factor of **12** for all password hashing.
- Passwords are **never** logged, returned from Server Actions, or included in DTOs.
- The `requirePasswordStrength` Zod refinement enforces minimum 8 characters, at least
  one letter, one number, and one special character.

### 16.5 Session Invalidation

When a user changes their password or email, all sessions are invalidated by:
1. Deleting all `Session` records for that user from the database (if using DB sessions).
2. Rotating the `AUTH_SECRET` for stateless JWT sessions (drastic — only for compromised
   accounts). Preferred approach: add a `sessionVersion` integer to the User record and
   include it in the JWT payload; increment on password/email change.

### 16.6 HTTPS

HTTPS is enforced by Vercel across all routes. The `Secure` flag is always set on session
cookies in production (`process.env.NODE_ENV === 'production'`).


---

## 17. State Management Strategy

### 17.1 Decision Hierarchy

State is managed at the lowest appropriate scope:

```
1. URL search params     → filter/sort/pagination state on list pages
2. RSC props             → server-authoritative data (user profile, list items)
3. React useState        → local UI state (dropdown open, input value)
4. useActionState        → Server Action form state (pending, errors, result)
5. useOptimistic         → optimistic mutations (mark-as-read, toggle complete)
6. Zustand store         → global client state that persists across navigations
```

Client-side state **never shadows** or re-fetches data already provided by RSC props.

### 17.2 Zustand Stores

```typescript
// src/stores/auth.store.ts
import { create } from 'zustand'
import type { Role } from '@prisma/client'

interface AuthState {
  userId: string | null
  role: Role | null
  setSession: (userId: string, role: Role) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  role: null,
  setSession: (userId, role) => set({ userId, role }),
  clearSession: () => set({ userId: null, role: null }),
}))
```

```typescript
// src/stores/ui.store.ts
import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toastQueue: Toast[]
  addToast: (toast: Toast) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toastQueue: [],
  addToast: (toast) => set((s) => ({ toastQueue: [...s.toastQueue, toast] })),
  removeToast: (id) => set((s) => ({ toastQueue: s.toastQueue.filter(t => t.id !== id) })),
}))
```

> **Note:** With Next.js 16 `cacheComponents`, component state (including `useState`) is
> **preserved** across navigations via React `<Activity>`. Sidebar open/close state will
> naturally persist without Zustand for desktop. Zustand is still valuable for state that
> must be shared across completely separate component trees.

### 17.3 `useActionState` Pattern

All Server Action forms use `useActionState` (React 19). The deprecated `useFormState`
from `react-dom` is **not used**.

```typescript
const [state, action, isPending] = useActionState(serverAction, undefined)
```

### 17.4 `useOptimistic` Pattern

High-frequency mutations (notification mark-as-read, workout set completion) use
`useOptimistic` so the UI responds instantly while the Server Action completes:

```typescript
'use client'
import { useOptimistic, startTransition } from 'react'
import { markNotificationRead } from '@/modules/notifications/actions'

export function NotificationItem({ notification }) {
  const [optimisticRead, setOptimisticRead] = useOptimistic(notification.readAt)
  return (
    <button
      onClick={() => {
        startTransition(async () => {
          setOptimisticRead(new Date())          // instant UI update
          await markNotificationRead(notification.id)  // background mutation
        })
      }}
      className={optimisticRead ? 'opacity-50' : 'font-semibold'}
    >
      {notification.title}
    </button>
  )
}
```

### 17.5 URL State for Lists

Filter, sort, and pagination state on list pages uses `useSearchParams` and `useRouter`:

```typescript
'use client'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export function UserFilters() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  function handleRoleFilter(role: string) {
    const params = new URLSearchParams(searchParams)
    params.set('role', role)
    params.set('page', '1')
    replace(`${pathname}?${params.toString()}`)
  }
  // ...
}
```


---

## 18. Coding and Naming Conventions

### 18.1 File Naming

| Category | Convention | Example |
|---|---|---|
| React components | PascalCase `.tsx` | `WorkoutProgramCard.tsx` |
| Server Actions | `actions.ts` (module-level) | `src/modules/auth/actions.ts` |
| Services | `<domain>Service.ts` | `authService.ts` |
| Repositories | `<domain>Repository.ts` | `userRepository.ts` |
| Zod schemas | `<noun>Schema.ts` | `loginSchema.ts` |
| Zustand stores | `<noun>.store.ts` | `auth.store.ts` |
| Custom hooks | `use<Name>.ts` | `useTheme.ts` |
| Utility functions | `camelCase.ts` | `cn.ts`, `format.ts` |
| Next.js special files | Exact Next.js 16 convention | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`, `proxy.ts`, `manifest.ts` |

### 18.2 Identifier Naming

| Category | Convention | Example |
|---|---|---|
| React components (export) | PascalCase | `export default function LoginForm()` |
| TypeScript variables/functions/params | camelCase | `const sessionPayload`, `async function createSession()` |
| TypeScript constants (compile-time) | SCREAMING_SNAKE_CASE | `const MAX_RETRY_ATTEMPTS = 3` |
| Environment variables | SCREAMING_SNAKE_CASE | `AUTH_SECRET`, `DATABASE_URL` |
| Prisma model fields | camelCase | `passwordHash`, `createdAt` |
| PostgreSQL columns | snake_case (via `@map`) | `password_hash`, `created_at` |
| Zod schemas | camelCase + `Schema` suffix | `createUserSchema`, `loginSchema` |
| DTO types | PascalCase + `Dto` suffix | `UserDto`, `SessionPayload` |
| Prisma input types | PascalCase + `Input` suffix | `CreateUserInput` |
| Server Action functions | camelCase, verb-first | `createWorkoutProgram`, `deleteProgressPhoto` |
| RBAC permission keys | camelCase | `viewAdminDashboard`, `manageClients` |

### 18.3 Component Module Naming

Module components follow `<EntityName><VariantOrRole>.tsx`:

```
ClientProfileHeader.tsx
CoachClientCard.tsx
AdminUserTable.tsx
AdminUserRoleBadge.tsx
```

### 18.4 Import Order

ESLint enforces the following import order (via `eslint-plugin-import`):

1. React / React ecosystem (`react`, `next/*`)
2. Third-party libraries
3. Path alias imports (`@/lib/*`, `@/components/*`, `@/modules/*`)
4. Relative imports (`./`, `../`)
5. Type-only imports

### 18.5 `'use client'` / `'use server'` Placement

- `'use client'` is the **first line** of client component files (before any imports).
- `'use server'` is the **first line** of Server Action files.
- `import 'server-only'` appears on line 2 of every service, repository, and lib file.

### 18.6 Comments and Documentation

- Public service functions are annotated with JSDoc.
- Inline comments explain **why**, not **what**.
- `TODO(username): description` format for tracked technical debt.


---

## Data Models

## 19. Database Schema — Foundation Models

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")  // For Prisma Migrate (bypasses PgBouncer)
}

// ─── Enums ─────────────────────────────────────────────────────────────────

enum Role {
  ADMIN
  COACH
  CLIENT
}

enum RelationshipStatus {
  PENDING
  ACTIVE
  PAUSED
  ARCHIVED
}

// ─── Auth.js Foundation Models ──────────────────────────────────────────────

model User {
  id            String    @id @default(cuid2())
  email         String    @unique
  passwordHash  String?   @map("password_hash")
  name          String?
  avatarUrl     String?   @map("avatar_url")
  role          Role      @default(CLIENT)
  emailVerified DateTime? @map("email_verified")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")  // Soft delete

  // Reset token (hashed)
  passwordResetToken   String?   @unique @map("password_reset_token")
  passwordResetExpires DateTime? @map("password_reset_expires")

  // Session version — increment on password/email change to invalidate JWTs
  sessionVersion Int @default(0) @map("session_version")

  // Relations
  accounts     Account[]
  sessions     Session[]
  coachProfile Coach?
  clientProfile Client?

  @@map("users")
}

model Account {
  id                String  @id @default(cuid2())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refreshToken      String? @map("refresh_token") @db.Text
  accessToken       String? @map("access_token") @db.Text
  expiresAt         Int?    @map("expires_at")
  tokenType         String? @map("token_type")
  scope             String?
  idToken           String? @map("id_token") @db.Text
  sessionState      String? @map("session_state")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid2())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ─── Domain Models ──────────────────────────────────────────────────────────

model Coach {
  id          String  @id @default(cuid2())
  userId      String  @unique @map("user_id")
  bio         String? @db.Text
  specialties String[]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user     User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  clients  CoachClientRelationship[]

  @@map("coaches")
}

model Client {
  id             String  @id @default(cuid2())
  userId         String  @unique @map("user_id")
  dateOfBirth    DateTime? @map("date_of_birth")
  unitPreference String    @default("METRIC") @map("unit_preference") // "METRIC" | "IMPERIAL"
  goals          String?   @db.Text
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  user     User                    @relation(fields: [userId], references: [id], onDelete: Cascade)
  coaches  CoachClientRelationship[]

  @@map("clients")
}

model CoachClientRelationship {
  id        String             @id @default(cuid2())
  coachId   String             @map("coach_id")
  clientId  String             @map("client_id")
  status    RelationshipStatus @default(PENDING)
  startDate DateTime?          @map("start_date")
  endDate   DateTime?          @map("end_date")
  inviteToken  String?         @unique @map("invite_token")
  inviteExpires DateTime?      @map("invite_expires")
  createdAt DateTime           @default(now()) @map("created_at")
  updatedAt DateTime           @updatedAt @map("updated_at")

  coach  Coach  @relation(fields: [coachId], references: [id], onDelete: Cascade)
  client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@unique([coachId, clientId])
  @@map("coach_client_relationships")
}

model AuditLog {
  id        String   @id @default(cuid2())
  actorId   String   @map("actor_id")
  action    String
  targetId  String?  @map("target_id")
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")

  @@index([actorId])
  @@index([targetId])
  @@map("audit_logs")
}
```

> **Soft delete convention:** All DAL repository queries append
> `where: { deletedAt: null }` for every `User` lookup. A Prisma middleware extension
> can enforce this globally to prevent accidental exposure of deleted records.


---

## Correctness

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property-based testing is applicable to this epic because the core logic — authentication,
RBAC, tenant data scoping, session management, rate limiting, and cryptographic hashing —
consists of pure or near-pure functions whose correctness should hold across a wide input
space. Infrastructure glue (route structure, folder layout, Next.js config) is excluded.

The chosen PBT library is **[fast-check](https://fast-check.dev/)** (TypeScript-native,
widely used with Vitest/Jest). Each property test runs a minimum of **100 iterations**.

---

### Property 1: Route RBAC rejects unauthorised roles

*For any* authenticated session with role R and any protected route path P, the `proxy`
function SHALL redirect to `/login` if and only if R is not in the set of roles permitted
for the route group that P belongs to.

**Validates: Requirements 3.2**

---

### Property 2: `requireRole` throws exactly when role is not in allowed set

*For any* session role R and any non-empty list of allowed roles L, `requireRole(session, L)`
SHALL throw `ForbiddenError` if R ∉ L, and SHALL return the session if R ∈ L. No other
outcome is permitted for any combination of valid inputs.

**Validates: Requirements 3.3**

---

### Property 3: Coach tenant scoping — no cross-tenant data leakage

*For any* Coach and any multi-tenant dataset, all records returned by Coach DAL queries
SHALL have a `coachId` (or `tenantId`) equal to the querying Coach's ID. No records
belonging to another Coach's tenant SHALL appear in the result set.

**Validates: Requirements 3.4, 23.4**

---

### Property 4: Client data isolation — no cross-client data leakage

*For any* Client and any dataset, all records returned by Client DAL queries SHALL have a
`userId` (or `clientId`) equal to the querying Client's user ID. No records belonging to
other Clients SHALL appear in the result set.

**Validates: Requirements 3.5**

---

### Property 5: Unauthenticated requests are always redirected

*For any* route under the `(app)` or `(admin)` route groups, if the request carries no
valid session cookie (absent, expired, or tampered JWT), the `proxy` function SHALL
redirect to `/login?callbackUrl=<encoded-original-path>`. No protected page SHALL render
for an unauthenticated request.

**Validates: Requirements 3.7**

---

### Property 6: Password hashing is a correct round-trip with cost ≥ 12

*For any* valid password string P, the sequence hash(P) → compare(P, hash) SHALL return
`true`; and for any string Q ≠ P, compare(Q, hash(P)) SHALL return `false`. The bcrypt
hash SHALL encode a cost factor ≥ 12 (verified by inspecting the `$2b$12$` prefix).

**Validates: Requirements 4.2, 4.9**

---

### Property 7: Password reset tokens are valid within window only

*For any* reset token T generated at time T₀, the token SHALL be accepted by
`validateResetToken` for all requests at time T where (T − T₀) < 1 hour, and SHALL be
rejected for all requests at time T where (T − T₀) ≥ 1 hour. Used tokens SHALL be
rejected regardless of age.

**Validates: Requirements 4.6, 4.7**

---

### Property 8: Registration rejects duplicate email addresses

*For any* email address E already present in the user store, calling `registerUser` with
email E SHALL return a `ConflictError` and SHALL NOT create an additional User record. The
total count of users with email E SHALL remain exactly 1 before and after the attempted
registration.

**Validates: Requirements 4.8**

---

### Property 9: Rate limiter rejects the 11th attempt within the same window

*For any* IP address I, the rate limiter SHALL permit up to 10 requests within any 60-second
window, and SHALL reject (return `allowed: false`) for every request beyond the 10th within
the same window. After the window expires, the counter SHALL reset and requests SHALL be
permitted again.

**Validates: Requirements 4.11**

---

### Property 10: Soft-deleted users are excluded from all DAL queries

*For any* user record with `deletedAt` set to a non-null value, no standard DAL query
(findByEmail, findById, list) SHALL return that user in its result set. The exclusion SHALL
hold regardless of the other query parameters (role, status, search term).

**Validates: Requirements 2.8, 6.8**

---

### Property 11: Auth failure logs contain a timestamp and an anonymised IP

*For any* authentication failure event triggered with IP address I, the resulting log entry
SHALL contain an ISO 8601 timestamp and an anonymised IP address where the last octet (IPv4)
or last 64 bits (IPv6) has been zeroed. The original full IP address SHALL NOT appear in
any log output.

**Validates: Requirements 22.9**

---

### Property 12: GDPR erasure anonymises PII fields

*For any* user record U with a real name and email address, after calling `deleteAccount(U.id)`,
the User record SHALL have `deletedAt` set to a non-null timestamp, and the `name` and
`email` fields SHALL no longer contain personally identifiable values (replaced with
anonymised placeholders such as `[deleted]` / `[deleted]@fitcoach.invalid`).

**Validates: Requirements 22.10**


---

## 21. Development Roadmap for Epic 01

The following ordered task list represents the recommended implementation sequence.
Each task is self-contained and reviewable independently.

### Phase A — Project Bootstrap

1. **Scaffold `src/` directory structure** — create all folders defined in §3, add
   `index.ts` barrel files, configure path alias `@/* → src/*` in `tsconfig.json`.

2. **Configure `next.config.ts`** — enable `cacheComponents: true`, add security headers,
   configure `serverActions.allowedOrigins`.

3. **Configure Tailwind v4 design tokens** — write `globals.css` `@theme` block with the
   full colour, typography, spacing, radius, and shadow token set from §10.1.

4. **Install and configure shadcn/ui** — run the shadcn CLI to generate initial UI
   primitives: `button`, `input`, `label`, `form`, `card`, `badge`, `skeleton`, `dialog`,
   `sheet`, `toast`, `dropdown-menu`, `separator`, `table`, `tooltip`, `avatar`, `switch`.

5. **Configure ESLint** — flat config (`eslint.config.mjs`) with `@typescript-eslint`,
   `eslint-plugin-import`, and `eslint-plugin-jsx-a11y`.

6. **Write `src/lib/env.ts`** — Zod env schema, validate at startup. Create `.env.example`.

### Phase B — Database Foundation

7. **Write Prisma schema** — define all models from §19, configure `datasource`, `generator`.

8. **Create initial Prisma migration** — run `prisma migrate dev --name init`.

9. **Write Prisma client singleton** — `src/lib/db.ts` with global singleton pattern.

10. **Write User repository** — `userRepository.ts` with `findByEmail`, `findById`,
    `create`, `updatePassword`, `softDelete`, `anonymise`, always filtering `deletedAt: null`.

### Phase C — Authentication

11. **Write session helpers** — `src/lib/session.ts`: `encrypt`, `decrypt`, `createSession`,
    `updateSession`, `deleteSession`, `getSession`.

12. **Write `src/lib/auth.ts`** — `auth()` and `requireRole()` helpers.

13. **Write `src/lib/errors.ts`** — all typed error classes and `handleActionError`.

14. **Write `src/lib/logger.ts`** and `src/utils/ip.ts` — structured logger with IP
    anonymisation.

15. **Configure Auth.js v5** — `src/lib/auth.ts` Auth.js config: Credentials provider,
    Google OAuth provider, JWT strategy, session callbacks.

16. **Write auth Zod schemas** — `loginSchema`, `registerSchema`, `resetPasswordSchema`.

17. **Write auth Server Actions** — `src/modules/auth/actions.ts`: `loginUser`,
    `registerUser`, `logoutUser`, `forgotPassword`, `resetPassword`.

18. **Write auth Service** — `src/modules/auth/services/authService.ts`.

19. **Write `proxy.ts`** — route RBAC checks, session refresh, CSP nonce header, rate
    limiting redirect for login/register endpoints.

20. **Write `src/lib/rate-limit.ts`** — sliding-window rate limiter.

### Phase D — Auth UI

21. **Write auth page layouts** — `(auth)/layout.tsx` centred card wrapper.

22. **Write auth form components** — `LoginForm.tsx`, `RegisterForm.tsx`,
    `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx` (all using `useActionState`).

23. **Write auth pages** — `(auth)/login/page.tsx`, `(auth)/register/page.tsx`,
    `(auth)/forgot-password/page.tsx`, `(auth)/reset-password/[token]/page.tsx`.

### Phase E — Application Shell

24. **Write `Footer.tsx`** — marketing footer.

25. **Write `MarketingShell.tsx`** — public nav + footer wrapper.

26. **Write `Sidebar.tsx`** — role-aware navigation sidebar (Client Component).

27. **Write `Topbar.tsx`** — user menu, dark mode toggle, notifications bell placeholder.

28. **Write `AppShell.tsx`** — authenticated shell composing Sidebar + Topbar.

29. **Write `AdminShell.tsx`** — admin layout.

30. **Write `ImpersonationBanner.tsx`** and `RoleGate.tsx` shared components.

### Phase F — Zustand Stores and Global Config

31. **Write Zustand stores** — `auth.store.ts`, `ui.store.ts`.

32. **Write `src/config/routes.ts`** — all ROUTES constants.

33. **Write `src/config/permissions.ts`** — PERMISSIONS matrix.

34. **Write `src/config/metadata.ts`** — default SEO metadata.

### Phase G — Route Groups and Pages (Epic 01 Scope)

35. **Write `(app)` route group** — `layout.tsx` (AppShell), `loading.tsx`, `error.tsx`,
    `not-found.tsx`.

36. **Write `/dashboard` page** — role-branching RSC: Coach view, Client view, Admin redirect.

37. **Write `/profile` page** — user profile viewer/editor.

38. **Write `/settings` page** — account settings (password change, theme preference).

39. **Write `/coach/clients` page** — Coach's client list with search and filters.

40. **Write `/coach/clients/[clientId]` page** — Client detail view for Coach.

41. **Write `(admin)` route group** — `layout.tsx` (AdminShell), `loading.tsx`, `error.tsx`.

42. **Write `/admin` dashboard page** — KPI metrics (user count, etc.).

43. **Write `/admin/users` page** — searchable user table.

44. **Write `/admin/users/[id]` page** — user detail with role/status management.

45. **Write `/admin/coaches`, `/admin/content`, `/admin/analytics`, `/admin/settings`** pages.

### Phase H — Marketing Pages

46. **Write `(marketing)` layout** — MarketingShell wrapper.

47. **Write landing page `/`** — hero, features, testimonials, pricing section, footer.

48. **Write `/pricing`, `/about`, `/contact`** static pages.

### Phase I — PWA and Global Config

49. **Write `src/app/manifest.ts`** — PWA Web App Manifest file convention.

50. **Write `public/sw.js`** — Service Worker stub (push handler, notification click).

51. **Write `ServiceWorkerRegistrar.tsx`** — Client Component in root layout that calls
    `navigator.serviceWorker.register('/sw.js')`.

### Phase J — Testing

52. **Set up Vitest** — `vitest.config.ts`, test utilities, testing library.

53. **Write property-based tests** — using `fast-check`, one test per property defined in
    §20. Tag each test: `Feature: fitness-platform, Property N: <property text>`.

54. **Write example-based unit tests** — key services and utilities.

55. **Write integration tests** — auth flow end-to-end, proxy RBAC checks.


---

## Testing Strategy

## 22. Error Handling and Testing Strategy

### Testing Approach

**Dual-layer testing** — unit/property tests for pure logic, integration tests for wiring.

**Property-based tests** (fast-check, ≥ 100 iterations each):
- Authentication and session logic: hashing, token expiry, duplicate registration
- RBAC: `requireRole`, proxy route checks
- Data scoping: tenant isolation for Coach and Client queries
- Security: rate limiter, IP anonymisation, GDPR erasure

Each property test is tagged:
```typescript
// Tag format: Feature: {feature_name}, Property {N}: {property_text}
it.prop([fc.string(), fc.constantFrom('ADMIN', 'COACH', 'CLIENT')])(
  'Feature: fitness-platform, Property 2: requireRole throws when role not in allowed set',
  async (_, role) => { /* ... */ }
)
```

**Unit tests** (Vitest, example-based):
- `handleActionError` maps each error class to the correct response shape
- `anonymiseIp` correctly zeroes last octet for IPv4 and last 64 bits for IPv6
- `cn()` merges class names without conflicts
- Dark mode cookie reading and application in root layout

**Integration tests** (Vitest + Next.js test utilities):
- Full registration → login → protected route → logout flow
- Proxy RBAC: CLIENT cannot access `/admin`, COACH cannot access `/admin/users`
- Password reset flow end-to-end

**What is NOT tested:**
- Folder structure (enforced by tooling and TypeScript path resolution)
- Tailwind CSS token definitions (visual regression tools handle these)
- shadcn/ui component internals (tested by Radix UI)

