# ACCOUNT-password-reset — technical notes

> Owner per `spec.config.json.roles`. Seed example — anchors are illustrative placeholders.

## Design overview / Architecture

Request/confirm split across a **web** entry (the forms) and an **api** auth module (token issue + verify + apply).
A reset **token** is a random, hashed, single-use secret with an expiry timestamp; the web layer never sees the raw
secret after issuing it. Pattern: stateless one-time-token with server-side hash + expiry.

## Data model

- `password_reset_tokens(token_hash, user_id, expires_at, used_at)` — `expires_at` encodes the 60-minute rule;
  `used_at` encodes single-use.

## Flow

1. Web `POST /account/password-reset` → api issues a token (or no-ops for unknown email), always returns the neutral
   response → email sent with the link.
2. Web `GET /account/password-reset/:token` → api verifies hash + `expires_at` + `used_at`.
3. Web `POST` new password → api validates policy, updates the credential, sets `used_at`, revokes other sessions,
   sends the confirmation email.

## External APIs / integrations
- Transactional email provider for the reset + confirmation emails.

## Risks / gotchas
- Timing/response must be identical for known vs unknown email (no account-existence leak).
- Token must be hashed at rest; compare in constant time.

## Notes for AI codegen
- Reuse the existing session-revocation helper; do not roll a new one.

## Traceability map
| Spec rule / section | Code anchor(s) |
| --- | --- |
| Requirement: Request a reset link | web:src/routes/account/password-reset.*, api:src/modules/auth/password-reset.request.* |
| Requirement: Reset link validity | api:src/modules/auth/password-reset.token.* |
| Requirement: Completing the reset | api:src/modules/auth/password-reset.apply.* |
