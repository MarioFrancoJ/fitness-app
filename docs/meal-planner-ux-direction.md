# Meal Planner — UX/UI Direction Audit

**Status: ANALYSIS ONLY — no code changed, no PR.** A recommendation for the
future base of the Meal Planner. Grounded in the current code of both
implementations and the shared data layer.

- **A** = `/nutrition/meal-planner` (canonical, 348 lines) — day-tabs, 4 slots, wired to Calendar/Recipes/Shopping List.
- **B** = `/meal-planner` (legacy, 632 lines) — full 7-day grid, 5 slots, Templates/Save/Load/Duplicate.

Verified facts used below:
- Neither A nor B navigates between weeks — both hardcode `getWeekDates()` to `new Date()`.
- `meal_plans` is keyed by `week_start_date`/`week_end_date` → **the DB already stores any week**; only the UI is pinned to "today".
- `meal_plans` has **no unique constraint** on `(user_id, week_start_date)` — only `idx_meal_plans_user`. Relevant to week-nav (duplicate rows possible).
- `lib/nutrition.ts` already exports `getWeekBounds(ref: Date)` and `planEntryDate()` — week math for *any* reference date already exists; the planners just don't use it.
- The Calendar already navigates via `currentDate` state + `prevMonth/nextMonth/goToday` — a proven pattern to mirror.

---

## 1. Which interface communicates "weekly planning" better?

**B, clearly.** B shows all 7 days × slots simultaneously in a grid — the mental
model of "my week" is visible at a glance, with per-day totals in-line. A shows
one day at a time behind tabs; it reads more like a "daily editor with a day
switcher" than a week view. For the *concept* of weekly planning, the
side-by-side grid (B) wins.

Caveat: B's clarity is desktop-only (it needs a 900px-min horizontal scroll);
on mobile a 7-column grid is unusable, which is exactly where A's day-tabs shine.

---

## 2. B elements that MUST be kept

1. **Full-week grid view** (7 days visible at once) — the core "weekly planning" affordance. Non-negotiable for the concept.
2. **Per-day totals inline** + **weekly totals** — makes the week scannable and goal-oriented.
3. **Templates** (fill a week by goal) — high-value speed-up; the biggest "planner" differentiator.
4. **Save Plan / Load Plan (history)** — lets users reuse weeks; core planner value.
5. **Duplicate week** — natural for "same plan next week".
6. **Copy / Paste / Clear day** — fast week-building.
7. **Empty-state with a clear CTA** ("View Recipes") — better onboarding than A's text-only empty state.

## 3. A elements that MUST be kept

1. **Route `/nutrition/meal-planner`** — the canonical URL every other surface links to (Calendar, Dashboard, Recipe detail, assignment modal).
2. **4-slot model** (Breakfast/Lunch/Dinner/Snack) — matches `lib/nutrition`, the Calendar reader, the shopping-list generator, and the assignment modal. B's 5-slot "Snack 1/2" is the outlier and must NOT be the base.
3. **Mobile-first day-tabs layout** — the only usable weekly editing pattern on phones; keep it as the small-screen mode.
4. **Integration wiring** — reads/writes `meal_plans` in the shape the rest of the app expects; servings-aware via `getSlot()`/`readSlot()`.
5. **Visual simplicity / design-system consistency** — A's cards match the current UI language; B's grid is denser and slightly off-system.

---

## 4. Proposed hybrid design

**One page at `/nutrition/meal-planner`, 4-slot data model, responsive dual-view:**

```
Meal Planner                                   [Templates] [Load] [Save]
┌─────────────────────────────────────────────────────────────────────┐
│  ‹ Prev    ●  Aug 25 – Aug 31   (This week)  ›  Next    [ Today ]     │  ← week nav bar
├─────────────────────────────────────────────────────────────────────┤
│  Weekly: 12,400 kcal · 640g P · 1,100g C · 320g F                     │  ← weekly totals
└─────────────────────────────────────────────────────────────────────┘

DESKTOP (≥ lg): full 7-column grid (B's structure, A's card styling, 4 rows)
        Mon   Tue   Wed   Thu   Fri   Sat   Sun
Break   [..]  [..]  [..]  ...
Lunch   [..]  [..]  ...
Dinner  ...
Snack   ...
Totals  [d]   [d]   ...                                   [Copy|Paste|Clear per day]

MOBILE (< lg): A's day-tabs (Mon…Sun) + the 4 slot cards for the selected day
```

**Principles:**
- **Structure from B** (whole-week grid on desktop, per-day + weekly totals, Templates/Save/Load/Duplicate, copy-paste-clear day).
- **Simplicity & styling from A** (design-system cards, calm spacing, mobile day-tabs).
- **Data model from A** (4 slots; reuse `readSlot`/`getSlot`/`getWeekBounds`).
- **A single responsive component** switches grid↔tabs at the `lg` breakpoint — not two pages.
- **Templates ported to 4 slots** (drop "Snack 2" logic).

This keeps the canonical route + integrations intact while delivering B's clearer
weekly experience.

---

## 5. Is week navigation supported by the current architecture?

**Mostly yes — it's a UI change, not an architectural one.**
- **DB: ready.** `meal_plans` is keyed by `week_start_date`/`week_end_date`; any week can be stored/queried already.
- **Helpers: ready.** `getWeekBounds(ref)` computes bounds for *any* date — the planners just call it with `now`. Swap `now` for a `selectedWeek` state.
- **What must change (UI only):** replace the hardcoded `getWeekDates()`/`new Date()` with a `selectedWeekStart` state; recompute the load/save keys from it; add a week-nav bar. Same pattern the Calendar already uses (`currentDate` + prev/next/today).

**One real gotcha (data integrity):** `meal_plans` has **no unique constraint on
`(user_id, week_start_date)`**, and B's "Duplicate" can insert multiple rows for
the same week. Both planners load with `.maybeSingle()`, which **throws if two
rows match**. Before/with week-nav, either:
- add a unique index on `(user_id, week_start_date, week_end_date)` (a small migration), or
- change loads to `.order(created_at desc).limit(1)` and dedupe.

This isn't blocking, but it should be decided when week-nav ships (navigating to a
week that has duplicate rows would currently error).

---

## 6. How to implement week navigation (UX)

Mirror the Calendar for consistency. A single week-nav bar above the grid:

```
‹ Prev Week      Aug 25 – Aug 31 · This week      Next Week ›     [ Today ]
```

- **Prev / Next Week**: arrow buttons shifting `selectedWeekStart` by ±7 days.
- **Range label**: shows the week's date range; append a subtle **"This week"**
  badge when it equals the current week (so users know where they are).
- **Today / Current Week** button: jumps back to the current week (only shown when
  not on it — like the Calendar's "Today").
- **Optional (later):** click the range label to open a small week picker
  (calendar popover) to jump to an arbitrary week. Not required for v1.
- **State persistence:** keep `selectedWeekStart` in component state (optionally
  sync to a `?week=YYYY-MM-DD` query param so a planned week is shareable/linkable,
  which also lets the Calendar's "Open planner" deep-link to the right week).
- **Auto-save semantics:** saving/editing writes to the *currently selected* week's
  row (load-or-create), same as today but keyed off `selectedWeekStart`.

**Consistency win:** Calendar navigates weeks/months; the planner should too.
Bonus: the Calendar "Open planner →" could pass the selected date so the planner
opens on that week (`/nutrition/meal-planner?week=...`).

---

## 7. Desktop layout recommendation

**Responsive dual-view (use both, by breakpoint).** Not one or the other:
- **Desktop (≥ `lg`): full 7-column week grid** (B's structure) — best for the
  weekly concept and bulk editing (copy/paste day, see the whole week).
- **Tablet/Mobile (< `lg`): day-tabs** (A's layout) — the 7-col grid is unusable
  on narrow screens; tabs keep it clean and thumb-friendly.
- Implement as one component with a Tailwind breakpoint switch (`hidden lg:grid`
  for the grid, `lg:hidden` for the tabs). Optionally a manual "grid / day" toggle
  on desktop for users who prefer focus mode.

This gives B's clarity where there's room and A's usability where there isn't.

---

## 8. Which to evolve over the next 6 months — A or B?

**Evolve from A (`/nutrition/meal-planner`), and port B's features into it.**

**Technical justification:**
- A owns the **canonical route** every other surface already links to — evolving A means zero repointing and no broken deep-links.
- A uses the **correct 4-slot model** aligned with `lib/nutrition`, the Calendar reader, the shopping-list generator, and the assignment modal. Building on B would force a 5→4 slot reconciliation across the whole app (or perpetuate the inconsistency).
- A's integrations are already wired; B would need to be re-integrated.
- Week-nav and the grid are **additive UI** on top of A (helpers already exist) — lower risk than porting A's integrations onto B.

**UX justification:**
- A's simplicity + design-system fit is the right visual baseline; B's grid and Templates/Save/Load are *features to add*, not a foundation to inherit.
- Users reach the planner through Nutrition/Calendar/Recipes — all pointing at A. Evolving A keeps the mental model stable while it gains B's power.

**Net:** A is the foundation (route, data, integrations, mobile UX); B is the
feature donor (grid view, Templates, Save/Load, Duplicate, copy/paste/clear).
The hybrid in §4 is the target. B is retired only after its features live in A
(that's the separately-approved Phase 2 consolidation — not part of this audit).

---

## Summary recommendation

| Question | Answer |
|----------|--------|
| Better weekly concept | **B** (full grid) — but desktop-only |
| Keep from B | Grid view, per-day/weekly totals, Templates, Save/Load, Duplicate, copy/paste/clear day, empty-state CTA |
| Keep from A | Route, 4-slot model, mobile day-tabs, integrations, visual simplicity |
| Hybrid | One responsive page: B's grid (desktop) + A's tabs (mobile), A's data model & styling |
| Week nav supported? | Yes at DB/helper level; UI change only. Watch the missing `(user_id, week_start_date)` unique constraint |
| Week-nav UX | Prev/Next + range label + "Today", optional `?week=` deep-link, mirror the Calendar |
| Desktop layout | Responsive dual-view (grid ≥ lg, tabs < lg) |
| Evolve from | **A**, port B's features in |

No implementation performed. Awaiting your direction before any build work.
