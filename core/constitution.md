# Constitution — law of this spec repo

> This file is baked into every generated `<app>-specs/` repo. It is the **law**: people and AI read it before
> authoring or changing a spec. Everything team-specific (domains, statuses, roles, repos, language) lives in
> **`spec.config.json`** — change it there and nowhere else. Keep this file short.

---

## 1. One capability = one folder (not one task)

```
specs/features/<ID>/
  meta.yml         # machine facts (status, history, related_code, …)
  spec.md          # requirement / business / usecase — CURRENT behaviour
  acceptance.md    # acceptance criteria / test checklist
  tech.md          # technical notes / architecture / traceability
```

A **feature is a living capability, not a ticket.** `spec.md` always describes the **current** behaviour — read one
file and you know how it works today, without replaying history. A ticket is a *change request* against a capability.
The change log lives in `meta.yml.history` (newest first). Never spawn a second folder for the same capability.

## 2. Feature ID

`ID = [DOMAIN]-<slug>`. `DOMAIN` (UPPERCASE) comes from `spec.config.json.domains` (if that list is non-empty; else
IDs are free-form). `<slug>` is a short kebab-case name for the capability, borrowed from code vocabulary so
`related_code` and code search line up. **No ticket key in the ID** — the capability outlives any ticket.

## 3. `features/` has exactly TWO writers

`specs/features/` = **what is / was in production, always**. Only two flows may create or write a feature — no third:

- **`reverse-spec`** — code already in production but no spec → writes the feature directly (`origin: reverse-engineered`).
- **`archive` (fold)** — an **Add**-change *ships* → creates the feature (`origin: folded`); a Modify/Remove/Fix change
  ships → patches it.

A feature that is neither reverse-engineered nor traceable to a folded change was hand-made off-process — `check`
flags it. **Do not hand-create feature folders.**

## 4. Everything else is a change (state vs delta)

New work — a brand-new capability OR a change to an existing one — starts as a **change** under
`specs/changes/<Type>-<TASK>-<brief>/`:

```
meta.yml         # task_code, type (Add|Modify|Remove|Fix), status, acceptance_stage, depends_on (target feature IDs)
spec.md          # the change, per target feature ("## <FEATURE-ID>" blocks). SEE §5.
acceptance.md    # the new / changed acceptance criteria
tech.md          # (optional) technical notes for this change
```

- A change is **first-class and tracked** — but it is **SAFE** only because it **folds** into `features/` on
  `archive` (§5). Until then `features/` stays the trustworthy "what's live" record; a change is "in flight".
- The change folder — **not** the whole feature spec — is what you hand a coding AI, so it builds only the delta.
- Its **Out-of-scope fence** (the "do NOT touch" list) is what stops the AI re-implementing the feature. Never leave it empty.

## 5. The delta format + deterministic fold

`spec.md` inside a change is organised by target feature, one `## <FEATURE-ID>` block each:

- **`type: Add`** (new feature) — the block is the **full** spec written one heading level deeper
  (`### Problem / context`, `### Requirements` with `#### Requirement: <title>`, …). On fold it is promoted to H2 and
  **creates** the feature.
- **`type: Modify|Remove|Fix`** (change) — the block is a **delta**: `### ADDED Requirements`,
  `### MODIFIED Requirements`, `### REMOVED Requirements`, each holding `#### Requirement: <title>` blocks. On fold,
  requirements are matched into the feature's `## Requirements` by **exact title** and applied.

The feature's own `spec.md` uses `## Requirements` → `### Requirement: <title>` → `#### Scenario: <name>`. Because the
delta names requirements by title, **`node tools/specs.mjs archive` folds it mechanically — no AI needed to merge.**
Renaming a requirement = REMOVE the old title + ADD the new one.

## 6. Status lifecycle & acceptance stage (two orthogonal axes)

- **`status`** (`spec.config.json.statuses`) tracks the **spec lifecycle** — the coordination protocol between roles
  (`spec.config.json.roles`). Reverse-engineered specs start at `live`.
- **`acceptance_stage`** (`spec.config.json.acceptance_stages`, e.g. `happy` → `full`) tracks the **maturity of the
  test suite**, independent of `status`. `happy` = only the happy-path checklist (dev must self-test it green before
  handing to the tester); `full` = full lifecycle coverage. `check` **warns** if a shipped feature is still `happy`.

Do not merge the two into one field. Keeping them separate lets `check` cross-check them.

## 7. Quality bar for `spec.md`

`spec.md` must read like a professional wrote it: **business language only** (no file paths / symbols / line numbers —
those live in `tech.md`'s traceability map), **full lifecycle coverage** (every event, every window's expiry, error
paths — not just the happy path), **per-segment flows** when behaviour differs by segment, **exact numbers + a worked
example** for every formula. The bar: a tester can derive test cases — and support can answer customers — from
`spec.md` alone. Full authoring rules live in `rules/` (this repo's template owns them).

## 8. Source format & tooling

Markdown for prose (`spec.md`, `acceptance.md`, `tech.md`); YAML for machine facts (`meta.yml`); JSON for
`spec.config.json`. After any change run **`node tools/specs.mjs index && node tools/specs.mjs check`** — both must
pass before commit. Adding a domain/status/role = edit **`spec.config.json` only** (one place, not three).
