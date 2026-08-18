---
name: init-spec-repo
description: Bootstrap a new, self-contained <app>-specs/ repository for one app — pick a template, infer spec.config.json, bake the engine + rules in one command, and seed 1–2 example capabilities. Use when the user wants to START a spec system for an app ("set up specs for app X", "generate a spec repo", "dựng repo spec cho app").
---

# init-spec-repo — generate a spec repo for one app

You create a **self-contained** `<app>-specs/` repo (zero install, Node 18+ only) that the team owns. This is the
**bootstrap** skill of the `ai-spec-driven-setup` toolkit. Every app gets its **own** repo.

**Toolkit location:** this skill lives at `<toolkit>/skills/init-spec-repo/`; the toolkit root (two levels up) holds
`core/` (engine + schema + constitution + the `init.mjs` baker) and `templates/` (choosable templates + `catalog.yml`).
The mechanical bake is done by `core/tools/init.mjs`; your job is the **intelligent** parts around it — inputs,
inference, and seeding.

## Step 1 — Gather inputs (one AskUserQuestion, then confirm)

Ask, in one `AskUserQuestion` call:
1. **App name** — becomes `app-<name>` (kebab-case). Default: infer from the folder.
2. **Language** — output language for specs/docs (`en` / `vi` / …). Default from the toolkit `config.yml`.
3. **Template** — options = entries in `templates/catalog.yml` (name · description · usage). Default: `default`.
4. **Where is the code / docs?** — default: scan the current folder and its parent. They can point elsewhere.

## Step 2 — Infer domains & repos, then confirm

Read `templates/<template>/spec.config.template.json` as the base. **Infer from the code/docs** and propose:
- **domains** — the app's top-level capability areas (route groups, modules, nav);
- **repos** — the code repo keys features will anchor to (`related_code`);
- **roles / language / app**.

Confirm the proposal with the user (`AskUserQuestion`). `spec.config.json` is the **single source of variability** —
everything app-specific lives there.

## Step 3 — Bake the repo (one command)

Run the mechanical baker with the confirmed values — it copies the core engine + the template body (`rules/`,
`skeletons/`, `.claude/`, `tools/`, `specs/AGENTS.md`), creates **empty** `specs/features/` + `specs/changes/` (the
template's seed is a demo — excluded by default), writes `spec.config.json`, then runs `index` + `check`:

```bash
node <toolkit>/core/tools/init.mjs --app <name> --template <template> --language <lang> --domains <A,B> --repos <web,api> [--dest <dir>]
```

(Use `--with-seed` only if the user wants the demo capability kept as a reference; `--force` to overwrite.) Confirm the
final line reports `check` passing.

## Step 4 — Seed 1–2 example capabilities (bounded)

Pick the **1–2 clearest** existing capabilities and reverse-engineer them fully as worked examples (follow the
`reverse-spec` skill for each, run inside the new repo). Leave the rest for the team to run `reverse-spec` on later —
keep this step small and high-confidence; do not dump many low-quality specs.

## Step 5 — Explain

Re-run `node tools/specs.mjs index && node tools/specs.mjs check` in the repo, then give the user a short walkthrough:
the layout, the two writers of `features/` (reverse-spec + fold), how to capture work (`new-spec`), and how a change
folds in (`fold-change`). Point them at `constitution.md` and `specs/AGENTS.md`.
