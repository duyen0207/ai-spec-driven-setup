# Philosophy — why this toolkit is shaped the way it is

> Read this to understand *why* things are arranged as they are, not just *how*. The law of a generated repo is its
> `constitution.md`; this file is the reasoning behind the whole toolkit.

## 1. What this is

`ai-spec-driven-setup` is a **clone-once, keep-it toolkit** that generates a **separate, self-contained spec repo for
each app**. Clone it once, install its skills, then use them to spin up and maintain `app-a-specs/`, `app-b-specs/`, …
Each generated repo is owned by its team and runs with **zero install** (Node 18+ only) — the toolkit is a generator
with a lifecycle, not a scaffold you throw away.

## 2. The central idea: a feature is a capability, not a task

Everything orbits one idea:

> **A feature is a living *capability*, not a ticket.**

`spec.md` always describes the **current** behaviour — read one file and you know how it works today, without replaying
ticket history. A ticket is a **delta** against a capability. This is why:
- one capability = one folder (never one folder per ticket);
- the change log lives in `meta.yml.history` (newest first), not inside `spec.md`;
- a change never spawns a second folder for the same capability.

## 3. `features/` has exactly two writers — and it is always production truth

`specs/features/` = **what is / was in production, always**. Only two flows write it:
- **`reverse-spec`** — documents existing production code (`origin: reverse-engineered`);
- **`archive` (fold)** — a shipped change folds in (`origin: folded`).

There is no third writer. A feature under active construction does **not** sit in `features/` — it lives in
`changes/` until it ships. So browsing `features/` never shows vaporware. `check` can even flag a feature that traces
to neither writer.

## 4. Everything is a change; state and delta are separated

New work — a brand-new capability **or** a change to an existing one — starts as a **change** under `specs/changes/`.
Two problems this avoids:
1. *Writing specs per task* → readers must replay history to know the current state. (Solved by capability-folders.)
2. *Handing a coding AI the whole feature spec for a small change* → it loads everything and re-implements things the
   task never asked for. (Solved by the change: a small, fenced delta.)

A change is **first-class and tracked** — unlike a throwaway work order — but it is **safe** only because it **folds**
into `features/` on `archive`. Without that fold, `changes/` would silently become a second source of truth. The fold
is the load-bearing mechanism, borrowed from OpenSpec: because deltas name requirements by title
(`### ADDED/MODIFIED/REMOVED Requirements`), **`archive` merges them mechanically — no AI needed**. An `Add`-change
creates the feature; a `Modify`/`Remove`/`Fix` patches it.

The Out-of-scope fence in a change matters more than a short spec: it is what stops the coding AI over-building.

## 5. Rules belong to the template; skills are generic

*How* a spec is written (`rules/spec.md`, `acceptance.md`, `tech.md`, `change.md`) is a property of the **template**,
not of the skills. A generic `new-spec` must not hard-code, say, "split admin vs storefront" — that is specific to one
kind of app. So skills are **orchestrators** that read the active repo's rules and follow them, and a stack-specific
template encodes its specifics as *its own rules*. This is the single-source-of-variability principle applied to
authoring: change how specs read by editing a rule, and every skill picks it up.

## 6. Two orthogonal axes: status and acceptance stage

`status` tracks the **spec lifecycle** (draft → live). `acceptance_stage` tracks the **maturity of the test suite**
(`happy` → `full`), independently. `happy` means only the happy path exists — the dev self-tests it before handing to
the tester; `full` means full lifecycle coverage. Keeping them separate lets `check` cross-check: a **shipped** feature
still at `happy` is a flagged quality gap. Don't collapse the two into one field.

## 7. Low coupling by construction

- **Single source of variability:** everything app-specific is in `spec.config.json` (add a domain = one edit).
- **The coupling boundary is `check`:** a replacement skill only has to emit specs that pass it (see
  `docs/skill-contract.md`). No skill knows about another.
- **Bake, then own:** a generated repo is self-contained; a version stamp reserves a future update path.

## 8. One-sentence summary

Separate *"what the capability does now"* (`features/`, permanent, business language) from *"what this task changes"*
(a `changes/` folder, folded on ship), so that (1) reading one file tells you the current state, (2) a coding AI gets a
fenced delta instead of the whole feature, and (3) the spec advances only when production does — while every app gets
its own self-contained repo from a generic, customisable toolkit.
