# Agent Runtime

All items below are open. See [README.md](README.md) for status definitions and resume rules.

## RUN-01 — Attach a real isolated worker host

**Priority:** P0 · **Type:** infrastructure-and-authorization · **Owner:** Unassigned

**Current state:** Portable Docker runner and authenticated worker API are implemented; no continuously running worker or real Docker execution is verified.

**Work required:**

- [ ] Select an owner-authorized Docker host; Vercel is not required.
- [ ] Provision the runtime, pinned image digest, least-privilege service identity and protected worker/gateway credentials.
- [ ] Start a supervised service with heartbeat, restart policy and durable logs.
- [ ] Run actual candidate tests in isolation and verify timeout, output limit, no network, file restrictions and cleanup.

**Finished when:**

- [ ] At least one real isolated run reports evidence to the hosted queue.
- [ ] Worker survives restart and rejects unauthorized requests without exposing credentials.

**Depends on:** No prerequisite task recorded.

**Starting files:** `../worker/runner.mjs`, `../worker/README.md`, `../app/api/worker/route.ts`

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## RUN-02 — Turn swarm definitions into executable specialists

**Priority:** P0 · **Type:** engineering · **Owner:** Unassigned

**Current state:** 47 master domains and nested definitions exist. AI jobs execute a root call and at most two specialist reviews, using stubbed providers in tests.

**Work required:**

- [ ] Build capability-based agent registry with domain instructions, approved tools and measurable outputs.
- [ ] Add durable parent/child tasks, domain discovery, expert creation and aggregation.
- [ ] Support deeper execution only within explicit total cost, depth, concurrency and deadline budgets.
- [ ] Reconcile proposed versus executed agents and expose lineage and actual work.

**Finished when:**

- [ ] Nested specialist execution completes with real provider evidence and durable lineage.
- [ ] Budget exhaustion, cancellation and partial failures stop work predictably.

**Depends on:** AUTH-02, RUN-01

**Starting files:** `../lib/jobs.ts`, `../lib/catalog.ts`

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## RUN-03 — Harden durable orchestration and recovery

**Priority:** P0 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Leases, retries, cancellation and expired-lease recovery are implemented in D1.

**Work required:**

- [ ] Review lease heartbeat/extension for long jobs and clock/timeout behavior.
- [ ] Add idempotency keys for enqueue, concurrent PR creation and worker evidence writes.
- [ ] Add queue fairness, backpressure, job/artifact retention and per-project budgets.
- [ ] Verify cancellation during provider calls and specialist review, stale reporters, process death and retry recovery.
- [ ] Review active-job limit enforcement under concurrent enqueue.

**Finished when:**

- [ ] Concurrent workers do not duplicate effects or overwrite newer results.
- [ ] Crash/retry tests produce correct terminal states and auditable recovery.

**Depends on:** RUN-01

**Starting files:** `../lib/jobs.ts`, `../lib/repository.ts`

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## DEV-01 — Build general code generation and refactoring

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Native mode only creates missing README and snapshot-integrity tests. AI candidates and exact-baseline patches are implemented, with stubbed model execution.

**Work required:**

- [ ] Support scoped feature, bug fix, refactor, migration and architecture objectives.
- [ ] Use repository context retrieval, language-aware patching and artifact provenance.
- [ ] Handle multi-file edits, renames/deletions, large files and dependencies through explicit contracts.
- [ ] Validate results against intended behavior and preserve review/rollback baselines.

**Finished when:**

- [ ] Real coding tasks change application behavior correctly and pass relevant tests.
- [ ] Unsupported edits and stale baselines are rejected with recoverable errors.

**Depends on:** AUTH-02, RUN-01, QA-02

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## DEV-02 — Complete repository delivery and CI evidence

**Priority:** P0 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Draft PR adapter and baseline checks are implemented; remote writes are stubbed in tests.

**Work required:**

- [ ] Verify GitHub App permissions, private/organization repository behavior, branch protection and selected-installation scope.
- [ ] Add CI run/status/artifact ingestion tied to candidate commit.
- [ ] Reconcile partial PR creation failures, existing closed/modified branches and concurrent requests.
- [ ] Keep merge policy explicit; add reviewed merge support only when requested and authorized.

**Finished when:**

- [ ] A real branch → candidate → tests → draft PR flow is proven on a test repository.
- [ ] Retry cannot silently duplicate or overwrite unrelated work.

**Depends on:** AUTH-01, RUN-01, QA-02

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## DEV-03 — Generate delivery, migration and infrastructure artifacts

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** No specialized CI/CD, schema migration or infrastructure generation workflow exists.

**Work required:**

- [ ] Add version-aware generators for delivery pipelines, database migrations and infrastructure plans.
- [ ] Validate manifests, migration reversibility, policy checks and infrastructure diffs in isolation.
- [ ] Add staged environment selection and reviewable execution artifacts.

**Finished when:**

- [ ] Representative generated artifacts validate and run in an authorized test environment.
- [ ] Destructive changes and unsupported versions cannot execute silently.

**Depends on:** DEV-01, OPS-03

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## Verified local update — October 29, 2026

RUN-03 now records implemented_unverified: atomic recovery preserves result evidence and durable audits, with concurrent/stale/audit-failure regressions passing. Real multi-host and external effects remain open.

DEV-01/AC-02 has separately recorded local validation evidence; broader code generation/refactoring remains open.

See [the exact source-bound wave report](mgr-full-verification-wave-20261029.md) and canonical criterion register; earlier planning notes above are historical where they conflict. Original acceptance wording is preserved.
