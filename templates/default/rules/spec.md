# Rule: how to write `spec.md` (requirement / business / usecase)

> **Authoring rule of this repo** (the `default` template). Skills (`new-spec`, `reverse-spec`) **read this file and
> author to it** — edit the rule here and every skill uses the new version; do NOT inline it into the skills.
> Binding for both humans and AI, spec-first and reverse-engineered alike. Constitution: §5, §7.
> Write generated content in `spec.config.json.language`.

## 0. Core principle

- `spec.md` **always describes the CURRENT behaviour** of the capability. When a change alters it, the change folds
  the file forward (via `archive`); you never keep "v2"/old sections in the file. History lives in `meta.yml.history`.
- Readers of `spec.md` **do not read code**: BA, tester, support, marketing, newcomers. The bar:
  **a tester can write test cases — and support can answer a customer — from `spec.md` alone.**

## 1. Business language only — NO code in `spec.md`

- No file paths, repo names, function/class/variable names, line numbers, SQL, JSON, env vars.
- Name things by **business meaning** ("7-day grace period"), not implementation (`grace_period_ends_at`).
- Every link to code lives in **`tech.md`'s traceability map**. The only exception: a term that **is** the business
  vocabulary (e.g. a plan name) — then use it verbatim and explain it.

## 2. Cover the full lifecycle, not the happy path

A capability is only fully specified when **every event that can happen to the user** is answered. Sweep this
checklist — state the behaviour (or an explicit "n/a") for each applicable item:

- install / first use / onboarding; normal use; upgrade / downgrade / switch (plan, mode, config);
- **every time window the feature defines**: when it starts, what happens during, and **at expiry** (what locks, what
  data is kept, what the user sees, how to recover);
- cancel / unsubscribe → reactivate; uninstall → reinstall (what survives, for how long; do timers reset or continue?);
- external state changes (plan change, account paused / closed / frozen);
- refunds / disputes (including manual routes via support);
- invalid / unsupported / unexpected input (what exactly does the user see?);
- error, empty, loading states.

Cross-cutting: **money** (prices, formulas with **one worked example**, proration, rounding, currency);
**notifications** (every email / banner / toast — trigger + audience + timing + content); **manual / support
procedures** as part of behaviour; **data retention** (what survives leaving / expiry, and for how long);
**analytics** when the business depends on it.

## 3. Behaviour differs by segment → structure by segment

When rules differ by user (new vs grandfathered, free vs paid, early-bird…), **define the segment once**, then
specify **per segment × event**. Don't write "the user" when three groups behave three ways.

## 4. Numbers are part of the requirement

Durations, prices, limits, dates, %, thresholds — write the **exact value**, with **one worked example** per formula.
"A grace period" is not a requirement; "7 days from the end of the current billing cycle" is.

## 5. Flows are narrative

Trigger → step → step → outcome, from the **user's point of view**, including what they see on screen at each step and
what unblocks them when stuck. One flow per segment when they differ.

## 6. Boundaries are behaviour

For every window / limit / threshold: at the **exact** boundary, what happens? What locks? What is kept? What does the
user see? How do they get back?

## 7. Out of scope is explicit

List the "looks similar" things a reader might assume are included, and items **defined but not built**, to bound the
capability.

## Requirement blocks (so deltas fold deterministically)

Under `## Requirements`, write **addressable** blocks:

```md
### Requirement: <short, stable title>
The system SHALL <behaviour>.
#### Scenario: <name>
- WHEN <trigger>
- THEN <outcome>
```

A change's delta references these **by exact title** (`### MODIFIED Requirements` → `#### Requirement: <same title>`),
so `archive` folds it mechanically. Keep titles **stable**; renaming = REMOVE old + ADD new.

## "Open questions" — handled differently per flow

- **`new-spec` (spec-first):** the requester is right here → **resolve every question in chat** (AskUserQuestion), fold
  each answer into the spec as a firm rule, then **delete any "Open questions" section**. A spec-first `spec.md` ships
  with no unknowns — it is what the dev builds from.
- **`reverse-spec` (code-first):** "Open questions" is an **honest checklist** — each inference, each doc-vs-code
  contradiction, each config/flag whose live value you couldn't see → one bullet, phrased as the exact question a human
  must answer.
- **External detail is a pointer, not an open question** — "column list defined by `<template>`", "spacing per the
  design" → state as settled, with its source.

## Review checklist (paste into every review)

- [ ] Zero code references in `spec.md` (paths/symbols/lines are in `tech.md`).
- [ ] Every lifecycle event in §2 answered or marked "n/a".
- [ ] Segments defined; rules written per segment × event where they differ.
- [ ] Every number exact; every formula has a worked example.
- [ ] Every time window states its expiry behaviour (lock / keep / see / recover).
- [ ] Every notification has trigger + audience + timing.
- [ ] Manual / support procedures recorded.
- [ ] **A tester can write tests — and support can answer a customer — from this file alone.**
