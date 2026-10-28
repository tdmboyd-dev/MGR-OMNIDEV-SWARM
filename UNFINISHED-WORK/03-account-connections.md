# Account Connections

All items below are open. See [README.md](README.md) for status definitions and resume rules.

## AUTH-01 — Activate GitHub account access

**Priority:** P0 · **Type:** authorization-and-verification · **Owner:** Unassigned

**Current state:** Private-app registration, OAuth, encrypted sessions, refresh, repository selection and private import are implemented. HTTP boundary tests pass; live owner consent is unverified.

**Work required:**

- [ ] Owner registers the private app using the published flow and installs it on selected repositories.
- [ ] Complete account consent, select a test repository, import its snapshot and verify the authorized identity.
- [ ] Create one draft PR from a reviewed candidate; read back the branch and PR; verify disconnect and revoked access.

**Finished when:**

- [ ] A real authorized repository import and draft PR have provider-side evidence.
- [ ] Decline, revoke, refresh and disconnect behave correctly; no merge occurs.

**Depends on:** No prerequisite task recorded.

**Starting files:** `../lib/github-account.ts`, `../lib/repository.ts`

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## AUTH-02 — Implement approved ChatGPT plan access

**Priority:** P0 · **Type:** engineering-and-provider-approval · **Owner:** Unassigned

**Current state:** Workspace sign-in supplies identity only. Hosted ChatGPT plan inference is not implemented or approved. API adapters exist; key entry was removed from primary UI.

**Work required:**

- [ ] Obtain the provider-approved registration for the hosted app, or make an explicit local deployment choice and build that supported path.
- [ ] Implement the documented consent, nonce/PKCE where required, identity verification, protected session refresh and revocation.
- [ ] Discover account-specific models and handle streaming completion, declined plan use and usage limits.
- [ ] Integrate authorized inference with the existing job queue and display actual account/usage status.

**Finished when:**

- [ ] An eligible signed-in account completes real inference without pasting an API key.
- [ ] No model call occurs with identity-only consent, revoked permission or a declined usage grant.
- [ ] Account switching, limits and refresh are verified.

**Depends on:** No prerequisite task recorded.

**Starting files:** `../lib/providers.ts`, `../lib/jobs.ts`, `../components/runtime-workspace.tsx`

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## AUTH-03 — Add supported AI account adapters

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** A common account interface exists; Claude, Gemini and other account inference adapters are not implemented.

**Work required:**

- [ ] Select the first supported account paths and register applications or local clients according to each provider.
- [ ] Implement provider-specific consent and usage authorization; keep identity and model capability separate.
- [ ] Add disconnect, refresh, account switching, model discovery, rate limits and capability-specific errors.
- [ ] Do not treat Google login as permission to execute every AI model; do not copy consumer browser sessions.

**Finished when:**

- [ ] Each shipped provider has a real no-key sign-in and completed model request with evidence.
- [ ] Unavailable provider capabilities remain visibly unavailable rather than simulated.

**Depends on:** AUTH-02

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## AUTH-04 — Unify connection lifecycle and policies

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** System catalog registrations and GitHub account setup are separate flows.

**Work required:**

- [ ] Define one connection record with account, granted scopes, resource targets, capabilities, last success, sync state and revocation.
- [ ] Support multiple connections per provider and explicit project-to-connection mapping.
- [ ] Implement credential rotation/backup recovery and request-scoped identity isolation.
- [ ] Review OAuth refresh concurrency, expired state cleanup and credential-size/resource bounds.

**Finished when:**

- [ ] Connections report only verified capabilities and preserve errors without leaking tokens.
- [ ] Concurrent refresh/revocation and cross-account isolation pass meaningful tests.

**Depends on:** AUTH-01

**Starting files:** `../db/schema.ts`, `../lib/github-account.ts`

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.
