# AGENTS.md — how this spec repo is organised (read me first)

> Neutral, multi-tool AI guide (works for Claude, Cursor, Copilot, …). This repo is the **single source of truth for
> the specs** of one app. Specs live here in business language; code lives elsewhere.

## What this is (template: `default`, generic)

A capability-centric spec store. **One capability = one folder** under `specs/features/<ID>/` (`meta.yml`, `spec.md`,
`acceptance.md`, `tech.md`). `spec.md` always describes the **current** behaviour. Work is done as **changes** under
`specs/changes/`, which **fold** into features when they ship.

## Read order

1. [`../constitution.md`](../constitution.md) — the law (IDs, the two writers of `features/`, state-vs-delta, fold).
2. [`../SPECS_INDEX.md`](../SPECS_INDEX.md) — generated table of contents (features by domain).
3. [`../CHANGES_INDEX.md`](../CHANGES_INDEX.md) — active + archived changes.
4. `../rules/` — authoring standards for `spec.md` / `acceptance.md` / `tech.md` / `change.md` (this template owns them).

## `features/` has exactly two writers

`specs/features/` = what is/was in production. Only **`reverse-spec`** (documents existing code, `origin:
reverse-engineered`) and **`archive`** folding an Add-change (`origin: folded`) create features. Never hand-make a
feature folder.

## Workflows (skills)

- **`new-spec`** — capture a requirement. Scans the repo, decides new-capability (`type: Add`) vs change-to-existing
  (`type: Modify/…`), and writes a **change** either way.
- **`reverse-spec`** — recover a spec from existing code → writes the feature directly.
- **`fold-change`** — fold a shipped change into its feature(s) (`archive`).
- **`spec-to-helpdoc`** — project a spec into user-facing docs.

## Engine (`../tools/specs.mjs`, config-driven via `../spec.config.json`)

```
node tools/specs.mjs feature  --id <DOMAIN-slug> ...     # scaffold a feature (reverse-spec)
node tools/specs.mjs change   --task <CODE> --type <T> --brief <s> --target <ID>
node tools/specs.mjs index                               # regenerate the indexes
node tools/specs.mjs check                               # validate (CI gate)
node tools/specs.mjs archive  <change-folder>            # fold a shipped change into its feature(s)
```

After any edit: `node tools/specs.mjs index && node tools/specs.mjs check` — both must pass before commit.
Everything app-specific (domains, statuses, roles, repos, language) is in `../spec.config.json` — one place.
