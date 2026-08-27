# Golden Ratio Design System (φ = 1.618)

This project uses a golden ratio–based scale for typography, spacing, sizing, and border radius. All tokens are defined in `app/globals.css` inside the `@theme inline` block.

## Principle

Every visual relationship should approximate φ (1.618) or its integer Fibonacci equivalents (5, 8, 13, 21, 34, 55, 89). This creates harmonic proportions without requiring manual tuning per component.

## Token Reference

### Typography — `text-golden-*`

| Token | Size | Use |
|-------|------|-----|
| `text-golden-xs` | 9px (0.5625rem) | Captions, labels, tracking-widest text |
| `text-golden-sm` | 12px (0.75rem) | Meta info, secondary text, timestamps |
| `text-golden-base` | 14px (0.875rem) | Body text, buttons, nav items |
| `text-golden-md` | 16px (1rem) | Emphasized body, icons in text |
| `text-golden-lg` | 23px (1.4375rem) | Section headings, card titles |
| `text-golden-xl` | 37px (2.3125rem) | Page titles, hero names |
| `text-golden-2xl` | 59px (3.6875rem) | Hero/display text (rare) |
| `text-golden-3xl` | 96px (6rem) | Display only (marketing, splash) |

### Spacing — `{p|m|gap|px|py|...}-golden-*`

| Token | Size | Use |
|-------|------|-----|
| `golden-1` | 5px (0.3125rem) | Tight inner padding, icon gaps |
| `golden-2` | 8px (0.5rem) | Base unit, compact gaps |
| `golden-3` | 13px (0.8125rem) | Standard inner gaps, small padding |
| `golden-4` | 21px (1.3125rem) | Card padding, section inner gaps |
| `golden-5` | 34px (2.125rem) | Section-to-section spacing |
| `golden-6` | 55px (3.4375rem) | Large section separations |
| `golden-7` | 89px (5.5625rem) | Page-level spacing (header/footer) |

### Sizing — `w-golden-*`

| Token | Size | Use |
|-------|------|-----|
| `w-golden-xs` | 232px (14.5rem) | Small cards, sidebars (collapsed) |
| `w-golden-sm` | 376px (23.5rem) | Medium cards, modals (narrow) |
| `w-golden-md` | 608px (38rem) | Content columns, forms |
| `w-golden-lg` | 984px (61.5rem) | Wide content areas |
| `w-golden-xl` | 1592px (99.5rem) | Max page container |

### Border Radius — `rounded-golden-*`

| Token | Size | Use |
|-------|------|-----|
| `rounded-golden-sm` | 5px | Small elements, tags, badges |
| `rounded-golden-md` | 8px | Buttons, inputs, inner cards |
| `rounded-golden-lg` | 13px | Cards, dropdowns, panels |
| `rounded-golden-xl` | 21px | Hero cards, modals, sheets |

## Usage Guidelines

### When to use golden tokens (always):
- Font sizes for all text
- Gaps between elements (`gap-golden-*`)
- Padding inside containers (`p-golden-*`, `px-golden-*`, `py-golden-*`)
- Margins between sections (`m-golden-*`, `mt-golden-*`, `mb-golden-*`)
- Border radius on cards and containers

### When standard Tailwind is acceptable:
- **h-* / w-* for fixed icon sizes** (h-4, w-4, h-7, w-7) — icons have internal proportions
- **Ring widths** (ring-2) — pixel-specific by design
- **Border widths** (border, border-2) — too thin for φ to matter
- **Opacity / colors** — not spatial, φ doesn't apply
- **z-index** — functional, not visual
- **Transition durations** — temporal perception ≠ spatial φ
- **Min touch targets** (min-h-[44px]) — accessibility overrides aesthetics

### Relationship between heading and body:
```
Body text: text-golden-base (14px)
Heading:   text-golden-lg   (23px)  → ratio = 1.64 ≈ φ ✓

Section:   text-golden-lg   (23px)
Page:      text-golden-xl   (37px)  → ratio = 1.61 ≈ φ ✓
```

### Spacing rhythm example:
```
Icon gap:      gap-golden-1 (5px)
Inner padding: p-golden-3   (13px)  → ratio = 2.6 ≈ φ² ✓
Card padding:  p-golden-4   (21px)  → ratio = 1.61 ≈ φ ✓
Section gap:   gap-golden-5 (34px)  → ratio = 1.62 ≈ φ ✓
```

## Adoption Strategy

1. **Dashboard** — fully migrated (first consumer)
2. **Shared components** (Sidebar, Topbar, EmptyState) — adopt next
3. **Page-level layouts** — adopt progressively
4. **Admin pages** — lowest priority (internal tool)

## Modifying the Scale

All tokens live in `app/globals.css` → `@theme inline`. Changing a value there propagates to every component using that token. No need to search-and-replace across files.
