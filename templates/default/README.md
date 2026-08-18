# {{APP}} specs

> Single source of truth for the specs of **{{APP}}**. Generated from the `default` template of
> [`ai-spec-driven-setup`](https://github.com/) — this repo is **self-contained** (zero install; Node 18+ only) and
> yours to own.

## Layout

```
spec.config.json     # domains, statuses, roles, repos, language — change vocabulary HERE (one place)
constitution.md      # the law
specs/
  AGENTS.md          # AI guide — read first
  features/<ID>/     # one capability per folder (meta.yml, spec.md, acceptance.md, tech.md)
  changes/           # work in flight (folds into features/ when it ships); archive/ = shipped
rules/               # how specs are written (edit to change house style)
tools/specs.mjs      # engine
SPECS_INDEX.md · CHANGES_INDEX.md   # generated
```

## Daily use

```bash
node tools/specs.mjs index && node tools/specs.mjs check   # after any edit — both must pass
```

- Capture a requirement → skill **`new-spec`** (routes new-capability vs change automatically).
- Recover a spec from existing code → skill **`reverse-spec`**.
- Ship a change (fold it into its feature) → skill **`fold-change`** / `node tools/specs.mjs archive <change>`.
- Generate user-facing docs → skill **`spec-to-helpdoc`**.

Read [`specs/AGENTS.md`](specs/AGENTS.md) and [`constitution.md`](constitution.md) first.
