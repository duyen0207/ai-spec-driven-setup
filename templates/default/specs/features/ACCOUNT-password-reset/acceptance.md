# ACCOUNT-password-reset — acceptance criteria & test checklist

> Owner per `spec.config.json.roles`. Seed example. `acceptance_stage: full`.

## Acceptance criteria

### AC-1: neutral confirmation
- **Given** the forgot-password form
- **When** any email is submitted (registered or not)
- **Then** the same "if that email is registered…" message is shown.

### AC-2: link expiry
- **Given** a reset link issued 61 minutes ago
- **When** the user opens it
- **Then** it is rejected and a new-link prompt is shown.

### AC-3: sessions signed out
- **Given** a user with two active sessions
- **When** they complete a password reset
- **Then** the other session is signed out and a confirmation email is sent.

## Test checklist
- [ ] Happy path: request → email → open within 60 min → set password → sign in.
- [ ] Edge case: unknown email yields no email and the neutral message.
- [ ] Edge case: expired (>60 min) and reused links are both rejected.
- [ ] Regression: existing sign-in is unaffected by a completed reset.

## Test data / setup
- One registered account with a known email; one unregistered email; a second active session for AC-3.
