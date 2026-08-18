# Change: {{TITLE}} ({{TASK}})

> **Transient delta — NOT the source of truth.** Hand THIS folder (not the whole feature spec) to the coding AI.
> One `## <FEATURE-ID>` block per target. `type: Add` → author the FULL spec at H3 (fold promotes to H2 and CREATES
> the feature). `type: Modify|Remove|Fix` → author a DELTA with `### ADDED/MODIFIED/REMOVED Requirements`, each holding
> `#### Requirement: <title>` (match live titles). See `rules/change.md`.

{{FEATURE_BLOCKS}}

## In scope — implement EXACTLY this
1.

## Out of scope — do NOT modify
<!-- The near-by behaviour the AI must leave untouched. This fence prevents re-building the feature. NEVER empty. -->
-

## Code anchors — where the change lands
<!-- Copy the relevant "<repo>:<path>" rows from the target feature's tech.md traceability map. -->
-

## Notes for the coding AI
- Make the **smallest** change that satisfies *In scope*. Do not refactor / rename / restyle outside the anchors.
- If *In scope* conflicts with the feature spec or is ambiguous, stop and flag it; do not guess.
