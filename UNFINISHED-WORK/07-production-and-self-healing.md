# Production And Self Healing

All items below are open. See [README.md](README.md) for status definitions and resume rules.

## OPS-01 — Ingest real health telemetry

**Priority:** P0 · **Type:** engineering · **Owner:** Unassigned

**Current state:** No live target telemetry or production incident stream is connected.

**Work required:**

- [ ] Define target/project identity, authenticated ingestion, metrics/logs/traces and event deduplication.
- [ ] Add health rules, SLOs, baseline deviations, alerts and incident correlation.
- [ ] Verify freshness and distinguish silence from healthy operation.

**Finished when:**

- [ ] Authorized target failures produce accurate incidents and recoveries with timestamps.
- [ ] Stale/missing telemetry cannot produce a false healthy state.

**Depends on:** INT-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## OPS-02 — Build production diagnosis and repair loop

**Priority:** P0 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Self-healing currently repairs stored snapshot documentation/test gaps; it does not heal production infrastructure.

**Work required:**

- [ ] Diagnose incidents using telemetry, deployment history and the graph.
- [ ] Generate scoped repairs, validate them on a representative twin/staging target and evaluate impact.
- [ ] Add policy for review versus authorized automatic actions, rollout windows and maximum blast radius.
- [ ] Monitor post-change outcomes and learn from successful/failed repairs.

**Finished when:**

- [ ] An induced test-environment incident is detected, diagnosed, repaired, checked and safely rolled back on failure.
- [ ] No unsupported production action is claimed or performed.

**Depends on:** OPS-01, OPS-03, TWIN-01, QA-02

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## OPS-03 — Add deployment and rollback adapters

**Priority:** P0 · **Type:** engineering-and-target-authorization · **Owner:** Unassigned

**Current state:** No production deployment adapter or authorized deployment target exists.

**Work required:**

- [ ] Choose target-specific adapters with least-privilege credentials and environment/resource selectors.
- [ ] Implement plan/diff, staged deployment, health gates, rollback and operation idempotency.
- [ ] Handle databases, infrastructure and application release compatibility together.

**Finished when:**

- [ ] A real authorized staging deployment and rollback are verified.
- [ ] Wrong-target, stale-plan and unsafe/destructive actions are rejected.

**Depends on:** RUN-01, AUTH-04

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## OPS-04 — Operate OmniDev itself reliably

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Sites publication succeeds, but platform SLOs, alerts, incident response and supervised workers are not established.

**Work required:**

- [ ] Instrument runtime, queue, D1, provider errors, costs and worker availability.
- [ ] Add runbooks, error budgets, on-call/ownership and recovery procedures.
- [ ] Configure recurring maintenance only with a declared schedule and authorized runtime.

**Finished when:**

- [ ] Platform outages and stale workers generate actionable alerts.
- [ ] Recovery and maintenance runbooks are exercised.

**Depends on:** RUN-01, DATA-03

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.
