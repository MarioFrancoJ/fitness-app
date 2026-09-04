# Navigation Audit — Calendar / Meal Planner & Orphan Pages

**Status: AUDIT ONLY — nothing implemented.** Awaiting your review of the
proposed structure before any code changes.

Scope: verify the Calendar → Meal Planner flow, confirm the reported issues,
inventory every route vs. what the sidebar exposes, and propose a navigation
architecture that matches your preferred direction.

---

## 1. The reported issues — confirmed

All four points are real:

| # | Issue | Confirmed in code |
|---|-------|-------------------|
| 1 | Calendar shows a "Planned Meals" section | `calendar/page.tsx` renders it from `meal_plans` |
| 2 | "Open planner" → a Meal Planner page | `calendar/page.tsx` links to `/nutrition/meal-planner` |
| 3 | Meal Planner is **not** in the sidebar | `Sidebar.tsx` Nutrition items = Meals / Recipes / Shopping List only |
| 4 | Planned meal items are **not clickable** | rendered as a plain `<div>`, no `Link`/`onClick` |

**Extra finding (important):** there are **two** meal-planner pages, which is the
root of the confusion:
- `/nutrition/meal-planner` — the one the app actually links to (Calendar, Dashboard, Recipe detail). 4 slots (Breakfast/Lunch/Dinner/Snack), matches the shared slot model in `lib/nutrition.ts`.
- `/meal-planner` (top-level) — a second, feature-richer page (weekly templates, 5 slots incl. "Snack 1/2", `is_saved`). Linked only from the AI page and the (also-duplicated) top-level shopping list. Its 5-slot vocabulary does **not** match the Calendar/helpers.

---

## 2. Full route → sidebar cross-reference (orphan analysis)

**Sidebar exposes:** Dashboard · Training(6) · Nutrition(Meals, Recipes, Shopping List) · Progress(Overview, Weight, Measurements, Photos) · Calendar · AI(AI Chat, AI Coach, Recommendations) · Account(Profile, Subscription).

### Orphan pages (reachable but NOT in any sidebar section)

| Route | How it's reached today | Severity | Notes |
|-------|------------------------|----------|-------|
| `/nutrition/meal-planner` | Calendar "Open planner", Dashboard "Next Meal", Recipe detail prose | **High** | The most-linked nutrition page with no nav entry — the core issue |
| `/meal-planner` (top-level) | AI page feature card, top-level shopping-list CTA | **High** | Duplicate planner; different slot model |
| `/shopping-list` (top-level) | AI page / its own CTA | Medium | Duplicate of `/nutrition/shopping-list` (which IS in nav) |
| `/nutrition/foods` | internal nutrition flows | Medium | Not surfaced anywhere in nav |
| `/nutrition/goals` | internal nutrition flows | Medium | Not surfaced |
| `/nutrition/log` | internal nutrition flows | Medium | Not surfaced |
| `/ai` (AI hub/landing) | — | Medium | Sidebar links `/ai/chat` directly and skips the hub |
| `/ai/settings` | AI pages | Low | Sub-setting |
| `/ai-coach/chat` | AI Coach page | Low | Sub-flow of AI Coach |
| `/settings/backups`, `/settings/data`, `/settings/export`, `/settings/notifications` | — | Medium | Account matchPrefix highlights `/settings` but exposes NO settings links |
| `/feedback` | — | Low | No nav link at all |
| `/notifications` | notification bell (topbar) | Low | Covered by AI matchPrefix for highlight only |
| `/pricing` | marketing/upgrade CTAs | Low | Intentionally outside main nav |

### Legitimate sub-flows (dynamic/nested — NOT orphans, expected to be reached by action)
`/nutrition/recipes/[id]`, `/progress/new`, `/progress/photos/compare`, `/progress/photos/upload`, `/training/session/[id]`, `/training/exercises/[id]`, `/workouts/new`, `/workouts/[id]`. These are reached by clicking an item/CTA and don't need their own nav entry.

---

## 3. Calendar → Planner flow — technical detail

`calendar/page.tsx` `loadData()` reads `meal_plans` for the visible month,
resolves each `plan_data[day][slot]` via `readSlot()`, maps day→date via
`planEntryDate()`, and **batch-fetches recipe names** (`recipes.select("id,name")`).
Internally it builds `entries` = `{ date, slot, recipeId, servings }` — **the
`recipeId` IS available**. But when pushing into the day's activity it drops it:

```ts
day.plannedMeals.push({ slot: e.slot, name, servings: e.servings }); // recipeId lost here
```

`DayActivity.plannedMeals` is typed `{ slot; name; servings }[]` (no id), and the
render is a plain non-clickable `<div>`.

**Making planned meals clickable → recipe detail is a 3-line plumbing change:**
1. add `recipeId` to the `plannedMeals` type,
2. include it in the `push({...})`,
3. wrap the render row in `<Link href={/nutrition/recipes/${pm.recipeId}}>`.
All data is already fetched — no extra query.

---

## 4. Proposed navigation architecture (your preferred direction)

### 4.1 Add Meal Planner to the Nutrition section
```
Nutrition
├── Meals            → /nutrition
├── Recipes          → /nutrition/recipes
├── Meal Planner     → /nutrition/meal-planner   ← NEW (first-class)
└── Shopping List    → /nutrition/shopping-list
```
Mechanically this is one new `NavItem` in the Nutrition `items` array in
`Sidebar.tsx`. No `matchPrefix` change needed (`/nutrition` already covers it for
section highlighting; `isItemActive` exact-matches the new href). It appears in
both the expanded list and the collapsed popover automatically.

Suggested order: **Meal Planner between Recipes and Shopping List** — it mirrors
the natural workflow (browse recipes → plan the week → generate the shopping
list). (You listed it last; either order is fine — I recommend this because
Shopping List is generated *from* the plan.)

### 4.2 Canonical planner: consolidate on `/nutrition/meal-planner`
Reasons: it's already the link target across the app, its 4-slot vocabulary
matches `lib/nutrition.ts` and the Calendar reader. Recommended:
- Make `/nutrition/meal-planner` the single source of truth.
- Fold the richer features from the top-level `/meal-planner` (weekly
  **templates**, **save state**) into it *if desired*.
- **Retire `/meal-planner`** (top-level): either delete it or make it a redirect
  to `/nutrition/meal-planner`, and repoint its two inbound links (AI page,
  top-level shopping-list CTA).

### 4.3 Calendar wiring
- "Open planner" → keep pointing to `/nutrition/meal-planner` (now a real nav
  destination, so no more orphan).
- Planned meal entries → make each a `Link` to `/nutrition/recipes/[id]`
  (plumbing in §3).

### 4.4 Secondary cleanups (recommend, but out of the core ask)
- **Shopping List duplicate:** retire/redirect top-level `/shopping-list` →
  `/nutrition/shopping-list` (already in nav). Repoint its inbound links.
- **Settings orphans:** the Account section highlights `/settings` but exposes no
  settings links. Either add a "Settings" item (and children) or leave as-is if
  settings are reached elsewhere — flag for a future pass.
- **AI hub `/ai`:** sidebar jumps straight to `/ai/chat`. Consider linking `/ai`
  (hub) or leaving as-is intentionally.
- `/nutrition/foods`, `/nutrition/goals`, `/nutrition/log`: decide whether these
  belong under Nutrition as items or remain internal flows.

---

## 5. Impact & priority

| Change | Impact | Effort | Priority |
|--------|--------|--------|----------|
| Add **Meal Planner** to Nutrition nav | Fixes the main orphan; discoverable | Trivial (1 nav item) | **High** |
| Planned meals **clickable → recipe** | Removes dead-end; natural flow | Small (3-line plumbing + Link) | **High** |
| "Open planner" points to canonical planner | Consistency | None (already correct) / repoint if consolidating | **High** |
| Consolidate two planners → retire `/meal-planner` | Removes duplicate/confusion & slot mismatch | Medium (redirect + repoint 2 links; optional feature fold-in) | **Medium** |
| Retire duplicate top-level `/shopping-list` | Removes duplicate | Small (redirect + repoint 2 links) | Medium |
| Settings / AI-hub / foods-goals-log nav decisions | Completeness | Varies | Low |

---

## 6. Recommended execution order (once approved)

1. **Phase 1 (the core ask, low risk):**
   - Add `Meal Planner → /nutrition/meal-planner` to the Nutrition sidebar section.
   - Make Calendar planned-meal entries link to `/nutrition/recipes/[id]`.
   - Confirm "Open planner" → `/nutrition/meal-planner`.
2. **Phase 2 (de-duplication):**
   - Redirect top-level `/meal-planner` → `/nutrition/meal-planner` (optionally fold in templates/save), repoint AI + shopping-list links.
   - Redirect top-level `/shopping-list` → `/nutrition/shopping-list`, repoint links.
3. **Phase 3 (completeness pass):** decide on Settings, AI hub, and foods/goals/log nav placement.

Awaiting your approval of this structure before implementing.
