# The skill contract — the one stable coupling boundary

Customisation is **strong** here because there is exactly **one** thing everything couples to: the **output contract**,
enforced by `node tools/specs.mjs check`. Everything else — which skill authored a spec, how it phrased things, what
rules it followed — is swappable.

## The contract

> A skill (yours or the toolkit's) that produces or changes specs must emit **features and changes that pass
> `node tools/specs.mjs check`** against the repo's `spec.config.json` and the schemas in `schema/`.

That's it. Concretely, the outputs must satisfy:

**A feature** (`specs/features/<ID>/`)
- `meta.yml` with the required fields (`id, app, title, status, origin, acceptance_stage`), `id` == folder name,
  `status` ∈ `spec.config.json.statuses`, `origin` ∈ `reverse-engineered|folded|spec-first`, `acceptance_stage` ∈
  `spec.config.json.acceptance_stages`; if `domains` is set, the ID starts with one; `related_code` uses the configured
  repo keys.
- `spec.md` with a `## Requirements` section whose blocks are `### Requirement: <title>` (so deltas can fold by title).
- `acceptance.md` and `tech.md` present.

**A change** (`specs/changes/<folder>/`)
- `meta.yml` with `task_code, type, title, status, acceptance_stage, depends_on` (types/statuses from config).
- `spec.md` with a `## <FEATURE-ID>` block for every `depends_on` target; Add → full spec at H3, Modify/Remove/Fix →
  `### ADDED/MODIFIED/REMOVED Requirements` with `#### Requirement:` blocks.
- `acceptance.md` present.

## Why this is enough

Because the coupling boundary is the **contract**, not any skill's implementation:
- Replace `new-spec` with your team's house-style version → fine, as long as its output passes `check`.
- Change *how* specs read → edit `rules/*.md`; every skill reads them, so one edit changes all flows.
- Change vocabulary → edit `spec.config.json` (one place).
- The deterministic `archive`/fold depends only on the requirement-title convention above — not on who wrote the delta.

No skill needs to know about any other skill. That is the lowest coupling a system like this can have.
