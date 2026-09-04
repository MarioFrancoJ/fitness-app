# Commit, Push & Approval Policy

Default policy for all work in this repository. Assume it at the start of every
task. Goal: reduce interruptions, unnecessary approvals and time/token cost.

## Branch policy

- **Work directly on `main`** for normal product, UX/UI, styles, components,
  content, i18n and low-risk refactor changes.
- **Create a new branch ONLY** when the change is **large or risky**, or when it
  falls into an approval-required category (see below).

## Automatic authorization — low-risk changes

For any **low-risk** change, proceed **without asking for approval**:

- UX / UI
- Styles
- Components
- Content
- i18n
- Low-risk refactors
- Responsive adjustments
- Accessibility
- Code cleanup
- Visual improvements
- Minor fixes

### Mandatory flow (do not stop between steps)

```
Implement → Validate → Commit → Push to the current branch
```

- If the work is happening directly on `main`, that means **push to
  `origin/main`** — no additional approval needed. Approval is for MERGE and PR,
  **not** for PUSH.
- **Do not leave local commits pending.** Every low-risk change must end up
  published on GitHub automatically.

**Validation before committing** (run what applies):
- `npm run type-check`
- `npm run lint`
- `npm run build`
- EN/ES dictionary parity when `messages/*.json` changed

Commits: scoped, descriptive, Conventional Commits style (e.g. `feat(ux): ...`).

### When done, just report:
- What changed
- Commit SHA
- Validation results
- Branch where it was published

## Requires explicit user approval (stop and ask)

Only these require approval before proceeding:

- Pull Requests
- Merge between branches
- Merge to `main` from another branch
- Architecture changes
- Database
- Migrations
- Supabase
- Authentication
- Security
- Infrastructure
- CI/CD
- Deployment configuration
- Mass code deletion
- Irreversible changes
