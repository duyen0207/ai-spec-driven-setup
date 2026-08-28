# Customising the setup

Customisation is layered by effort — most teams only touch the first three. The deeper surfaces exist but are not
required and are not in your way by default (progressive disclosure).

| # | You want to change | Do this | Touches |
|---|---|---|---|
| 1 | Default **language / template** | edit toolkit `config.yml` | one line |
| 2 | **Which template** an app uses | run `init-spec-repo`, pick from `templates/catalog.yml` | no code |
| 3 | **How specs are written** (house style) | edit `rules/*.md` in the template (or in a generated repo) | one rule file |
| 4 | **Vocabulary** (domains, statuses, roles, repos, language) | edit the repo's `spec.config.json` | one place |
| 5 | **Replace / add a skill** | drop a skill folder in `skills/` (toolkit) or `.claude/skills/` (a repo) | must pass `check` |
| 6 | **A whole new kind of app** | add a template folder + a `catalog.yml` entry | one template |

## 1–2 · Language & templates
`config.yml` sets the defaults `init-spec-repo` uses. `templates/catalog.yml` lists the blueprints; each is a folder
under `templates/`. Picking one (via `core/tools/init.mjs`) clones its `rules/`, `skeletons/` (fill-in blanks for new files), `specs/`
skeleton, `.claude/`, `tools/`, and bakes the core engine in.

## 3 · Rules live in the TEMPLATE (the key design choice)
The authoring standards (`rules/spec.md`, `acceptance.md`, `tech.md`, `change.md`) belong to the **template**, not to
the skills. Skills are generic orchestrators that **read the active repo's rules and follow them**. So to change how
specs read, edit the rule — every skill picks it up, and you touch nothing else. A stack-specific template (e.g. an
embedded-app template) encodes its specifics as *its own* rules, without changing any skill.

## 4 · `spec.config.json` — the single source of variability
Everything app-specific is here: `app`, `language`, `domains`, `statuses`, `roles`, `repos`, `change_types`,
`change_statuses`, `acceptance_stages`, `helpdoc.profile`. Adding a domain is **one edit** (not three, as in a
hard-coded tool). `tools/specs.mjs check` validates every spec against this file.

## 5 · Replace or add a skill
Drop a skill folder (Agent Skills Open Standard: a `SKILL.md` with `name` + `description`) into `skills/` (toolkit-wide)
or a generated repo's `.claude/skills/` (that app only). The **only** contract it must honour is the one in
[`skill-contract.md`](skill-contract.md): its output must pass `check`. It does not couple to any other skill.

## 6 · A new template
Copy `templates/default/` to `templates/<your-name>/`, adjust its `rules/`, file-`templates/`, and
`spec.config.template.json`, and add an entry to `templates/catalog.yml`. The engine and skills are unchanged — they
are generic. (This is the phase-2 path for `embed-shopify-app`.)

## Versioning
Each generated repo stamps `spec.config.json.template = "<name>@<semver>"` and carries `core/VERSION`. Today generation
is a clean **snapshot** (the repo is self-contained; toolkit changes don't reach it). The version stamp reserves a
future `update` path to re-bake the engine/rules while keeping your `features/` and `changes/`.
