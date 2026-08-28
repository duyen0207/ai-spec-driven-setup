# ACCOUNT-password-reset — spec

> Owner per `spec.config.json.roles`. Current behaviour of the capability. Business language only.
> This is a **seed example** shipped with the `default` template — replace it with your app's real features.

## Problem / context

A user who has forgotten their password needs a self-service way to regain access without contacting support, while
keeping the account safe from someone who only knows the email address.

## Requirements

### Requirement: Request a reset link
The system SHALL let a user request a password reset by submitting their account email, and SHALL email a one-time
reset link to that address. To avoid leaking which emails have accounts, the on-screen confirmation is identical
whether or not the email matches an account.

#### Scenario: known email
- WHEN a user submits an email that matches an account
- THEN a reset link is emailed to it AND the screen shows "If that email is registered, we've sent a link."

#### Scenario: unknown email
- WHEN a user submits an email that matches no account
- THEN no email is sent AND the screen shows the **same** message as the known-email case.

### Requirement: Reset link validity
The system SHALL make each reset link valid for exactly **60 minutes** from the moment it is issued, and **single-use**.
Issuing a new link SHALL invalidate any previous unused link for that account.

#### Scenario: expired link
- WHEN a user opens a reset link more than 60 minutes after it was issued
- THEN the link is rejected AND the user is invited to request a new one.

#### Scenario: reused link
- WHEN a user opens a reset link that has already completed a reset
- THEN the link is rejected as already used.

### Requirement: Completing the reset
The system SHALL, on a valid link, let the user set a new password meeting the account password policy, SHALL sign out
all other active sessions for that account, and SHALL email a confirmation that the password was changed.

#### Scenario: successful reset
- WHEN a user sets a valid new password via a valid link
- THEN the password is updated, other sessions are signed out, and a "your password was changed" email is sent.

## Business rules

- Link validity: **60 minutes**, single-use (see Requirement: Reset link validity).
- New password must satisfy the standard account password policy (length + complexity).
- Completing a reset **signs out all other sessions** (the assumption: the account may be compromised).

## Use cases

1. As a **user who forgot my password**, when I request a reset and open the link within an hour, then I can set a new
   password and sign in.
2. As a **user whose email is not registered**, when I request a reset, then I see the same neutral confirmation and
   receive no email (no account-existence leak).

## UI / Design

- **Design link:** n/a (seed example)
- **Screens / states:** "Forgot password" form; neutral confirmation screen; "Set new password" form (valid link);
  "link expired / already used" screen; error and loading states.
- **Notable interactions:** submit disabled while sending; password-policy hints; success redirect to sign-in.

## Out of scope

- Multi-factor authentication and account recovery via phone/SMS.
- Admin-initiated password resets.
- Rate limiting of reset requests (defined but not yet built — see the in-flight change `DEMO-1`).
