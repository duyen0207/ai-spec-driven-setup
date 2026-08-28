# Change DEMO-1 — new / changed acceptance criteria

> Only the ACs this change adds/changes; the feature's full acceptance.md still governs the rest. Fold into the
> feature on `archive`.

## Acceptance criteria (new / changed)

### AC-1: 60-second throttle
- **Given** a reset was just requested for an email
- **When** another request for the same email arrives within 60 seconds
- **Then** no second email is sent and the neutral confirmation is shown.

### AC-2: hourly cap
- **Given** 5 reset requests were made for an email within the last hour
- **When** a 6th arrives within that hour
- **Then** it is dropped (no email) until the hour elapses.

## Test checklist
- [ ] Happy path: throttle blocks the 2nd email within 60s; 1st still arrives.
- [ ] Regression: known/unknown-email responses remain identical (no account-existence leak).
