---
name: spec-to-helpdoc
description: Project a capability's spec into user-facing help docs — translate business rules into benefits + clickable steps, hide internal mechanics, invent nothing, diff against existing docs to find gaps, and stop for human review (never auto-publish). Output format is a pluggable profile (markdown default). Use inside a generated <app>-specs/ repo ("write help docs for X", "generate user docs from the spec", "sinh help-doc từ spec").
---

# spec-to-helpdoc — project a spec into user-facing docs

A help doc is a **user-facing projection** of a spec, **not** a copy. The spec says *what the feature does & the
rules*; the doc says *what the user clicks to use it, and what they'll see*. You **propose** doc changes and **stop for
review — never commit/publish**.

**First: resolve inputs.** Read the target feature's `spec.md` (+ `acceptance.md`, `meta.yml`) for the authoritative
behaviour. Read `spec.config.json.helpdoc.profile` (default `markdown`) — it selects the **output format**:
- **`markdown`** — plain, portable Markdown pages (default).
- **`gitbook`** — GitBook syntax (`{% hint %}`, `{% stepper %}`, `icon:` frontmatter, a docs map) — phase 2.

Write generated content in `spec.config.json.language`.

## Core rules (all profiles)

- **User voice, benefits first.** Lead with the benefit ("see prices without opening each invoice"), hide the
  mechanism. Every step is a clickable action ("Go to … → click … → choose …").
- **Zero jargon.** No file paths, function/DB names, class names, line numbers, or code syntax. Name things by what the
  user sees on screen.
- **Invent nothing.** A page may only describe behaviour **already in the spec**. Missing info → a clear placeholder,
  never a guess. Numbers/limits → state the exact value the user needs.
- **Business rule → user tip/warning.** e.g. spec "watermark only on the free plan" → a "How to remove the label" page
  pointing at the upgrade.

## Step 1 — Read both sides & diff (the valuable part)

Compare the spec against the **existing** docs (if any) and classify:
- **Missing** — a rule/flow/lifecycle event a user would search for that no page explains → new page/section.
- **Stale / wrong** — a page contradicting the current spec → fix in place (minimal edit).
- **Thin** — correct but sparse vs what the spec supports → enrich.
- **Doc-ahead-of-spec** — the doc asserts something the spec does **not** cover → do NOT encode it as fact; flag it as
  a spec gap to feed back into `new-spec` first.

Pick scope: by default address the highest-value missing/stale items. If there are many, present the list and let the
user choose (one `AskUserQuestion`).

## Step 2 — Draft (per profile) & report

Write each page in the profile's format, keeping every claim traceable to the spec. For new pages, place them in the
docs tree and update any table of contents the profile uses. Make **minimal** edits to existing pages.

Then **do not commit/publish**. Report: pages created/edited, which spec rule each now covers, remaining doc gaps you
did **not** generate, and any **doc-ahead-of-spec** items to route through `new-spec`. Remind the user to review,
attach any screenshots, and publish themselves.
