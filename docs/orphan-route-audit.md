# Final Orphan-Route Audit (pre Phase-2)

**Status: AUDIT ONLY — nothing implemented.** Purpose: before consolidating the
Meal Planner, list every orphan/duplicate/dead route and any code that becomes
unused, so consolidation doesn't leave new orphans behind.

Method: inventoried all 45 `page.tsx` under `app/(app)/`, extracted every
internal `href`/`router.push` across `app/` + `components/`, and cross-referenced
against the sidebar (`components/app/Sidebar.tsx` `NAV_SECTIONS` + Dashboard +
Calendar) and the topbar/notification panel.

**Sidebar-reachable routes (18):** `/dashboard`, `/calendar`, `/training/start`,
`/workouts`, `/training/workout-builder`, `/training/exercises`,
`/training/templates`, `/training/history`, `/nutrition`, `/nutrition/recipes`,
`/nutrition/shopping-list`, `/progress`, `/progress/weight`,
`/progress/measurements`, `/progress/photos`, `/ai/chat`, `/ai-coach`,
`/recommendations`, `/profile`, `/subscription`.
Topbar/panel also link: `/profile`, `/notifications`.

---

## 1. Routes accessible but NOT reachable from the sidebar (orphans)

Grouped by whether they're a legitimate sub-flow (reached by an in-page
action/CTA) or a true orphan (no clear entry).

### 1a. True orphans — reachable only via a stray/duplicate link, or not at all

| Route | Inbound links (grep) | Status |
|-------|----------------------|--------|
| `/meal-planner` (legacy planner **B**) | `ai/page.tsx:103` (AI card), `shopping-list/page.tsx:73` (CTA) | Orphan + duplicate of `/nutrition/meal-planner` |
| `/nutrition/meal-planner` (planner **A**) | Calendar, Dashboard(×2), Recipe detail prose | **Not in sidebar** — the Phase-1 fix adds it |
| `/shopping-list` (top-level) | **0 inbound links anywhere** | **Fully orphan** duplicate of `/nutrition/shopping-list` |
| `/nutrition/foods` | 0 | Orphan (no link, no nav) |
| `/nutrition/goals` | 0 | Orphan |
| `/nutrition/log` | 0 | Orphan |
| `/feedback` | 0 | Orphan |
| `/ai` (AI hub) | 0 direct (sidebar jumps to `/ai/chat`) | Orphan hub |
| `/ai/settings` | 0 | Orphan |
| `/settings/backups` | 0 | Orphan |
| `/settings/data` | 0 | Orphan |
| `/settings/export` | 0 | Orphan |
| `/settings/notifications` | `notifications/page.tsx:199` | Reachable only from the notifications page |
| `/pricing` | present in upgrade CTAs | Marketing page, intentionally outside nav |

### 1b. Legitimate sub-flows (reached by an in-page action — NOT to be removed)

| Route | Reached from |
|-------|--------------|
| `/nutrition/recipes/[id]` | recipe card / modal (`/nutrition/recipes/${id}`) |
| `/progress/new` | Progress page action |
| `/progress/photos/compare` | Photos page |
| `/progress/photos/upload` | Photos page |
| `/training/exercises/[id]` | exercise list (`/training/exercises/${id}`) |
| `/training/session/[id]` | active session (`/training/session/${id}`) |
| `/workouts/[id]`, `/workouts/new` | workouts list / builder |

---

## 2. Duplicated routes

| Pair | Canonical (in nav) | Duplicate (orphan) | Notes |
|------|--------------------|--------------------|-------|
| Meal Planner | `/nutrition/meal-planner` (A) | `/meal-planner` (B) | Different slot models (4 vs 5). See `meal-planner-comparison.md`. |
| Shopping List | `/nutrition/shopping-list` | `/shopping-list` | Top-level has **0 inbound links** — pure duplicate. |

(No other true duplicates. `/ai/chat` vs `/ai-coach/chat` are distinct features,
not duplicates.)

---

## 3. Routes no longer used by any navigation flow

Routes with **zero inbound links** and **not in the sidebar** (dead to users
unless they type the URL):

- `/shopping-list` (top-level) — 0 links, duplicate.
- `/nutrition/foods`, `/nutrition/goals`, `/nutrition/log` — 0 links each.
- `/feedback` — 0 links.
- `/ai/settings` — 0 links.
- `/settings/backups`, `/settings/data`, `/settings/export` — 0 links.
- `/ai` (hub) — 0 direct links (sidebar links `/ai/chat`).

After the Phase-1 fix, `/nutrition/meal-planner` stops being an orphan (gains a
nav item). `/meal-planner` (B) remains the only planner orphan.

---

## 4. Routes safely removable AFTER Meal Planner consolidation

Ordered by confidence. "Safe" = repoint the listed inbound links first, then
delete or 301/redirect.

### Directly tied to the consolidation
1. **`/meal-planner` (B)** — remove/redirect to `/nutrition/meal-planner` **after** porting B's features (Save/Load-history, Duplicate, Copy/Paste/Clear-day, Templates — per the comparison doc). Repoint **2 inbound links**:
   - `app/(app)/ai/page.tsx:103` (`aiMealPlanner` feature card `href`)
   - `app/(app)/shopping-list/page.tsx:73` (CTA) — but this file is itself being removed (see #2).
   - Decide the **"Snack 2" data question** before removing (comparison doc §11).

### Adjacent duplicate worth removing in the same pass
2. **`/shopping-list` (top-level)** — 0 inbound links; safe to delete or redirect to `/nutrition/shopping-list`. (Its own CTA to `/meal-planner` disappears with it, simplifying #1.)

### Optional cleanup (only if you confirm they're abandoned — NOT part of Meal Planner scope)
3. `/nutrition/foods`, `/nutrition/goals`, `/nutrition/log` — 0 links. **Verify these aren't planned/half-built features before deleting.** Recommendation: either wire them into the Nutrition nav or remove; don't leave as silent orphans.
4. `/ai/settings`, `/settings/backups`, `/settings/data`, `/settings/export`, `/feedback` — 0 links. Same recommendation: surface or remove in a dedicated cleanup pass (out of Phase-2 scope).

> ⚠️ I recommend Phase-2 remove **only #1 and #2** (planner + duplicate shopping
> list). Items #3–#4 are broader product decisions — flag them, but don't fold
> them into the Meal Planner consolidation.

---

## 5. Dead components/hooks/services/utilities after removing legacy planner (B)

I traced every import in `app/(app)/meal-planner/page.tsx` and every export of
`lib/nutrition.ts`.

### Becomes unused when B is deleted
- **`Toast` (local component inside B, line 99)** — defined but **already unused
  even today** (B uses the shared `useToast`). Dies with the file. No external refs.
- **`EmptyState` (local component inside B, line 123)** — used only inside B. Dies
  with the file. No external refs.
- The `TEMPLATES` array + `PlanTemplate` type (local to B) — die with the file
  (unless the Templates feature is ported to A, in which case they move).

### Stays alive (shared — do NOT remove)
B imports only shared modules, all used elsewhere:
- `@/lib/supabase/client`, `@/components/ui/PageLoader`, `@/components/ui/Toast`,
  `next/link`, React hooks — all widely used.
- `@/lib/nutrition` (`readSlot`, `PlanSlotValue`) — used by **5 files** (A, both
  shopping lists, calendar, recipe detail). **Not** B-exclusive.

### `lib/nutrition.ts` exports currently unused by ANY page (pre-existing dead exports, unrelated to B)
These are already unused app-wide (0 references) — flag for a separate tidy, not
caused by the consolidation:
- `PlanSlotEntry` (type), `readSlotRecipeId`, `RecipeIngredientInput`,
  `RecipeMacros`, `MutationResult`, `getWeekBounds`, `mergeIngredientsIntoItems`.
  (Several are internal-only helpers or leftover public API.) **Removing B does
  not change their status.**

### No dead hooks/services/DB objects
- No custom hook or service module is tied to B.
- No `meal_plans` column, RLS policy, or migration becomes unused (the table is
  shared by A, the Calendar, and both shopping lists).

---

## 6. Consolidation checklist (so no new orphans are left)

Before/while doing Phase 2:

1. ✅ Port B's features into A (Save/Load-history, Duplicate, Copy/Paste/Clear-day, Templates→4-slot) — see comparison doc.
2. ✅ Add `Meal Planner → /nutrition/meal-planner` to the Nutrition sidebar (Phase 1).
3. ✅ Repoint `ai/page.tsx:103` `href` → `/nutrition/meal-planner`.
4. ✅ Remove/redirect **`/meal-planner` (B)**.
5. ✅ Remove/redirect **`/shopping-list` (top-level)** (0 inbound links).
6. ✅ Resolve the **"Snack 2"** data decision before deleting B.
7. ✅ Confirm no remaining `href`/`push` to `/meal-planner` or `/shopping-list` after repointing (grep should return 0).
8. ⏸️ (Separate pass, not Phase 2) decide fate of `/nutrition/foods|goals|log`, `/ai` hub, `/ai/settings`, `/settings/*`, `/feedback`.

No shared component, hook, service, or DB object is orphaned by removing B —
only B's file-local `Toast`/`EmptyState`/`TEMPLATES` go away with it.

Awaiting your go-ahead before implementing Phase 2.
