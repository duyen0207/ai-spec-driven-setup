---
name: new-spec
description: Capture a requirement as a change — the single entry for authoring work. Scans the repo, decides whether it is a brand-new capability (type Add) or a change to an existing one (type Modify/Remove/Fix), and writes a change folder either way; the change folds into features/ only when it ships. Use inside a generated <app>-specs/ repo ("write a spec for X", "add a feature", "change how Y works", "ghi spec", "tạo change").
---

# new-spec — capture a requirement as a change

This is the **single entry** for authoring. The user just describes what they want; **they do not need to know whether
the capability already exists** — deciding that is your job. In the uniform model, **all** new work becomes a **change**
under `specs/changes/`; `features/` is written only when a change **ships** (fold) or by `reverse-spec` (constitution
§3, §4). So you never hand-create a feature folder here.

**First: resolve the active rules.** Read `rules/spec.md`, `rules/acceptance.md`, `rules/change.md`, and
`constitution.md` in this repo, and author to them. Write generated content in `spec.config.json.language`.

## Step 1 — Gather (one AskUserQuestion, then free-text)

Ask: **Domain** (options from `spec.config.json.domains`, plus "new domain") · **Ticket** (paste link / none) ·
**Design** (link / none). Then, as free text: *"Describe the change — the usecase(s), actors, triggers, steps,
outcomes, business rules, edge cases, and what it must NOT touch. Paste any docs."*

## Step 2 — Scan the repo & route (decide BEFORE scaffolding)

Scan **specs only** (not code): list `specs/features/<DOMAIN>-*`, read each plausible `meta.yml` title + top of
`spec.md`, and skim active `specs/changes/`. Decide, and **confirm with the user** (`AskUserQuestion`, the safety net):

- **Brand-new capability** → `type: Add`. Choose the new feature ID `[DOMAIN]-<slug>` (slug from likely code
  vocabulary). The change's `spec.md` block will hold the **full** spec authored at H3 (fold promotes to H2 and creates
  the feature).
- **Change to an existing capability** → `type: Modify` (or `Remove`/`Fix`). Target that feature's ID. The block holds
  a **delta** (`### ADDED/MODIFIED/REMOVED Requirements` with `#### Requirement:` matching live titles).

Never fork a second folder for a capability that exists — route to a Modify change instead.

## Step 3 — Scaffold the change

```bash
node tools/specs.mjs change --task <CODE|NOTICKET> --type <Add|Modify|Remove|Fix> --brief <slug> --target <FEATURE-ID> --title "…"
```

Folder = `specs/changes/<Type>-<CODE>-<brief>/` (no timestamp; the date is stamped only when it archives).

## Step 4 — Author the change (to `rules/change.md`)

- **`## <FEATURE-ID>` block** — Add: full spec at H3 (Problem/context, Requirements with `#### Requirement:`, Business
  rules, …). Modify/Remove/Fix: the delta only, requirement titles **matching** the live feature.
- **In scope** — the complete list this task delivers.
- **Out of scope — do NOT modify** — the fence. **Never leave it empty** (this is what stops the coding AI
  re-implementing the feature).
- **Code anchors** — copy `repo:path` rows from the target feature's `tech.md` traceability map (Modify/Fix).
- **acceptance.md** — only the new/changed criteria; set the change's `acceptance_stage` (`happy` while building).

## Step 5 — For a Modify/Remove/Fix, mark the live feature (do NOT edit its spec.md)

Add a pointer to the target feature's `meta.yml` so readers see "live, change incoming" — and **change nothing else**:
```yaml
pending_changes:
  - "<CODE> · changes/<Type>-<CODE>-<brief> · <one-line summary>"
```
The feature `spec.md` folds forward only on `archive` (skill `fold-change`). For an **Add** there is no feature yet, so
nothing to mark.

## Step 6 — Resolve open questions in chat, then validate

Push back like a sharp reviewer (run the lifecycle checklist in `rules/spec.md` §2): missing cases, contradictions,
scope risks. **Resolve every requirement-level decision in chat** (`AskUserQuestion`), fold each answer into the change
as a firm rule (do not park unknowns in the change). Then:
```bash
node tools/specs.mjs index && node tools/specs.mjs check
```
Both must pass. Hand off: *"give THIS change folder — not the whole feature spec — to the coding AI. It folds into the
feature when it ships (`fold-change`)."*
