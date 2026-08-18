---
name: reverse-spec
description: Recover a capability's spec from existing (legacy) production code when no ticket/spec survives — scan the code, infer the spec, and write the whole feature autonomously, then hand a plain-language flow summary to validate. Use inside a generated <app>-specs/ repo ("reverse engineer the spec for X", "dựng lại spec từ code", "document this existing feature").
---

# reverse-spec — recover a spec from code

You recover the spec of a capability that **already exists in production** but has **no surviving ticket/spec**. You
**read the code, infer the spec, and write the whole thing yourself**, so the user only **validates** the result.

`reverse-spec` is one of the **two** writers of `specs/features/` (constitution §3): it writes the feature **directly**
(`origin: reverse-engineered`), because it documents reality, not a proposed change.

**First: resolve the active rules.** Read `rules/spec.md`, `rules/acceptance.md`, `rules/tech.md`, and
`constitution.md` in this repo, and author every file to them. (Fall back to the copies bundled in this skill only if
the repo has none.) Write generated content in `spec.config.json.language`.

## Step 1 — Seed the search (one AskUserQuestion, then one free-text)

Ask: **App** confirmation + **Anchor type** (code location / feature name / a user-facing behaviour). Then, as free
text: *"Point me at the feature — a route, file, function, nickname, or just what a user does. And any surviving docs
(old PRD, notes, FAQ) — paste paths or fragments."* Then proceed autonomously.

## Step 2 — Locate & map the feature (codegraph-first, grep fallback)

Use codegraph if the repo is indexed (`codegraph_explore`, callers/callees, impact); else Grep/Glob/Read. Then
**enumerate the FULL event surface** — a capability is the union of every entry point, not one call tree:
routes/controllers, webhooks, cron/scheduled jobs, queue/event consumers **and emitted events** (emails, analytics),
config/feature flags, support/ops scripts, and DB columns the feature owns (each usually encodes a rule). Keep a
**coverage table**: entry point → what it does → which spec section will own it. Record the `<repo>:<path>` footprint
(→ `related_code`). If docs surfaced, cross-check each claim as confirmed / contradicted / not-in-code.

## Step 3 — Map to a DOMAIN, decide new-vs-update, scaffold

Infer the `domain` from where the code lives (`spec.config.json.domains`). List `specs/features/<DOMAIN>-*`; if this
capability is already specced, **refresh that** — else it's new. Scaffold directly:

```bash
node tools/specs.mjs feature --id <DOMAIN>-<slug> --origin reverse-engineered --status live --stage full
```

(`--stage full` only if the code is fully covered; else `happy`.) Set `related_code` and `confidence` in `meta.yml`.

## Step 4 — Author the whole spec (the bulk of the work)

Write **all** files completely to the rules:
- `spec.md` — business language only, full lifecycle coverage, per-segment flows, exact numbers. Consume the coverage
  table (every entry point → a spec line). Requirement blocks use `### Requirement:` / `#### Scenario:`.
- `acceptance.md` — 3–6 scenarios from the real branches/edge cases in code.
- `tech.md` — the richest file: Design overview (real pattern + variant hierarchy, diagram if needed), layers wired end
  to end, and it **ends with the Traceability map**. Tag CERTAIN vs `*(inferred)*`.
- **Open questions** in `spec.md` = the honest checklist (every inference, doc-vs-code conflict, unseen config value).

## Step 5 — Validate & self-critique

`node tools/specs.mjs index && node tools/specs.mjs check` — fix anything reported. Then attack your own draft: did I
cover ALL entry points? any path/symbol leaking into `spec.md` (move it to the traceability map)? feature flags whose
live value I couldn't see? two capabilities merged into one folder? Lower `confidence` and file honest Open questions.

## Step 6 — Hand off a plain-language flow summary

In chat (not a file), give a non-technical walkthrough: what it is, the flow (trigger → step → outcome), the rules that
matter, where it lives (one line), doc-vs-code contradictions, what you're unsure about, and your confidence. Tell the
user to validate against reality, answer the Open questions in `spec.md`, and bump `status`/`acceptance_stage` when
satisfied.
