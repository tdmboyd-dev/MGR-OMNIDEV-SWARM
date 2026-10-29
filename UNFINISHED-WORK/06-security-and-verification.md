# Security And Verification

All items below are open. See [README.md](README.md) for status definitions and resume rules.

## SEC-01 — Build real security intelligence

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Security signals are heuristic; no live vulnerability database, dependency advisory feed or comprehensive scanner exists.

**Work required:**

- [ ] Add supported SAST, dependency/SBOM/license and secret-scanning engines.
- [ ] Ingest authorized infrastructure, IAM, attack-surface and supply-chain evidence.
- [ ] Add CVE/advisory refresh, triage confidence, remediation plans and fix validation.
- [ ] Support threat indicators and penetration checks only for scoped authorized targets.

**Finished when:**

- [ ] Known vulnerabilities and remediations are validated against test fixtures and authorized targets.
- [ ] Coverage, false positives and source freshness are visible.

**Depends on:** RUN-01, GRAPH-02

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## SEC-02 — Implement authorization beyond a single owner

**Priority:** P0 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Owner-private Sites gateway is the access boundary. App-level tenant/project RBAC is not implemented.

**Work required:**

- [ ] Keep owner-private until a multi-user design is implemented.
- [ ] Define tenant, project and tool permissions; enforce server-side policy on every read/write/export.
- [ ] Add audit attribution, permission checks for shared memory, credentials and connector use.
- [ ] Test cross-tenant isolation, role escalation, malicious imported content and prompt injection.

**Finished when:**

- [ ] Unauthorized users cannot access any project data, credential or action.
- [ ] Sharing does not expose a previously single-owner API.

**Depends on:** No prerequisite task recorded.

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## SEC-03 — Complete credential and provider-boundary audit

**Priority:** P0 · **Type:** engineering · **Owner:** Unassigned

**Current state:** AES-GCM storage and several secret redaction patterns are implemented; no independent security review is complete.

**Work required:**

- [ ] Review OAuth state, redirect handling, replay, refresh races, response-size limits and token lifetimes.
- [ ] Review outbound origin enforcement, SSRF, archive/path handling, secret export/logging and revocation.
- [ ] Assess worker attestations: a bearer-authorized report is not independent proof of isolation.
- [ ] Add credential rotation, redaction evaluation and clear metadata-only status contracts.

**Finished when:**

- [ ] Security review findings are recorded and fixed or explicitly dispositioned.
- [ ] Tests exercise material failure paths and no secrets appear in logs/exports.

**Depends on:** No prerequisite task recorded.

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## QA-01 — Verify hosted end-to-end behavior

**Priority:** P0 · **Type:** engineering · **Owner:** Unassigned

**Current state:** 94 automated checks pass against SQLite/stubbed HTTP; production build passed. Hosted interaction and live external provider flows remain unverified.

**Work required:**

- [ ] Verify deployed routes, real D1 migration/read-back and owner access.
- [ ] Run browser journeys for import, connection, consent return, generation, review, PR, repair, rollback and export.
- [ ] Check network/provider failure recovery, keyboard use, loading and stale-data behavior.
- [ ] Record evidence separately for local tests, hosted app, live providers and isolated workers.

**Finished when:**

- [ ] Hosted user journeys and access boundaries pass with captured evidence.
- [ ] Publication alone is never recorded as external integration success.

**Depends on:** No prerequisite task recorded.

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## QA-02 — Test actual application behavior

**Priority:** P0 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Generated fixture tests only check snapshot integrity and a manifest property, not application behavior.

**Work required:**

- [ ] Discover project test frameworks and approved commands without running arbitrary shell instructions on the host.
- [ ] Run language/toolchain-specific unit, integration, API and critical user-flow tests in isolated workers.
- [ ] Capture build/lint/type/security evidence, coverage and regression results tied to commit.
- [ ] Allow review policy to require runtime evidence before apply/PR/release.

**Finished when:**

- [ ] Behavioral bugs and regressions cause meaningful failures.
- [ ] Passing snapshot-integrity checks is not presented as application correctness.

**Depends on:** RUN-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## QA-03 — Add performance, resilience and evaluation suites

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** No production load, chaos, agent-quality or business-model evaluation exists.

**Work required:**

- [ ] Define baselines and representative workload suites.
- [ ] Test queue concurrency, storage scale, cancellation/crash recovery and distributed failure.
- [ ] Evaluate agent output, specialist disagreement, false claims and task success.

**Finished when:**

- [ ] Measured results demonstrate stated capacity and reliability limits.
- [ ] Evaluation artifacts and failures remain searchable.

**Depends on:** QA-02, DATA-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## LEGAL-01 — Implement scoped compliance and legal auditing

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Compliance and Legal Auditing are domain definitions; there are no evidence collectors or jurisdiction-specific controls.

**Work required:**

- [ ] Choose applicable standards, jurisdictions and policies from real project context.
- [ ] Collect evidence and map controls, license/IP obligations, privacy and retention requirements.
- [ ] Track findings and qualified human review where required.

**Finished when:**

- [ ] Reports distinguish measured controls, missing evidence and legal interpretation.
- [ ] No unsupported certification or legal conclusion is issued.

**Depends on:** SEC-01, SEC-02, BIZ-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## Verified local update — October 29, 2026

QA-02 now records implemented_unverified. Actual behavioral bugs fail against the baseline, repaired cases pass, and 54 clean-source verification profiles pass. User-project toolchains and qualified isolated execution remain open.

See [the exact source-bound wave report](mgr-full-verification-wave-20261029.md) and canonical criterion register; earlier planning notes above are historical where they conflict. Original acceptance wording is preserved.
