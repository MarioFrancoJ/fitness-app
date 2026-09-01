# Typography Rule (UI Text)

**Status: permanent rule.** Applies to all rendered UI text across the app.

## Allowed scale

Only these sizes may be used for UI text:

```
12px · 14px · 16px · 20px · 24px · 32px
```

These map to the type tokens defined in `app/globals.css` (`@theme inline`). Prefer the tokens; do not hand-write pixel values.

## Mandatory usage

| Size | Use for |
|------|---------|
| **12px** | Auxiliary labels, eyebrows, timestamps, chart axis labels, and non-critical help **only**. |
| **14px (minimum)** | Navigation, buttons, links, forms, tables, progress values, actionable metadata, and any text the user must **read or act on**. |
| **16px+** | Emphasized content, inputs, metrics, and titles — sized by hierarchy. |
| **20px** | Card and section titles. |
| **24px** | Page titles and main dashboard headings. |
| **32px** | Exceptionally important metrics or headings. |

## Prohibitions

- **No text smaller than 12px.** Ever.
- **No sizes outside the allowed scale** without a documented UX reason (record it in the PR description and, if recurring, in the design system doc).
- **Do not use 12px** for actions, navigation, important values, or operational information — those require 14px minimum.

## Hierarchy

Establish visual hierarchy through **font-weight and contrast**, not through off-scale sizes. Two elements at the same size can still differ clearly via weight (e.g. `font-medium` vs `font-bold`) and color (e.g. `text-zinc-900` vs `text-zinc-500`).

## Line height

Use line-heights proportional and consistent with each token (already defined per token in `app/globals.css`). Do not override with arbitrary values unless a documented layout need requires it.

## Scope / exceptions

- **SVG icon sizing** is out of scope — this rule governs text, not icon dimensions.
- Non-textual properties (spacing, borders, radii, z-index) are unaffected.

## Where the tokens live

All type tokens are defined in `app/globals.css` inside the `@theme inline` block. Changing a token there propagates everywhere. See also the design-system scale reference in `.kiro/steering/golden-ratio-scale.md`.
