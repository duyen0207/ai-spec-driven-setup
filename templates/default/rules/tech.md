# Rule: how to write `tech.md` (technical notes / architecture / traceability)

> **Authoring rule of this repo** (`default` template), read directly by the skills. Owner: the techlead/dev role in
> `spec.config.json.roles`. `tech.md` describes **how** it is built and **links spec ↔ code**. Every code reference
> (path/symbol/line) belongs here, NOT in `spec.md`. Write in `spec.config.json.language`.

## 0. Core principles

- **`tech.md` describes the DESIGN, not a file list.** The number-one goal is to convey the **architecture & design
  patterns** — this is durable; file paths/lines change constantly. A reader must understand *how the feature is
  organised, why it is layered this way, what reuses/inherits what* — not just "which files are involved". A bare
  file list is a sign `tech.md` is missing the point.
- **Separate volatile from durable.** Architecture/flow/patterns (durable) go in the body, described by
  **component name & role** ("orchestrator base class", "a component per option"). Volatile `repo:path:line` anchors
  are collected in the **Traceability map** at the end. When code moves, only the map changes.

## 1. Design overview / Architecture — the MOST important section (put it first)

Answer: *how is this feature designed?*

- **Design pattern & overall structure:** name the pattern if there is one (template-method/inheritance, strategy,
  observer, composition, registry, factory…). Don't make the reader infer it from a file list.
- **When there is an inheritance hierarchy / several variants sharing one skeleton — describe "the common frame + what
  each variant adds".** (e.g. a base class holds the shared render flow; three subclasses override only the specific
  part.) Write it this way — the common frame, then each variant's delta.
- **Diagram when it helps:** an ASCII class tree for hierarchies, an arrow flow for multi-branch flows, a sequence for
  request→persist→render. A diagram is part of the design, not decoration — draw it when it beats prose.
- Describe by **role & component name** (readable even after files move); leave `repo:path:line` for the map.

## 2. Layers (adapt to your app)

Split the feature into its natural layers and **connect them** rather than describing isolated islands. For a
web/service app that usually means: the **entry** (route/handler/UI action the user hits) → the **core logic**
(service/domain) → **persistence** (which tables/columns or store it writes; a column often encodes a rule — name it)
→ **side effects** (events, emails, external API calls). Make the path "trigger → outcome" traceable end to end.
(For a template targeting a specific stack — e.g. an embedded app split into admin vs client — encode that split as a
rule in *that* template, not here.)

## File structure (sections)

- **Design overview / Architecture** — §1.
- **Data model** — tables + columns / storage touched (name columns; they encode rules).
- **Flow** — trigger → effect; split flows when they differ.
- **External APIs / integrations** — which APIs, scopes, webhooks; reuse shared patterns.
- **Risks / gotchas** — compatibility, performance, rate limits, migration.
- **Notes for AI codegen** — conventions to follow, what NOT to touch, helpers/extension points to reuse.

## Traceability map (REQUIRED — ends the file)

`tech.md` **must end with a Traceability map**: each rule/section in `spec.md` → its `repo:path:line` (or symbol)
anchors. This map replaces embedding anchors in the spec, and carries the volatile part so the body stays durable.
Keep it complete — it is how the next engineer reconciles spec with code, and the most valuable artifact of a
reverse-engineered spec.

## When authored by a skill (DRAFT — techlead refines later)

- **`new-spec` (spec-first, no code yet):** a **stub**, marked `<!-- DRAFT: techlead to refine -->`. No code to anchor,
  but still **suggest the design**: likely layers touched, proposed architecture/pattern, expected data model, obvious
  risks. Don't fully author it — but don't leave the design suggestion empty.
- **`reverse-spec` (code-first):** the **richest** file — read straight from code. MUST have: Design overview (§1) with
  the real pattern + variant hierarchy (draw a diagram when needed); layers wired end to end; entry points, call flow,
  data model, external calls & side effects, the `related_code` map, feature flags/config; and it **ends with the full
  Traceability map**. Tag **CERTAIN** (in code) vs **INFERRED** (guessed) — a short `*(inferred)*` is enough.

- **When changed via a change folder:** don't author `tech.md`; instead copy the relevant `repo:path` rows from the
  feature's traceability map into the change's **Code anchors** so the coding AI targets surgically.
