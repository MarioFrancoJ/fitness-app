# Meal Planner — Technical & UX Comparison (for canonical decision)

**Status: COMPARISON ONLY — nothing implemented.** This informs the Phase 2
consolidation decision. No consolidation will happen until you approve a
canonical implementation.

Two implementations exist, both `"use client"`, both reading/writing the **same
`meal_plans` table**:

- **A** = `/nutrition/meal-planner` — `app/(app)/nutrition/meal-planner/page.tsx` (348 lines)
- **B** = `/meal-planner` (top-level) — `app/(app)/meal-planner/page.tsx` (632 lines)

---

## 1. Features available

| Feature | A `/nutrition/meal-planner` | B `/meal-planner` |
|--------|------------------------------|-------------------|
| Assign recipe to a day/slot | ✅ (day tabs, one day at a time) | ✅ (full 7-day grid, all days visible) |
| Meal slots | **4** — Breakfast, Lunch, Dinner, **Snack** | **5** — Breakfast, Lunch, Dinner, **Snack 1, Snack 2** |
| Per-slot **servings** (read + macro math) | ✅ via `getSlot()` (×servings) | ✅ via `readSlot()` (×servings) |
| Per-day macro totals | ✅ (selected day) | ✅ (every day column) |
| Weekly macro totals | ✅ | ✅ |
| Layout | Day-tab + 2-col cards (mobile-first) | Full weekly grid, horizontal scroll (desktop-first) |
| **Templates** (fill week by goal) | ❌ | ✅ (`TEMPLATES`: Fat Loss / Maintenance / Muscle Gain) |
| **Save named/explicit plan** (`is_saved`) | ⚠️ implicit (always inserts `is_saved:true`) | ✅ explicit "Save Plan" button |
| **Load a saved plan** (history, last 10) | ❌ | ✅ "Load Plan" modal |
| **Duplicate** plan | ❌ | ✅ |
| **Copy / Paste / Clear day** | ❌ | ✅ |
| Clear week | ✅ | ✅ |
| Empty state (no recipes) → link to Recipes | ⚠️ text only, no link | ✅ "View Recipes" CTA |
| Toast feedback | ✅ (`useToast`) | ✅ (`useToast` + a local `Toast` component, unused/duplicate) |

**B is materially richer** (templates, save/load history, duplicate,
copy/paste/clear-day). **A is simpler and more mobile-friendly** (day tabs vs. a
900px-min grid).

---

## 2. Database tables used

**Identical.** Both use only **`meal_plans`** (`user_id`, `week_start_date`,
`week_end_date`, `plan_data` JSONB, `is_saved`) and read **`recipes`** for the
dropdown/macros. Both use `readSlot()` / `PlanSlotValue` from `lib/nutrition.ts`,
so the stored blob is interchangeable — **with one caveat (see §11 slot
mismatch).** No other tables touched by either.

---

## 3. Queries & mutations

| | A | B |
|--|--|--|
| Load recipes | `recipes.select("id,name,calories,protein,carbs,fat")` | `recipes.select("id,name,goal,calories,protein,carbs,fat")` (also `goal`, for templates) |
| Load current week | `meal_plans.select("id, plan_data").eq(user).eq(start).eq(end).maybeSingle()` | same + `week_start_date, week_end_date, is_saved` |
| Save (update) | `meal_plans.update({plan_data}).eq(id)` | `meal_plans.update({plan_data, is_saved?}).eq(id)` |
| Save (insert) | `insert({user, start, end, plan_data, is_saved:true})` | `insert({..., is_saved})` |
| Load saved history | ❌ | `meal_plans.select(...).eq(is_saved,true).order(week_start_date desc).limit(10)` |
| Duplicate | ❌ | `insert({...current plan..., is_saved:true})` |

Both auto-save on each slot change. B adds explicit save/load/duplicate mutations.

---

## 4. Calendar integration

- **Neither planner reads the Calendar.** The Calendar reads `meal_plans` itself.
- The Calendar's "Open planner →" links to **A** (`/nutrition/meal-planner`).
- The Calendar reader (`readSlot` + canonical `MEAL_SLOTS = Breakfast/Lunch/Dinner/Snack`) matches **A's 4-slot vocabulary**. **B's "Snack 1"/"Snack 2" are NOT canonical** — a recipe placed in B's "Snack 2" is still readable by the Calendar (it walks all slot keys), but it won't align with the 4-slot model used elsewhere (e.g. the assignment modal writes "Snack").

**Verdict: A is Calendar-consistent; B introduces slot drift.**

---

## 5. Recipe integration

- Both populate their recipe dropdown from `recipes` and compute macros from it.
- The **Recipe detail page** and the **assignment modal** (`MealPlanModal`) write
  plans using the canonical 4 slots and link users to **A**
  (`/nutrition/meal-planner`). Recipe card "+ Meal Plan" → modal → writes 4-slot.
- Neither planner links back out to recipe detail (that's a separate Phase-1 item
  on the Calendar side).

**Verdict: the recipe→plan flow already standardizes on A's 4-slot model.**

---

## 6. Shopping List integration

- **Neither planner reads/writes the shopping list.** The shopping-list pages read
  `meal_plans.plan_data` themselves (via `readSlot`, summing servings).
- The **canonical** shopping list (`/nutrition/shopping-list`) "Generate from Meal
  Plan" reads the current-week `meal_plans` row — agnostic to which planner wrote
  it, but again aligned to the 4-slot model.
- The **top-level** `/shopping-list` (a duplicate) is the one that links to **B**.

**Verdict: shopping-list generation works off `meal_plans` regardless; the 4-slot
(A) model is what the canonical shopping list expects.**

---

## 7. AI integration

- **Neither planner calls AI.** No OpenAI/generate/prompt logic in either file.
- The only "AI" tie is a **feature card** on `/ai` labeled "AI Meal Planner"
  (`href: "/meal-planner"` → **B**), gated behind the `aiMealPlanner` flag which
  **defaults to `false`**. B's "Templates" are **not** AI — they're static
  goal-based filters.

**Verdict: there is no real AI functionality in either planner. The AI page's
link to B is a stub pointing at a non-AI page; if B is retired, that link must be
repointed (or the flag/card removed).**

---

## 8. Which one the Calendar uses
**A** — `/nutrition/meal-planner` (`calendar/page.tsx` line 738, "Open planner →").

## 9. Which one the Dashboard uses
**A** — `/nutrition/meal-planner` (`DashboardContent.tsx` lines 602 & 645, the
"Next Meal" card header + CTA).

**So the two most important surfaces (Calendar + Dashboard) already point to A.**
B is referenced only by: the AI feature card (line 103) and the duplicate
top-level shopping list (line 73).

---

## 10. Recommendation — canonical implementation

### Recommended canonical route: **A — `/nutrition/meal-planner`**
Reasons:
1. **Already the app's real destination** — Calendar, Dashboard, Recipe detail and the assignment modal all point to A.
2. **Correct slot model** — its 4 slots match `lib/nutrition.ts` `MEAL_SLOTS`, the Calendar reader, the shopping-list generator, and the assignment modal. B's 5-slot "Snack 1/2" is the odd one out and would require reconciling everywhere.
3. **Fits your proposed IA** — `Nutrition → Meal Planner` maps naturally to `/nutrition/meal-planner`; no route rename needed.
4. **Mobile-friendly** — day-tab layout vs. B's 900px-min horizontal grid.

### But A must absorb B's best features before B is retired
A is the right *foundation and route*, but B has genuinely useful capabilities A lacks. Recommended plan: **keep route A, port B's features into it, then retire B.**

Port into A (priority order):
1. **Explicit Save + Load saved plans (history)** — B's `is_saved` UX + last-10 modal. (High — it's the main "planner" value B adds.)
2. **Duplicate plan** — one insert. (Medium)
3. **Copy / Paste / Clear day** — B's clipboard helpers. (Medium)
4. **Templates (goal-based week fill)** — port, but map to A's **4 slots**. (Medium)
5. **Empty-state "View Recipes" CTA** — trivial. (Low)
6. Optional: a full-week grid *view toggle* for desktop (B's strength), keeping A's day-tabs as the mobile default. (Low/nice-to-have)

---

## 11. Functionality that would be LOST if B is removed as-is (without porting)

If `/meal-planner` (B) is deleted/redirected **without** porting, these are lost:

| Lost capability | Severity | Mitigation |
|-----------------|----------|------------|
| **Templates** (fill a week by goal) | Medium | Port to A (map to 4 slots) |
| **Save + Load saved plans** (history, last 10) | **High** | Port to A — this is B's core extra value |
| **Duplicate plan** | Medium | Port to A (single insert) |
| **Copy / Paste / Clear individual day** | Medium | Port to A |
| **Full 7-day grid** view (see whole week at once) | Low–Medium | Optional desktop view toggle in A |
| **5th meal slot ("Snack 2")** | Low | Intentional — canonical model is 4 slots; existing data in "Snack 2" would remain in the blob but wouldn't render in A. **Data-migration note below.** |
| Empty-state "View Recipes" CTA | Low | Trivial to add to A |

**Data note (Snack 2):** any existing plans that used B's "Snack 2" store that
recipe under a `"Snack 2"` key in `plan_data`. A only renders `Breakfast/Lunch/
Dinner/Snack`, so a "Snack 2" entry would become invisible in A (not deleted —
just unrendered). Before retiring B, decide: (a) accept it (low usage likely), or
(b) run a one-time migration folding "Snack 2" → "Snack" (or dropping it). This
should be an explicit decision, not silent.

**Nothing unique in the DB layer, Calendar, Recipe, Shopping List, or AI wiring
would be lost** — those all live outside the planners and already favor A.

---

## 12. Summary recommendation

- **Canonical:** **A — `/nutrition/meal-planner`** (route + 4-slot model).
- **Before retiring B:** port Save/Load-history (high), then Duplicate,
  Copy/Paste/Clear-day, Templates (4-slot), and the empty-state CTA.
- **Repoint B's inbound links:** AI feature card (`/ai` line 103) and top-level
  `/shopping-list` CTA (line 73) → `/nutrition/meal-planner`.
- **Decide the "Snack 2" data question** explicitly before removal.
- Then redirect/delete `/meal-planner`.

Awaiting your decision on the canonical implementation before any consolidation.
