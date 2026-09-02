# Recipes UX/UI Audit

Scope: `Nutrition → Recipes` (list) and the recipe detail page. This is an
**audit only** — no changes implemented beyond removing the macro icons
(Priority 1, done separately). Findings are grounded in the current code and
the live data (12 recipes; 3 currently have images).

Files reviewed:
- `app/(app)/nutrition/recipes/page.tsx` (list + card)
- `app/(app)/nutrition/recipes/[id]/page.tsx` (detail)

Legend — **Impact**: how much users feel it · **Effort**: build cost ·
**Priority**: recommended order.

---

## 1. Recipe Cards (list)

### Problems found

| # | Problem | Impact | Priority |
|---|---------|--------|----------|
| C1 | **Hover is weak** — only `shadow-sm → shadow-md`. No lift, no image zoom, no border accent. The whole card is clickable but doesn't feel interactive. | Medium | **High** |
| C2 | **No visual feedback that the image is a link** vs. the buttons. Image, title and CTAs all navigate, but there's no affordance hierarchy. | Low | Medium |
| C3 | **Prep-time / servings / ingredients meta is very low-contrast** (`zinc-400`, 12px) and easy to miss. Prep time especially is a key scanning signal. | Medium | Medium |
| C4 | **No difficulty indicator** and **no favorite affordance** — cards feel informational, not "premium recipe app". | Medium | Medium |
| C5 | **Placeholder cards** (9 of 12 recipes) still show a flat grey box. Acceptable, but a subtle food-themed placeholder would raise perceived quality. | Low | Low |
| C6 | **Card vertical rhythm** — the gap between the meta line and the nutrition block is tight (`mt-golden-2`), while the CTA row has more air. Slightly uneven. | Low | Low |
| C7 | **Goal badge over the image** can collide with a busy photo's focal point (top-left). Contrast relies on a solid pill; over bright images it's fine, over pale images the text can wash out. | Low | Medium |

### Opportunities

- **Modern hover (C1):** on hover, lift the card (`-translate-y-0.5` + stronger shadow) and **zoom the image ~4–6%** (`scale-105` with `overflow-hidden` + `transition`). This is the single highest-impact "premium" cue and is pure CSS. *(High)*
- **Elevate meta scanability (C3):** small inline markers for time (clock) + a difficulty pill, in slightly higher contrast (`zinc-500`). *(Medium)*
- **Difficulty indicator (C4):** e.g. `Easy / Medium / Hard` derived pill or dots. **Requires a `difficulty` column on `recipes` (migration)** — the field does not exist today. *(Medium, needs backend)*
- **Prep-time chip (C4):** already have `prep_time`; promote it to a small chip on the image corner (like meal-type) for instant scanning. *(Medium, CSS-only)*
- **Favorites ❤️ (C4):** heart toggle on the card. **Requires a `recipe_favorites` table (user_id, recipe_id) + RLS (migration)** — none exists today. *(Medium, needs backend)*
- **Gradient scrim behind on-image badges (C7):** a subtle top gradient so pills stay legible over any photo. *(Low, CSS-only)*

### Expected impact
Hover + prep/difficulty chips move the cards from "catalog" to "modern recipe
app" with minimal risk. Favorites + difficulty add real product value but need
schema work.

---

## 2. Recipe Detail Page

### Problems found

| # | Problem | Impact | Priority |
|---|---------|--------|----------|
| D1 | **Image is underused** — fixed `h-56` (224px) full-width strip. On desktop this is a short banner; the photo (the most premium asset) doesn't anchor the page. | High | **High** |
| D2 | **No hero layout** — header (title/badges), image, and nutrition are three stacked full-width blocks. Lots of vertical scrolling before content; poor use of desktop horizontal space. | High | **High** |
| D3 | **Nutrition facts = 4 equal cards** in a row; calories don't dominate (same size/weight as macros), inconsistent with the new card hierarchy on the list. | Medium | Medium |
| D4 | **Ingredients & instructions are 50/50 columns** on `lg`. Instructions (long text) get cramped while ingredients (short) waste width. | Medium | Medium |
| D5 | **No prep-time / servings / difficulty at a glance** near the title — they're a faint meta line; the "how long / how hard / how many" scan is weak. | Medium | Medium |
| D6 | **No favorite / save action** on detail either. | Low | Medium |
| D7 | **Placeholder image block** is a large empty grey area on recipes without a photo — exactly what the list redesign tried to avoid. | Low | Medium |
| D8 | **Description sits in the header** as small grey text; on a premium page it deserves more room / better typographic treatment. | Low | Low |

### Opportunities

- **Hero image layout (D1/D2):** make the photo a real hero — either a tall
  full-width hero (`h-72`/`h-80` on desktop, 16:9) **with the title, goal,
  prep-time and servings overlaid on a gradient scrim**, or a **two-column
  hero** (image left ~55%, key facts + primary CTA right) on `lg`. Biggest
  single lift to perceived quality. *(High, CSS-only)*
- **Calories-first nutrition (D3):** promote calories to a large primary stat
  and render P/C/F as a secondary row (mirror the list card hierarchy for
  consistency). *(Medium, CSS-only)*
- **Rebalance content columns (D4):** give instructions ~60% and ingredients
  ~40% on desktop (`lg:grid-cols-5` → 2/3), or stack ingredients as a compact
  card and let instructions breathe. *(Medium, CSS-only)*
- **At-a-glance fact strip (D5):** a row of quiet stat chips under the title —
  ⏱ prep time · 🍽 servings · 🔥 calories · (difficulty). *(Medium; difficulty
  needs backend)*
- **Favorite on detail (D6):** heart button in the hero. *(Medium, needs the
  same favorites table as C4)*
- **Better placeholder (D7):** shorter, food-themed, or hide the hero and lead
  with the fact strip when there's no image. *(Low, CSS-only)*

### Expected impact
The hero + calories-first + column rebalance make the detail page feel like a
premium recipe app and dramatically improve desktop space usage — all
CSS-only, low risk.

---

## 3. Proposed improvements — consolidated & prioritized

### High priority (CSS-only, low risk, high perceived value)
1. **Card hover polish** — lift + image zoom + subtle border/shadow. *(C1)*
2. **Detail hero image** — tall/overlaid or two-column hero; stop the short-banner look. *(D1/D2)*
3. **Calories-first nutrition on detail** — match the list card hierarchy. *(D3)*

### Medium priority
4. **Prep-time chip on cards** + **at-a-glance fact strip on detail** (uses existing `prep_time`). *(C4/D5)*
5. **Rebalance ingredients/instructions columns** on desktop. *(D4)*
6. **Gradient scrim** behind on-image badges for legibility. *(C7/D7)*
7. **Difficulty indicator** — needs a `difficulty` enum column on `recipes` (migration) + admin field to set it. *(C4/D5, backend)*
8. **Favorites ❤️** — needs a `recipe_favorites` table (`user_id`, `recipe_id`, unique) + RLS, a heart toggle on card & detail, and optionally a "Favorites" filter. *(C4/D6, backend)*

### Low priority
9. **Better/food-themed placeholder** for imageless recipes. *(C5/D7)*
10. **Vertical rhythm tidy-up** on the card. *(C6)*
11. **Description typography** on detail. *(D8)*

---

## 4. What needs backend vs. pure CSS

| Improvement | Backend change? |
|-------------|-----------------|
| Hover effects, hero layout, calories-first, column rebalance, chips, scrim, placeholder | **No** — CSS/markup only |
| Prep-time chip / fact strip | **No** — `prep_time` already exists |
| **Difficulty indicator** | **Yes** — add `difficulty` enum to `recipes` + admin UI to set it |
| **Favorites ❤️** | **Yes** — new `recipe_favorites` table + RLS + toggle wiring |

---

## Recommended execution order

1. **Phase 1 (CSS-only, ship together):** card hover, detail hero, calories-first detail, column rebalance, prep-time chip, scrim, placeholder. Highest premium lift, zero data risk.
2. **Phase 2 (needs migration):** difficulty indicator (schema + admin field + display).
3. **Phase 3 (needs migration):** favorites system (table + RLS + heart toggles + optional filter).

Awaiting your review before implementing any of the above.
