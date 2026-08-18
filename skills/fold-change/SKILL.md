---
name: fold-change
description: Fold a shipped change into its target feature(s) — deterministically apply the change's ADDED/MODIFIED/REMOVED requirements to the feature spec (or CREATE the feature for a type-Add change), prepend a history line, drop the pending pointer, and archive the change. Use inside a generated <app>-specs/ repo when a change has merged/shipped ("fold the change", "archive change X", "the change shipped", "co-evolve the spec").
---

# fold-change — fold a shipped change into its feature(s)

When a change **ships** (its code merged to production), fold it into the source of truth. The fold is **deterministic
— no AI merge**: the engine matches the change's delta requirements into the feature's `## Requirements` by exact
title, or creates the feature for a `type: Add`. Your job is to confirm readiness, run it, and verify.

## Step 1 — Confirm the change actually shipped

Only fold what is **in production**. Check that the change's code merged (the whole point of "spec moves when reality
moves"). If it has not shipped, stop — the change stays in flight and `features/` stays the trustworthy "what's live"
record. If it was cancelled/re-scoped, just delete the change folder (the source of truth was never touched).

## Step 2 — Fold

```bash
node tools/specs.mjs archive <change-folder-name>
```

This will, per target in the change's `depends_on`:
- **type Add** → CREATE `specs/features/<ID>/` (`origin: folded`, `status` shipped) from the block's H3 content;
- **Modify/Remove/Fix** → patch the feature's `## Requirements` (add / replace-by-title / remove-by-title), fold the
  new/changed acceptance in, prepend a `history` line, drop the `pending_changes` pointer, and lower
  `acceptance_stage` to the least-mature of the two;

then move the change to `specs/changes/archive/<date>-<name>/`.

## Step 3 — Verify & report

```bash
node tools/specs.mjs index && node tools/specs.mjs check
```

Both must pass. Then **review the folded feature `spec.md`** — read it as the new current state and confirm it reads
cleanly (no dangling "before" text, requirement titles consistent). Address any `check` **warning** (e.g. "shipped but
acceptance_stage still happy" → prompt the owner to complete the full acceptance). Report to the user: which
feature(s) moved, the new history line, and the archived change path.

> Note: this MVP folds from the change's **intent** (the delta text). Folding from the **real merged code** (true
> co-evolve) is a later phase; until then, make sure the change's "After" text matched what actually shipped.
