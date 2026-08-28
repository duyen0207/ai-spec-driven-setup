# Rule: how to write a `change` (the delta one task makes to the specs)

> **Authoring rule of this repo** (`default` template), read directly by `new-spec`. Constitution: §4, §5.
> A change is a **first-class, tracked** unit of work that **folds** into `features/` on `archive`. Write generated
> content in `spec.config.json.language`.

## 0. Two kinds of change — ONE file format

Both kinds live in `specs/changes/<Type>-<TASK>-<brief>/` and use `## <FEATURE-ID>` blocks in `spec.md`:

- **`type: Add`** — a **brand-new capability**. The block holds the **full** spec, authored **one heading level
  deeper** than a feature spec (`### Problem / context`, `### Requirements` with `#### Requirement: <title>`,
  `### Business rules`, …). On `archive` the block is **promoted to H2 and CREATES** `specs/features/<ID>/`.
- **`type: Modify | Remove | Fix`** — a **delta** to an existing capability. The block holds only what moves, under
  `### ADDED Requirements`, `### MODIFIED Requirements`, `### REMOVED Requirements`, each with `#### Requirement:
  <title>` blocks. On `archive` these are matched into the feature's `## Requirements` **by exact title** and applied.

"Full vs delta" is **not two formats** — it is the same format; an Add just happens to be all-ADDED. The requirement
block format (`Requirement:` + `Scenario:`) and the quality bar of `rules/spec.md` apply to the "After" text in both.

## 1. Why a change is not the whole spec (state vs delta)

`spec.md` describes the capability's **current state**; a task is a **delta**. Handing the whole feature spec to a
coding AI for a small change makes it load the entire capability and re-implement things the task never asked for.
The change folder is the small, self-contained thing the dev hands over instead.

## 2. The Out-of-scope fence matters more than a short spec

The instinct "make the spec shorter so the AI doesn't over-build" is the wrong lever. What stops the AI re-coding the
feature is an **explicit Out-of-scope / do-NOT-touch list + targeted code anchors** — not a shorter document. The
feature spec stays as large and complete as it needs to be; it is a **reference**, not a build list.
**Never leave the Out-of-scope fence empty.**

## 3. `spec.md` moves only when the change SHIPS

For an existing capability, do **not** rewrite the feature's `spec.md` when the change opens — it must stay the
trustworthy "what's in production now" record. Instead:

- author the delta in the change's `spec.md` ("After" = the proposed new text);
- add a `pending_changes` pointer to the feature's `meta.yml` (so readers see "live, change incoming");
- leave the feature `spec.md` untouched.

On `archive` (the change ships), `node tools/specs.mjs archive <change>` folds the delta in, prepends a `history`
line, and drops the `pending_changes` pointer — deterministically, no AI. A cancelled change is just deleted; the
source of truth was never polluted.

## 4. Filling a change

- **`## <FEATURE-ID>` block(s)** — one per target in `depends_on`. Add (full spec, H3) or delta (ADDED/MODIFIED/
  REMOVED, `#### Requirement:` matching live titles).
- **In scope** — the *complete* list this task delivers. If it's not listed, it's not in the task.
- **Out of scope — do NOT modify** — the fence (§2). Never empty.
- **Code anchors** — copy the relevant `repo:path` rows from the target feature's `tech.md` traceability map.
- **acceptance.md** — only the new/changed criteria (see `rules/acceptance.md`).
- Keep the **Notes for the coding AI** block (smallest change; don't refactor untouched code).

Scaffold with: `node tools/specs.mjs change --task <CODE> --type <Type> --brief <slug> --target <FEATURE-ID>`.
