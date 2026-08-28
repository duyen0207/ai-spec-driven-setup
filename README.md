# ai-spec-driven-setup

A **clone-once, keep-it toolkit** that generates a **separate, self-contained spec repository for each app**. Clone it
once, install its skills, then use them to spin up and maintain `app-a-specs/`, `app-b-specs/`, … Each generated repo
is owned by its team and runs with **zero install** (Node 18+ only).

Skills follow the **Agent Skills Open Standard** (portable beyond Claude). The design and its rationale are in
[`PHILOSOPHY.md`](PHILOSOPHY.md); the full design discussion is in [`research/`](research/).

## The idea in one line

Separate *"what a capability does now"* (`features/`, permanent, business language) from *"what a task changes"* (a
`changes/` folder that **folds** into `features/` when it ships) — so reading one file tells you the current state, a
coding AI gets a fenced delta instead of the whole feature, and the spec advances only when production does.

## Three tiers

```
ai-spec-driven-setup/            ← TOOLKIT (this repo — clone once, keep)
  config.yml                       toolkit settings (default language, default template)
  skills/                          init-spec-repo · reverse-spec · new-spec · fold-change · spec-to-helpdoc
  templates/                       choosable blueprints (catalog.yml + default/) …
  core/                            the engine + schema + constitution, baked into every generated repo
  docs/                            customizing.md · skill-contract.md
        │  init-spec-repo: pick a template → bake core → infer spec.config.json → seed
        ▼
templates/default/               ← TEMPLATE (a blueprint; add your own)
  rules/                           HOW specs are written (belongs to the template, read by the skills)
  skeletons/                       fill-in blanks the engine scaffolds new features/changes from
  specs/  .claude/  tools/  spec.config.template.json
        │
        ▼
app-x-specs/                     ← OUTPUT (generated, self-contained, team-owned)
  spec.config.json  constitution.md  rules/  schema/  tools/specs.mjs
  specs/features/<ID>/…  specs/changes/…  SPECS_INDEX.md  CHANGES_INDEX.md
```

## Install (run this first)

After cloning, the skills are **not** usable until they live under a `.claude/skills/` path — Claude only
auto-discovers skills from `~/.claude/skills/` (personal) or `<workspace>/.claude/skills/` (project-scoped).
Just `cd`-ing into this repo is **not** enough. Because you run these skills inside each app's own workspace,
install them personally (global):

```bash
git clone <this-repo> ~/ai-spec-driven-setup

# make the skills discoverable to Claude in ANY workspace (symlink into your personal skills dir):
mkdir -p ~/.claude/skills
ln -s ~/ai-spec-driven-setup/skills/* ~/.claude/skills/
```

This is **additive** — it only adds `init-spec-repo · reverse-spec · new-spec · fold-change · spec-to-helpdoc`
alongside any skills you already have; it never removes or overwrites them (a same-named skill would just make
`ln` error out — don't add `-f`). Because they're symlinks, pulling toolkit updates updates the skills too;
to uninstall, delete just those 5 symlinks. Verify with `ls ~/.claude/skills/`.

(Any Agent-Skills-compatible tool can load `skills/*/SKILL.md` the same way.)

## Quickstart

1. In an app's workspace, run **`init-spec-repo`** → it asks a few questions, picks the `default` template, and
   generates `app-x-specs/` (self-contained; the toolkit is no longer needed to run it).
2. Recover existing capabilities from code with **`reverse-spec`** (writes `features/` directly).
3. Capture new work with **`new-spec`** — it decides new-capability (`Add`) vs change (`Modify/…`) and writes a
   **change** either way.
4. When a change ships, **`fold-change`** folds it into its feature(s) deterministically.
5. Generate user docs with **`spec-to-helpdoc`**.

Inside any generated repo, the engine is always:

```bash
node tools/specs.mjs feature | change | index | check | archive
node tools/specs.mjs index && node tools/specs.mjs check   # after any edit — both must pass
```

## Customising

Strong and layered — most teams only pick a template, set the language, and edit a rule. See
[`docs/customizing.md`](docs/customizing.md) and the coupling boundary in
[`docs/skill-contract.md`](docs/skill-contract.md). Everything app-specific lives in one `spec.config.json`.

## Status

- ✅ MVP built: config-driven engine (`feature | change | index | check | archive` with deterministic fold), the
  `default` template, 5 skills, docs. Verified end-to-end (create → change → fold → check).
- ⏳ Phase 2: `embed-shopify-app` template · `spec-to-helpdoc` gitbook profile · `update`/migration.
- ⏳ Phase 3: co-evolve from merged code (fold from real code, not just intent).
