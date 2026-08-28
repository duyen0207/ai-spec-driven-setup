# Change: Throttle password-reset requests + add a rate limit (DEMO-1)

> **Transient delta — NOT the source of truth.** Seed example shipped with the `default` template. Hand THIS folder to
> the coding AI, not the whole feature spec. `type: Modify` → delta; folds into ACCOUNT-password-reset on `archive`.

## ACCOUNT-password-reset

### MODIFIED Requirements

#### Requirement: Request a reset link
The system SHALL let a user request a password reset by submitting their account email, and SHALL email a one-time
reset link to that address. To avoid leaking which emails have accounts, the on-screen confirmation is identical
whether or not the email matches an account. Requests SHALL be **throttled**: a new reset email is sent at most once
every **60 seconds** per email address; requests inside that window return the same neutral confirmation but send no
additional email.

##### Scenario: known email
- WHEN a user submits an email that matches an account and none was requested in the last 60 seconds
- THEN a reset link is emailed AND the screen shows "If that email is registered, we've sent a link."

##### Scenario: repeated request within 60 seconds
- WHEN a second request for the same email arrives within 60 seconds
- THEN no additional email is sent AND the same neutral confirmation is shown.

### ADDED Requirements

#### Requirement: Reset request rate limit
The system SHALL block further reset requests for an email once **5** requests have been made within **1 hour**, for
the remainder of that hour, returning the neutral confirmation without sending email. The counter resets 1 hour after
the first counted request.

##### Scenario: over the hourly cap
- WHEN a 6th reset request for the same email arrives within one hour
- THEN it is silently dropped (neutral confirmation, no email) until the hour elapses.

## In scope — implement EXACTLY this
1. 60-second per-email send throttle on reset requests.
2. Hourly cap of 5 reset requests per email.

## Out of scope — do NOT modify
- The reset link validity window (60 min, single-use) and the completing-the-reset flow.
- The neutral known/unknown-email confirmation behaviour (keep it identical).
- Session revocation and the confirmation email.

## Code anchors — where the change lands
- api:src/modules/auth/password-reset.request.* — add throttle + hourly cap before issuing a token.

## Notes for the coding AI
- Make the smallest change that satisfies *In scope*. Do not touch token validity or the apply flow.
- Keep known/unknown-email responses identical; the throttle must not leak account existence.
