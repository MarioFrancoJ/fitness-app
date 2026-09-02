# Meal Planner — Final Closure Plan

**Status: AUDIT & PLAN ONLY — no code, no PR.** Goal: make
`/nutrition/meal-planner` (Planner **A**) the single official Meal Planner,
port Planner **B**'s valuable features, ship the hybrid desktop/mobile view,
retire B and the duplicate shopping list, and leave Nutrition stable — then move
to i18n (ES/EN).

Baseline verified in code (post week-nav merge):
- **A** `/nutrition/meal-planner` — 443 lines, 4 slots, week navigation, wired to Calendar/Recipes/Shopping List.
- **B** `/meal-planner` — 632 lines, 5 slots (Snack 1/2), Templates/Save/Load/Duplicate/Copy/Paste/Clear-day.
- **Inbound links to B (to repoint):** `ai/page.tsx:103` (feature card), `shopping-list/page.tsx:73` (top-level dup CTA).
- **DB:** migration 00012 already added the unique index on `meal_plans(user_id, week_start_date, week_end_date)`; A's load is duplicate-tolerant.

---

## 1. Exact scope

### IN scope
1. **Port B's features into A** (4-slot model, canonical route):
   - Templates (goal-based week fill → 4 slots)
   - Save Plan
   - Load Plan
   - Duplicate Week
   - Copy Day / Paste Day / Clear Day
2. **Hybrid responsive view** on A:
   - Desktop (≥ `lg`): full 7-day grid (B's structure, A's styling, 4 rows)
   - Mobile (< `lg`): day-tabs (A's current layout)
3. **Consolidation:**
   - Repoint B's 2 inbound links → `/nutrition/meal-planner`
   - Remove/redirect `/meal-planner` (B)
   - Remove/redirect duplicate top-level `/shopping-list` (0 inbound links; opportunistic)
   - Validate Calendar, Recipes, Shopping List still work end-to-end
4. **Regression-safe cleanup:** delete B's now-dead file-local code (its local `Toast`, `EmptyState`, `TEMPLATES`, 5-slot constants) by deleting the file.

### OUT of scope (explicitly NOT in this phase)
- ❌ Monthly view
- ❌ Generative AI (the `aiMealPlanner` flag/card stays a stub → just repoint its link)
- ❌ Drag & drop
- ❌ New tables
- ❌ New data models (reuse `meal_plans` + `plan_data` + `readSlot`/`PlanSlotValue` + `is_saved`)
- ❌ Touching the broader orphans (`/nutrition/foods|goals|log`, `/ai` hub, `/settings/*`, `/feedback`) — separate pass, not part of closing Meal Planner

---

## 2. Key risks (and mitigations)

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | **`is_saved` semantics conflict.** A already writes `is_saved: true` on every auto-save. B's "Load Plan" lists `is_saved = true` rows. If ported as-is, Load Plan would list *every* week the user ever touched, not just deliberately saved ones. | **High** | Decide the model: (a) A auto-saves as `is_saved: false` (draft) and only the explicit **Save Plan** sets `true`; Load Plan lists `is_saved=true`. This is the clean fix and matches B's intent. Requires flipping A's insert default to `false`. Existing rows stay `true` (acceptable, or a one-time backfill). |
| R2 | **"Snack 2" data invisibility.** Any B-created plan using "Snack 2" holds a recipe under a key A doesn't render. | Medium | Decide explicitly: (a) accept (unrendered, not deleted); or (b) one-time data migration folding `Snack 2` → `Snack` where `Snack` is empty. Recommend (a) for now (likely near-zero usage), document it. |
| R3 | **Duplicate Week + unique index.** B's Duplicate inserts a row for the *current* week; with the new unique index, duplicating into a week that already has a row will fail. | Medium | Redefine "Duplicate Week" for A as **"copy this week's plan into the NEXT empty week"** (or a chosen target week via the week-nav), using upsert/load-or-create — not a blind insert. Avoids the constraint violation and is better UX. |
| R4 | **Templates overwrite silently.** Applying a template replaces the whole week. | Low | Confirm before applying when the week is non-empty (simple confirm dialog / toast with undo-less warning). |
| R5 | **Regression in Calendar/Shopping List reads.** They read `plan_data` via `readSlot`; as long as A keeps writing 4-slot structured values, they're unaffected. | Low | Post-change validation checklist (§5). Do NOT change the write shape. |
| R6 | **Grid responsiveness / layout regressions** on the new desktop grid. | Low | Reuse B's grid markup but restyle to A's design system; test at `sm/md/lg/xl` + collapsed sidebar. |
| R7 | **Dead links after removing B.** | Low | Grep gate: 0 references to `/meal-planner` and `/shopping-list` (top-level) before deleting. |
| R8 | **Toast provider dependency.** A uses `useToast` (mounted in AppShell) — fine. B's local `Toast` is unused; dies with the file. | None | N/A |

---

## 3. Dependencies

- **DB:** none new. `meal_plans` + `is_saved` already exist; unique index (00012) already applied. R1 may flip A's insert default (code-only, no schema change).
- **Shared code:** `lib/nutrition.ts` (`readSlot`, `PlanSlotValue`, `getWeekBounds`) — already used by A; no change needed.
- **Recipes:** A must additionally select `goal` (for Templates) — B already does; trivial query change.
- **UI:** `useToast` (AppShell), design-system primitives. No new deps.
- **Inbound links:** `ai/page.tsx:103`, `shopping-list/page.tsx:73` must be repointed before/with B removal.
- **Ordering dependency:** week-navigation (already shipped) is the foundation Duplicate-to-target-week (R3) builds on.

---

## 4. Recommended implementation order (exact)

Each step is independently shippable (own PR), lowest-risk first, so Nutrition
stays stable throughout. Nothing here opens a new front beyond Meal Planner.

**Step 0 — Decisions to lock before coding** (no code):
- R1: adopt draft-vs-saved `is_saved` model? (recommended: yes)
- R2: accept "Snack 2" as unrendered, or backfill? (recommended: accept + document)
- R3: Duplicate = "copy into next empty week"? (recommended: yes)

**Step 1 — Day tools (lowest risk, pure UI on current layout):**
Copy Day / Paste Day / Clear Day (+ keep existing Clear Week). No schema, no new
reads. Ships on A's current tab layout.

**Step 2 — Templates:**
Add `goal` to A's recipe query; port `applyTemplate` mapped to **4 slots**; add a
confirm when the week is non-empty (R4). Templates modal reusing A's styling.

**Step 3 — Save / Load / Duplicate (the `is_saved` step — do together):**
- Implement R1: A auto-saves as `is_saved:false`; explicit **Save Plan** sets `true`.
- **Load Plan** modal lists `is_saved=true` plans (history).
- **Duplicate Week** = copy current plan into next empty week (R3), load-or-create.
- This is the highest-risk step → its own PR, tested in isolation.

**Step 4 — Hybrid responsive view:**
Add the desktop 7-day grid (`hidden lg:grid`) alongside the existing day-tabs
(`lg:hidden`), both driven by the same state and 4-slot model. Optional desktop
"grid/day" toggle. No data changes.

**Step 5 — Consolidation & retirement:**
- Repoint `ai/page.tsx:103` → `/nutrition/meal-planner`.
- Repoint (or remove) `shopping-list/page.tsx:73`.
- Remove/redirect **`/meal-planner` (B)** (delete the page; optional 308 redirect).
- Remove/redirect duplicate **`/shopping-list`** (top-level) → `/nutrition/shopping-list`.
- Grep gate (R7): 0 refs to the removed routes.

**Step 6 — Final validation (see §5), then Meal Planner is CLOSED.**

> Alternative if you prefer fewer PRs: Steps 1–2 in one PR, Step 3 alone, Step 4
> alone, Step 5 alone. Keep Step 3 and Step 5 isolated — they carry the risk.

---

## 5. Validation checklist (run after Step 5)

- [ ] `/nutrition/meal-planner`: add/remove recipe, servings, day totals, weekly totals, week nav (prev/next/today) all work per week.
- [ ] Copy/Paste/Clear day + Clear week behave and persist to the correct week.
- [ ] Templates fill 4 slots; confirm-on-nonempty works.
- [ ] Save marks saved; Load lists only saved plans; Duplicate lands in an empty week (no unique-index error).
- [ ] Desktop shows the grid (≥ lg); mobile shows day-tabs (< lg); collapsed sidebar OK.
- [ ] **Calendar** "Planned Meals" still render + link to recipe detail; "Open planner" still lands on A.
- [ ] **Shopping List** "Generate from Meal Plan" still aggregates the current week correctly (4-slot).
- [ ] **Recipes** "+ Meal Plan" modal still writes plans A reads.
- [ ] `grep` returns 0 for `/meal-planner` and top-level `/shopping-list` links.
- [ ] `tsc` clean, `build` 67 pages minus removed routes (expect 65).

---

## 6. Definition of Done (Meal Planner closed)

- Single official planner at `/nutrition/meal-planner` with all valuable B
  features, hybrid responsive view, 4-slot model, week nav.
- `/meal-planner` and duplicate `/shopping-list` gone/redirected; no dead links.
- Calendar/Recipes/Shopping List validated.
- No monthly view, no AI, no drag&drop, no new tables/models introduced.
- Then: begin **i18n ES/EN** as the next front.

Awaiting your decisions on Step 0 (R1/R2/R3) before any implementation.
