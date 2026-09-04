# Commit & Approval Policy

Default policy for all work in this repository. Assume it at the start of every task.

## Branch policy

- **Work directly on `main`** for normal product, UX/UI, styles, components,
  content, i18n and low-risk refactor changes. Implement → validate →
  auto-commit on `main`.
- **Create a new branch ONLY** when the change is **large or risky**, or when it
  falls into an approval-required category (architecture, database, auth,
  infrastructure/deploy).
- Committing to local `main` is automatic. **Pushing `main` to `origin`**
  (publishing to the production branch) is treated like a merge/publish step and
  is **not** done automatically — do it only when the user asks.

## Auto-commit (validate → commit, no approval needed)

For **low-risk** changes, implement → validate → **commit automatically** with a
descriptive message, then report the SHA and a short summary. Do **not** ask for
approval to commit these:

- UX / UI
- Styles
- Components
- Content
- i18n
- Refactors
- Low-risk features

**Validation before committing** (run what applies to the change):
- `npm run type-check`
- `npm run lint`
- `npm run build`
- EN/ES dictionary parity when `messages/*.json` changed

Commits should be scoped and descriptive (Conventional Commits style, e.g.
`feat(ux): ...`, `refactor(pricing): ...`).

## Requires explicit user approval (never automatic)

Ask before doing any of these:

- Merge
- Opening a Pull Request
- Architecture changes
- Database changes
- Authentication changes
- Infrastructure / deploy changes
