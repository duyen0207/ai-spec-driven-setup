# Rule: how to write `acceptance.md` (acceptance criteria & test checklist)

> **Authoring rule of this repo** (`default` template), read directly by the skills. Owner: the QA/tester role in
> `spec.config.json.roles`. Every item must be **verifiable (pass/fail)**. Write in `spec.config.json.language`.

## 0. Core principles

- Each criterion is a **verifiable proposition**: looking at it, you know how to judge pass/fail. No vague goals
  ("works well").
- Acceptance **tracks `spec.md`**: every important rule/flow in the spec has at least one covering criterion. Don't
  invent behaviour not in the spec.
- Cover **beyond the happy path**: take branches from the lifecycle checklist in `rules/spec.md` §2 — empty/zero,
  limits/max, plan/permission gating, errors, reinstall, window expiry, regression.

## `acceptance_stage`: happy → full (the two-phase gate)

`meta.yml.acceptance_stage` records maturity, orthogonal to `status`:

- **`happy`** — only the **happy-path** checklist exists. The **dev must self-test it green before handing to the
  tester**. Use this in the early phase, when the requirement is still settling.
- **`full`** — full lifecycle coverage (edge cases, gating, errors, regression). Reach this before/at ship.

`check` **warns** if a feature is shipped (`implemented`/`live`) but still `happy` — a shipped capability needs full
acceptance. Bump `acceptance_stage: full` when you complete the coverage.

## File structure

- **Acceptance criteria** — **Given / When / Then**, one scenario per `AC-N: <title>` block.
- **Test checklist** — concrete pass/fail checks. Minimum: happy path, edge case, plan/permission gating,
  **regression (old behaviour unaffected)**.
- **Test data / setup** — fixtures, sample data, config needed to reproduce.

## When authored by a skill (DRAFT — the tester refines later)

- **`new-spec`:** a short **stub** — 2–4 obvious scenarios + a short checklist from `spec.md`. Mark
  `<!-- DRAFT: tester to refine -->`. Set `acceptance_stage: happy`.
- **`reverse-spec`:** 3–6 scenarios drawn from the **real branches / edge cases seen in code** (empty/zero, limits,
  gated paths, error paths). If the code is fully covered, `acceptance_stage: full`.

## When changed via a change folder

Do **not** edit the feature's `acceptance.md` when the change opens. Put only the **new/changed** criteria in the
change's `acceptance.md`; the rest of the feature's acceptance still applies. On `archive` they fold into the feature.
