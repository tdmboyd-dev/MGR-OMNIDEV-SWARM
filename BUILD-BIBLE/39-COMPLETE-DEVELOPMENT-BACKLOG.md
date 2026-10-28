# Complete development backlog — canonical ledger

156 open parent tasks with 49 nested reviewer work packages. Generated from UNFINISHED-WORK/backlog.json; that JSON remains authoritative.

## AUTH-01 — Activate GitHub account access

Status: open; priority: P0; owner: Unassigned; kind: authorization-and-verification.

Current: Private-app registration, OAuth, encrypted sessions, refresh, repository selection and private import are implemented. HTTP boundary tests pass; live owner consent is unverified.

### Required work

- Owner registers the private app using the published flow and installs it on selected repositories.
- Complete account consent, select a test repository, import its snapshot and verify the authorized identity.
- Create one draft PR from a reviewed candidate; read back the branch and PR; verify disconnect and revoked access.

### Acceptance evidence

- A real authorized repository import and draft PR have provider-side evidence.
- Decline, revoke, refresh and disconnect behave correctly; no merge occurs.

Dependencies: none.

## AUTH-02 — Implement approved ChatGPT plan access

Status: open; priority: P0; owner: Unassigned; kind: engineering-and-provider-approval.

Current: Workspace sign-in supplies identity only. Hosted ChatGPT plan inference is not implemented or approved. API adapters exist; key entry was removed from primary UI.

### Required work

- Obtain the provider-approved registration for the hosted app, or make an explicit local deployment choice and build that supported path.
- Implement the documented consent, nonce/PKCE where required, identity verification, protected session refresh and revocation.
- Discover account-specific models and handle streaming completion, declined plan use and usage limits.
- Integrate authorized inference with the existing job queue and display actual account/usage status.

### Acceptance evidence

- An eligible signed-in account completes real inference without pasting an API key.
- No model call occurs with identity-only consent, revoked permission or a declined usage grant.
- Account switching, limits and refresh are verified.

Dependencies: none.

### BP-02 — Account-first UI can be mistaken for approved hosted model usage or live GitHub write integration.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P0; chapter 1 MVP/current state
Resolution: Present an access matrix separating OmniDev identity, repository grant, model entitlement and worker execution. Unsupported pathways stay named blockers. No fallback silently increases cost or sends data to a new provider.
Acceptance: Real owner-consented repository import, revoke, model receipt, worker isolation receipt and exact-target draft PR in the same scenario.

## AUTH-03 — Add supported AI account adapters

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: A common account interface exists; Claude, Gemini and other account inference adapters are not implemented.

### Required work

- Select the first supported account paths and register applications or local clients according to each provider.
- Implement provider-specific consent and usage authorization; keep identity and model capability separate.
- Add disconnect, refresh, account switching, model discovery, rate limits and capability-specific errors.
- Do not treat Google login as permission to execute every AI model; do not copy consumer browser sessions.

### Acceptance evidence

- Each shipped provider has a real no-key sign-in and completed model request with evidence.
- Unavailable provider capabilities remain visibly unavailable rather than simulated.

Dependencies: AUTH-02.

## AUTH-04 — Unify connection lifecycle and policies

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: System catalog registrations and GitHub account setup are separate flows.

### Required work

- Define one connection record with account, granted scopes, resource targets, capabilities, last success, sync state and revocation.
- Support multiple connections per provider and explicit project-to-connection mapping.
- Implement credential rotation/backup recovery and request-scoped identity isolation.
- Review OAuth refresh concurrency, expired state cleanup and credential-size/resource bounds.

### Acceptance evidence

- Connections report only verified capabilities and preserve errors without leaking tokens.
- Concurrent refresh/revocation and cross-account isolation pass meaningful tests.

Dependencies: AUTH-01.

### BP-07 — “Consent pending” does not fully specify delayed admin approvals, organizational ownership transfer or partner installation handoff.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P1; experience onboarding/core flows
Resolution: A resumable connection state machine records requested scopes, initiating user, organization owner, provider application, pending admin and expiry. Tenant admin handoff never sends credentials.
Acceptance: Different requester/approver users finish or deny setup; abandoned callback, removed owner, changed scope and revoked app preserve clear status.

## RUN-01 — Attach a real isolated worker host

Status: open; priority: P0; owner: Unassigned; kind: infrastructure-and-authorization.

Current: Portable Docker runner and authenticated worker API are implemented; no continuously running worker or real Docker execution is verified.

### Required work

- Select an owner-authorized Docker host; Vercel is not required.
- Provision the runtime, pinned image digest, least-privilege service identity and protected worker/gateway credentials.
- Start a supervised service with heartbeat, restart policy and durable logs.
- Run actual candidate tests in isolation and verify timeout, output limit, no network, file restrictions and cleanup.

### Acceptance evidence

- At least one real isolated run reports evidence to the hosted queue.
- Worker survives restart and rejects unauthorized requests without exposing credentials.

Dependencies: none.

## RUN-02 — Turn swarm definitions into executable specialists

Status: open; priority: P0; owner: Unassigned; kind: engineering.

Current: 47 master domains and nested definitions exist. AI jobs execute a root call and at most two specialist reviews, using stubbed providers in tests.

### Required work

- Build capability-based agent registry with domain instructions, approved tools and measurable outputs.
- Add durable parent/child tasks, domain discovery, expert creation and aggregation.
- Support deeper execution only within explicit total cost, depth, concurrency and deadline budgets.
- Reconcile proposed versus executed agents and expose lineage and actual work.

### Acceptance evidence

- Nested specialist execution completes with real provider evidence and durable lineage.
- Budget exhaustion, cancellation and partial failures stop work predictably.

Dependencies: AUTH-02, RUN-01.

### AK-08 — topology optimization can violate accountability during a live handoff

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** A / “Fractal operations”; E / “Organization optimization”.

Draining and singular ownership are stated, but task ownership, review ownership, message subscriptions and financial allocation can transition at different times. A late accepted result after a department merge can have no authorized reviewer or two conflicting owners.

**Resolution:** topology migration plan includes source/destination generation, ownership transfer points, frozen tasks, reviewer continuity, allocation references and rollback. Use fenced ownership compare-and-swap per task; reorganization status becomes complete only when orphan/duplicate ownership checks pass. Keep dissent and appeal handlers independent of the reorganized subject.

**Gate:** late result, active review, cancelled transfer and rollback during handoff; every task has exactly one effective owner, no duplicated authority and a valid reviewer path.

## RUN-03 — Harden durable orchestration and recovery

Status: open; priority: P0; owner: Unassigned; kind: engineering.

Current: Leases, retries, cancellation and expired-lease recovery are implemented in D1.

### Required work

- Review lease heartbeat/extension for long jobs and clock/timeout behavior.
- Add idempotency keys for enqueue, concurrent PR creation and worker evidence writes.
- Add queue fairness, backpressure, job/artifact retention and per-project budgets.
- Verify cancellation during provider calls and specialist review, stale reporters, process death and retry recovery.
- Review active-job limit enforcement under concurrent enqueue.

### Acceptance evidence

- Concurrent workers do not duplicate effects or overwrite newer results.
- Crash/retry tests produce correct terminal states and auditable recovery.

Dependencies: RUN-01.

## DEV-01 — Build general code generation and refactoring

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Native mode only creates missing README and snapshot-integrity tests. AI candidates and exact-baseline patches are implemented, with stubbed model execution.

### Required work

- Support scoped feature, bug fix, refactor, migration and architecture objectives.
- Use repository context retrieval, language-aware patching and artifact provenance.
- Handle multi-file edits, renames/deletions, large files and dependencies through explicit contracts.
- Validate results against intended behavior and preserve review/rollback baselines.

### Acceptance evidence

- Real coding tasks change application behavior correctly and pass relevant tests.
- Unsupported edits and stale baselines are rejected with recoverable errors.

Dependencies: AUTH-02, RUN-01, QA-02.

## DEV-02 — Complete repository delivery and CI evidence

Status: open; priority: P0; owner: Unassigned; kind: engineering.

Current: Draft PR adapter and baseline checks are implemented; remote writes are stubbed in tests.

### Required work

- Verify GitHub App permissions, private/organization repository behavior, branch protection and selected-installation scope.
- Add CI run/status/artifact ingestion tied to candidate commit.
- Reconcile partial PR creation failures, existing closed/modified branches and concurrent requests.
- Keep merge policy explicit; add reviewed merge support only when requested and authorized.

### Acceptance evidence

- A real branch → candidate → tests → draft PR flow is proven on a test repository.
- Retry cannot silently duplicate or overwrite unrelated work.

Dependencies: AUTH-01, RUN-01, QA-02.

## DEV-03 — Generate delivery, migration and infrastructure artifacts

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: No specialized CI/CD, schema migration or infrastructure generation workflow exists.

### Required work

- Add version-aware generators for delivery pipelines, database migrations and infrastructure plans.
- Validate manifests, migration reversibility, policy checks and infrastructure diffs in isolation.
- Add staged environment selection and reviewable execution artifacts.

### Acceptance evidence

- Representative generated artifacts validate and run in an authorized test environment.
- Destructive changes and unsupported versions cannot execute silently.

Dependencies: DEV-01, OPS-03.

## GRAPH-01 — Build a unified typed intelligence graph

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Graph extracts files, simple declarations/imports and manifest dependencies from snapshots. No full semantic or cross-system graph exists.

### Required work

- Define typed nodes and edges for files, classes, functions, methods, schemas, tables, APIs, services, deployments, assets, flows, decisions, documentation, conversations, cost and revenue.
- Add stable identities, provenance, timestamps, ownership and permission boundaries.
- Implement cross-source entity resolution, incremental updates and graph queries.
- Represent unresolved/isolated entities honestly and reconcile them as evidence arrives.

### Acceptance evidence

- Multiple connected systems share verified cross-source relationships.
- Updates/deletes do not leave stale edges or reveal unauthorized nodes.

Dependencies: DATA-01, INT-01.

### AK-13 — identity merge and split need downstream revision semantics

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** K / “Canonical objects”, “Relationship semantics and constraints”, “Knowledge APIs”.

Reversible mappings are specified but not how accepted decisions, citation selectors, external references and task targets behave after a split. Repointing all historical references can falsify which entity an earlier decision targeted.

**Resolution:** identity mappings are temporal assertions; historic references remain bound to original IDs and versions. New current queries resolve through reviewed maps with ambiguity flags. Split impact plan invalidates affected projections and decision/task assumptions; an external-action target is always re-resolved and approved at exact revision.

**Gate:** wrong merge then split; historical answers retain original evidence; tasks targeting an ambiguous merged entity cannot execute; current citations resolve without misleading attribution.

## GRAPH-02 — Add language-aware and runtime discovery

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Regex extraction does not establish full function/method signatures, business rules, dynamic behavior or runtime call relationships.

### Required work

- Add supported language parsers, API/schema discovery and infrastructure inventory.
- Ingest traces, deployments, user flows and business rules through approved adapters.
- Version analysis and preserve confidence/coverage per source.

### Acceptance evidence

- Fixtures and authorized real projects show correct entities and relationships.
- Unsupported languages and incomplete snapshots are labeled as coverage gaps.

Dependencies: GRAPH-01.

## GAP-01 — Expand the missing-things engine

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Rules check some secrets/SQL/eval, accessibility markers, TODOs and presence of tests/docs/CI/telemetry.

### Required work

- Build evidence-based rules for missing pages, APIs, workflows, validation, security controls, monitoring, integrations, automation, architecture layers, accessibility and scale planning.
- Evaluate expectations against project type, requirements, user flows and repository coverage.
- Add product, monetization and opportunity gaps with explicit hypotheses and supporting research.
- Deduplicate findings, refresh dispositions and explain why each gap should exist.

### Acceptance evidence

- Known gaps are detected with actionable evidence and acceptable measured false-positive rates.
- Incomplete snapshots and business hypotheses do not become unsupported factual claims.

Dependencies: GRAPH-02, BIZ-01.

## DATA-01 — Expand persistence and artifact storage

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: D1 stores records, snapshots, jobs and encrypted settings. R2 is not configured.

### Required work

- Normalize growing graph/job data where appropriate and add pagination/indexes instead of fixed record scans.
- Add artifact/blob storage for large snapshots, test logs, generated assets and 3D files.
- Define quotas, retention, source versioning, artifact hashes and cleanup.
- Implement complete service-owned PostgreSQL migrations with same-tenant/same-project lineage, cycle prevention, valid state transitions, currency constraints, restricted roles and RLS-safe pooling.

### Acceptance evidence

- Large projects remain responsive within measured budgets.
- Artifacts have provenance, access controls and reliable lifecycle cleanup.
- Migrations run on the selected PostgreSQL version from empty/prior schemas; wrong-project links, cycle races, BYPASSRLS/owner contexts and pooled tenant leakage are rejected.

Dependencies: none.

### SI-07 — Reference SQL has service-level obligations that cannot be mistaken for database guarantees

Open review work package. Source: BUILD-BIBLE/reviews/security-infrastructure.md.

**Priority:** P0 before schema implementation acceptance. **Source:** `PRODUCTION-ARCHITECTURE/contracts/core-schema.sql` and chapter 16.

The SQL deliberately does not implement a complete ledger posting procedure or project authorization model. Same-tenant foreign keys alone permit references between different projects/runs inside a tenant unless service checks reject them. Parent-agent/task checks prevent self-links but not longer cycles. Reservation currency equality, settled-versus-maximum policy, valid states and balanced immutable journal groups require further constraints/procedures. A schema-file validator is not a PostgreSQL integration test and does not prove RLS under real service roles.

**Resolved design:** Each owning service supplies complete migrations, restricted roles and cross-entity invariants. Validate same-project/run lineage where required; use transactional cycle/fence checks; constrain state transitions; implement currency-consistent reservations and immutable balanced posting. Cost above the reserved maximum becomes a reconciliation/debt incident governed by billing policy rather than silently violating a ceiling or discarding a real provider bill. Create migration/backfill roles separately and test their limited use. Keep the reference SQL labeled until real migrations run on the supported PostgreSQL version.

**Proof required:** Execute migrations from empty and prior schema; role/BYPASSRLS/owner checks; same-tenant wrong-project links; cycle race; invalid state; mismatched currency; duplicate receipt; immutable correction postings; group imbalance; transaction-local context leakage. The service review must identify exactly which invariants live in SQL and which in code.

## DATA-02 — Build durable searchable global memory

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Activity and manually saved decisions persist; full searchable lifelong memory is not implemented.

### Required work

- Ingest decisions, bug/deployment history, debt, feature evolution, roadmaps, research, business/security/performance context.
- Add full-text/semantic retrieval with source references, project scope and version lineage.
- Add corrections, deletion/export and explicit retention policies; preserve durable backups rather than promise literal forever.

### Acceptance evidence

- Relevant historical evidence can be retrieved across project versions with provenance.
- Access, correction, retention and deletion are verified.

Dependencies: DATA-01, SEC-02.

### AK-16 — decision memory needs authority expiration and reversal effects

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** K / “Decision schema and lifecycle”; A / “Bounded debate algorithm”.

An accepted historic decision remains searchable, but must not authorize a later action after source, target, regulation, budget or accountable signer changes.

**Resolution:** separate historic accepted-decision record from current effective policy/action authorization. Decision applicability has version, expiry/review date and dependency conditions. Reversal creates a new decision plus implementation obligations; do not silently erase the old rationale or assume reversal compensates deployed effects.

**Gate:** expired accepted decision, withdrawn approver authority, target revision change and superseded architecture; historical display remains accurate while new dispatch requires current authorization.

## Research and evolution hostile review

## DATA-03 — Add backup, restore and disaster recovery

Status: open; priority: P0; owner: Unassigned; kind: engineering.

Current: Snapshot rollback is implemented; database backup/vault-key rotation and disaster recovery are unverified.

### Required work

- Document protected database/artifact/credential backup and restore procedures.
- Implement vault-key rotation and recovery without committing secrets.
- Choose recovery objectives and run restore drills with audit evidence.

### Acceptance evidence

- A clean environment restores approved data and artifacts successfully.
- Lost/rotated credentials fail safely and can be reauthorized.

Dependencies: none.

## SEC-01 — Build real security intelligence

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Security signals are heuristic; no live vulnerability database, dependency advisory feed or comprehensive scanner exists.

### Required work

- Add supported SAST, dependency/SBOM/license and secret-scanning engines.
- Ingest authorized infrastructure, IAM, attack-surface and supply-chain evidence.
- Add CVE/advisory refresh, triage confidence, remediation plans and fix validation.
- Support threat indicators and penetration checks only for scoped authorized targets.

### Acceptance evidence

- Known vulnerabilities and remediations are validated against test fixtures and authorized targets.
- Coverage, false positives and source freshness are visible.

Dependencies: RUN-01, GRAPH-02.

## SEC-02 — Implement authorization beyond a single owner

Status: open; priority: P0; owner: Unassigned; kind: engineering.

Current: Owner-private Sites gateway is the access boundary. App-level tenant/project RBAC is not implemented.

### Required work

- Keep owner-private until a multi-user design is implemented.
- Define tenant, project and tool permissions; enforce server-side policy on every read/write/export.
- Add audit attribution, permission checks for shared memory, credentials and connector use.
- Test cross-tenant isolation, role escalation, malicious imported content and prompt injection.

### Acceptance evidence

- Unauthorized users cannot access any project data, credential or action.
- Sharing does not expose a previously single-owner API.

Dependencies: none.

### AK-14 — authorization-sensitive ranking needs side-channel qualification

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** K / “Authorization, confidentiality and abuse”, “Answer contract”.

The design names count/timing leakage but does not define the attacker model or tolerable behavioral differences. Ranking changes can disclose denied sources even if content and names are filtered.

**Resolution:** isolate private indexes/partitions by policy class where appropriate; derive candidate filters before search; avoid denominator/degree statistics influenced by denied entities. Publish a threat model for content, existence, timing and membership leakage. Use controlled presence/absence differential testing and bounded response shaping where appropriate; do not claim perfect timing noninterference on shared cloud hardware.

**Gate:** paired datasets differing only in denied objects; compare ranks, errors, counts, cursor behavior and timing distributions across tenants and revoked grants.

### SI-01 — Tenant authorization is target architecture, not current application enforcement

Open review work package. Source: BUILD-BIBLE/reviews/security-infrastructure.md.

**Priority:** P0 before any multi-user release. **Sources:** `db/schema.ts`, `db/store.ts`, `architecture/STATUS.md`, `UNFINISHED-WORK/06-security-and-verification.md` SEC-02; `PRODUCTION-ARCHITECTURE/05-security-auth-and-isolation.md`.

Current records/jobs/runtime settings do not carry an organization tenant key or app-level principal permissions. `list()` returns up to 10,000 records without tenant filtering. The current owner-private gateway is a valid stated boundary for a single owner's prototype; it cannot be repurposed into public sharing merely by changing Site audience. This is a missing release prerequisite, not evidence of a cross-tenant leak in an already deployed multi-tenant product.

**Resolved design:** Identity derives tenant membership; route resource IDs remain selectors. Every service operation checks tenant, project, action and source classification. Add tenant-aware immutable IDs, composite foreign keys, project-specific policy and revisioned grants before sharing. RLS provides a secondary SQL boundary; graph/vector caches, object URLs, exports, event subscriptions and support tooling enforce the same policy independently. Migration credentials stay separate from application roles. Dedicated tenant infrastructure still requires resource authorization.

**Proof required:** Two synthetic tenants plus two projects with different grants; cross-tenant known/unknown IDs; pooled DB context; forbidden graph counts/suggestions; filtered vector retrieval; revoked exports and object links; event subscription revocation; shared memory and historical summaries. Assert no content or existence side channel beyond a documented generic denial. SEC-02 stays open until those implemented paths and deployed gateway-to-service assertions are verified.

### BP-08 — Client segmentation is named but responsibility, entitlement billing and agency offboarding need enforceable contracts.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P1; pricing/agency packaging
Resolution: Each agency client is an isolated tenant or explicitly scoped workspace with its own source rights, approver and cost center. Agency portfolio aggregates authorized summaries only.
Acceptance: Remove agency access without deleting client data, transfer retained history with authority, export approved artifacts and demonstrate no cross-client search/count leakage.

## SEC-03 — Complete credential and provider-boundary audit

Status: open; priority: P0; owner: Unassigned; kind: engineering.

Current: AES-GCM storage and several secret redaction patterns are implemented; no independent security review is complete.

### Required work

- Review OAuth state, redirect handling, replay, refresh races, response-size limits and token lifetimes.
- Review outbound origin enforcement, SSRF, archive/path handling, secret export/logging and revocation.
- Assess worker attestations: a bearer-authorized report is not independent proof of isolation.
- Add credential rotation, redaction evaluation and clear metadata-only status contracts.

### Acceptance evidence

- Security review findings are recorded and fixed or explicitly dispositioned.
- Tests exercise material failure paths and no secrets appear in logs/exports.

Dependencies: none.

## QA-01 — Verify hosted end-to-end behavior

Status: open; priority: P0; owner: Unassigned; kind: engineering.

Current: 94 automated checks pass against SQLite/stubbed HTTP; production build passed. Hosted interaction and live external provider flows remain unverified.

### Required work

- Verify deployed routes, real D1 migration/read-back and owner access.
- Run browser journeys for import, connection, consent return, generation, review, PR, repair, rollback and export.
- Check network/provider failure recovery, keyboard use, loading and stale-data behavior.
- Record evidence separately for local tests, hosted app, live providers and isolated workers.

### Acceptance evidence

- Hosted user journeys and access boundaries pass with captured evidence.
- Publication alone is never recorded as external integration success.

Dependencies: none.

## QA-02 — Test actual application behavior

Status: open; priority: P0; owner: Unassigned; kind: engineering.

Current: Generated fixture tests only check snapshot integrity and a manifest property, not application behavior.

### Required work

- Discover project test frameworks and approved commands without running arbitrary shell instructions on the host.
- Run language/toolchain-specific unit, integration, API and critical user-flow tests in isolated workers.
- Capture build/lint/type/security evidence, coverage and regression results tied to commit.
- Allow review policy to require runtime evidence before apply/PR/release.

### Acceptance evidence

- Behavioral bugs and regressions cause meaningful failures.
- Passing snapshot-integrity checks is not presented as application correctness.

Dependencies: RUN-01.

## QA-03 — Add performance, resilience and evaluation suites

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: No production load, chaos, agent-quality or business-model evaluation exists.

### Required work

- Define baselines and representative workload suites.
- Test queue concurrency, storage scale, cancellation/crash recovery and distributed failure.
- Evaluate agent output, specialist disagreement, false claims and task success.
- Define workload profiles including changed bytes/files/languages, ACL selectivity, hot-key skew, source modality, provider delays, websocket churn and double-generation rebuilds; use measured per-resource safe envelopes.

### Acceptance evidence

- Measured results demonstrate stated capacity and reliability limits.
- Evaluation artifacts and failures remain searchable.
- Incident/control capacity remains available under noisy-neighbor load; supported SLOs and economic usage limits match observed profiles.

Dependencies: QA-02, DATA-01.

### AK-07 — fairness policy needs starvation and incident-abuse bounds

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** A / “Scheduler policy”, “Incident admission and emergency swarms”; E / “Organization optimization”.

Weighted deficit round robin and aging are starting mechanisms. They do not yet define the service class, maximum queue delay objective, incident admission rate or behavior when an abusive tenant continually emits urgent objectives. Infinite incident preemption can starve ordinary tenants.

**Resolution:** publish per-class quota, admission and borrowing rules; reserve bounded incident capacity; apply authenticated severity corroboration and per-tenant incident ceilings. Scheduling fairness is measured in resource-normalized work, not task count. Preserve nonpreemptable safety reconciliation capacity. Expose rejected/infeasible deadlines rather than disguising them as slow agents.

**Gate:** mixed short/long/GPU/model workloads, hot tenant, fabricated incidents and provider outage; measure starvation, cost fairness, queue delay and protected recovery progress.

### AK-15 — answer-quality targets need risk-specific confidence and abstention policy

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** K / “Observability and evaluation”, “Answer contract”; A / “Economy semantics”.

98% citation support is not 98% answer correctness or safe remediation. Precision targets can be met by abstaining on every difficult question, while a zero observed leak in a finite corpus does not prove zero possible leaks.

**Resolution:** release reports include support correctness, completeness, contradiction detection, causal validity, useful coverage and abstention by domain/risk. Publish sample counts and uncertainty. High-impact recommendations require stronger executable evidence than informational answers. Treat no observed forbidden disclosure as the release-corpus result, not universal security proof.

**Gate:** answerable/unanswerable balanced corpus, rare severe risks, conflicting sources, citations that support only part of a claim and intentionally wrong causal links; measure useful coverage and harm jointly.

### SI-09 — Capacity and observability thresholds need workload contracts

Open review work package. Source: BUILD-BIBLE/reviews/security-infrastructure.md.

**Priority:** P1 before beta; P0 before scale/SLA promises. **Sources:** production chapters 01, 04, 09, 15 and 18.

The reference byte arithmetic is useful but not a performance measurement. One hundred cells do not automatically yield a million reliable interactive connections or twenty billion queryable edges. Multi-store fanout, monorepo skew, symbol churn, ACL filters, embedding generation coexistence and burst incident workloads need explicit capacity envelopes. A delta for a 100K-file repository is underspecified without changed-file/byte/language counts and toolchain mix.

**Resolved design:** Define named benchmark profiles with source bytes/file counts/change rate, entity/edge/vector counts, tenant-size distribution, ACL selectivity, query mix, hot-key share, subscription churn, event size and provider latency. Report p50/p95/p99, backlog age, cost, recall, failure and recovery. Use sustained queue growth and forecast exhaustion as split signals; thresholds are per measured resource, not one global utilization percentage. Reserve control/cancellation/incident capacity. During saturation throttle background ingestion/research before status/policy functions. Projection lag produces unknown/stale, not healthy.

Proposed initial operational experiment: warn when measured capacity headroom for loss of one zone is less than 30%; begin placement/split planning when a critical resource sustains more than 70% of its tested safe envelope for thirty minutes or projected growth exhausts headroom within thirty days. These starting values are hypotheses, not contractual guarantees. A stricter workload safety bound overrides them. Multi-window SLO burn alerts must separate user-visible API failures from provider waits and expose both where relevant. Cardinality quotas keep per-task IDs in traces, not global metric labels.

**Proof required:** Hot tenant consumes its quota without starving others; incident storm with provider outage; slow websocket consumers; graph-query fanout; vector rebuild double-storage; drain/migrate while jobs exist; costly repeated embedding refresh. Relate commercial included usage and overage limits to measured unit costs.

### BP-16 — “Millions of users” design target is not a funded business forecast or proof of scale.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P2; future readiness
Resolution: Capacity expansion follows actual load and unit economics. Version numbers, elapsed years and market rank are separate axes.
Acceptance: Quarterly decision records show observed demand, capacity threshold, approved cost and rollback rather than automatic phase progression.

## OPS-01 — Ingest real health telemetry

Status: open; priority: P0; owner: Unassigned; kind: engineering.

Current: No live target telemetry or production incident stream is connected.

### Required work

- Define target/project identity, authenticated ingestion, metrics/logs/traces and event deduplication.
- Add health rules, SLOs, baseline deviations, alerts and incident correlation.
- Verify freshness and distinguish silence from healthy operation.

### Acceptance evidence

- Authorized target failures produce accurate incidents and recoveries with timestamps.
- Stale/missing telemetry cannot produce a false healthy state.

Dependencies: INT-01.

## OPS-02 — Build production diagnosis and repair loop

Status: open; priority: P0; owner: Unassigned; kind: engineering.

Current: Self-healing currently repairs stored snapshot documentation/test gaps; it does not heal production infrastructure.

### Required work

- Diagnose incidents using telemetry, deployment history and the graph.
- Generate scoped repairs, validate them on a representative twin/staging target and evaluate impact.
- Add policy for review versus authorized automatic actions, rollout windows and maximum blast radius.
- Monitor post-change outcomes and learn from successful/failed repairs.

### Acceptance evidence

- An induced test-environment incident is detected, diagnosed, repaired, checked and safely rolled back on failure.
- No unsupported production action is claimed or performed.

Dependencies: OPS-01, OPS-03, TWIN-01, QA-02.

## OPS-03 — Add deployment and rollback adapters

Status: open; priority: P0; owner: Unassigned; kind: engineering-and-target-authorization.

Current: No production deployment adapter or authorized deployment target exists.

### Required work

- Choose target-specific adapters with least-privilege credentials and environment/resource selectors.
- Implement plan/diff, staged deployment, health gates, rollback and operation idempotency.
- Handle databases, infrastructure and application release compatibility together.

### Acceptance evidence

- A real authorized staging deployment and rollback are verified.
- Wrong-target, stale-plan and unsafe/destructive actions are rejected.

Dependencies: RUN-01, AUTH-04.

## OPS-04 — Operate OmniDev itself reliably

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Sites publication succeeds, but platform SLOs, alerts, incident response and supervised workers are not established.

### Required work

- Instrument runtime, queue, D1, provider errors, costs and worker availability.
- Add runbooks, error budgets, on-call/ownership and recovery procedures.
- Configure recurring maintenance only with a declared schedule and authorized runtime.

### Acceptance evidence

- Platform outages and stale workers generate actionable alerts.
- Recovery and maintenance runbooks are exercised.

Dependencies: RUN-01, DATA-03.

## TWIN-01 — Build project digital twins

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Current twin is an illustrative queueing/capacity scenario, not a measured software/infrastructure replica.

### Required work

- Build versioned isolated project replicas with sanitized data and representative configuration.
- Simulate code, infrastructure and database changes, traffic, scale and failures.
- Compare measured performance/security/cost impact against baselines and show confidence and model scope.

### Acceptance evidence

- Predictions are calibrated against real staging outcomes and documented uncertainty.
- Twin changes cannot affect production or expose sensitive data.

Dependencies: RUN-01, GRAPH-02, OPS-01, DATA-01.

## TWIN-02 — Add cost and revenue impact models

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: No real billing, unit economics or revenue model is connected.

### Required work

- Ingest authorized billing and revenue data with privacy controls.
- Model infrastructure cost, capacity economics, customer conversion and revenue assumptions.
- Compare scenarios with uncertainty and actual outcomes.

### Acceptance evidence

- Scenarios trace to real input data and explicitly distinguish forecasts from facts.
- Revenue and cost access is permission-controlled.

Dependencies: TWIN-01, BIZ-01.

## FUT-01 — Replace future-state templates with evaluated plans

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: V2/V3/V5/V10 are disclosed planning templates informed by snapshot gaps.

### Required work

- Generate evidence-based architecture, bottleneck, migration, product-line and revenue-roadmap options.
- Add dependencies, tradeoffs, uncertainty, experiments and measurable milestones.
- Version plans and compare prior forecasts with actual outcomes.

### Acceptance evidence

- Every horizon has project-specific evidence and testable milestones.
- Predictions remain hypotheses with evaluations, not guaranteed futures.

Dependencies: GRAPH-02, TWIN-01, BIZ-01.

### AK-22 — future exploration needs falsifiability and no hindsight rewriting

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** E / “Scenario engine”; K / “Bitemporal and scenario semantics”.

Many scenarios can appear insightful without ever being resolved. Strategic forecasts with vague outcomes cannot earn an accuracy score and can bias roadmaps through narrative confidence.

**Resolution:** each scoreable forecast freezes event definition, horizon, probability/range, source time, resolution source and missing-data rules. Separate scored probabilistic forecasts, structural stress scenarios and speculative inventions. Report coverage and unresolved forecasts. Robust/reversible decisions may be useful without assigning unreliable probabilities to decade-scale AGI or quantum futures.

**Gate:** backtest with source cutoffs; detect future-information leakage; unresolved predictions do not count as successes; original issued forecasts remain immutable.

## BIZ-01 — Connect product and business intelligence

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: No real customer, product, market, revenue or competitor evidence is ingested.

### Required work

- Ingest authorized product requirements, analytics, customer feedback, costs and revenue sources.
- Define business rules and product metrics with provenance and privacy controls.
- Build product prioritization and competitive research workflows.

### Acceptance evidence

- Recommendations reference real evidence and measurable business objectives.
- Sensitive business/customer data has scoped access and retention.

Dependencies: INT-01, DATA-02.

## BIZ-02 — Build innovation discovery and validation

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Innovation Discovery is a catalog domain; no invention pipeline or novelty evaluation exists.

### Required work

- Research unmet needs, competing products, technologies, trends and hidden value opportunities.
- Generate feature, automation, product and business-model hypotheses.
- Validate novelty, feasibility, demand and unit economics through documented experiments.
- Treat patent potential as a research hypothesis requiring qualified review.

### Acceptance evidence

- Proposals include sources, competing solutions, validation plans and experimental results.
- The system does not claim that nobody has built something without evidence.

Dependencies: BIZ-01, FUT-01.

### BP-14 — Large generated invention volumes may create value claims with no buyer, novelty or execution path.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P2; future/innovation strategy
Resolution: Every opportunity has problem owner, evidence, experiment cost, rights and stop criterion. Generated ideas are hypotheses, not patentability or revenue.
Acceptance: Customer/research validation changes stage; rejected ideas retain rationale; no pipeline monetary totals without defined probability/valuation basis.

## EXEC-01 — Complete executive intelligence scores

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Seven heuristic scores exist; no complete executive scorecard or measured business readiness exists.

### Required work

- Implement all requested scores: Security, Performance, Architecture, Scalability, Reliability, Maintainability, Innovation, Revenue Potential, AI Readiness, Technical Debt, Operational Excellence, Developer Experience, User Experience and Business Health.
- Define data requirements, weighting, coverage and confidence; mark unknown dimensions unassessed.
- Add trends, drilldowns and decision-linked recommendations.

### Acceptance evidence

- All 14 dimensions have documented methodology and evidence or an explicit unassessed state.
- A score never implies a certification or unsupported measurement.

Dependencies: SEC-01, QA-03, BIZ-01, OPS-01.

## UX-01 — Audit the existing interface and journeys

Status: open; priority: P0; owner: Unassigned; kind: engineering.

Current: Dark command center and runtime/account flows are implemented; visual/browser QA has not been performed.

### Required work

- Review information hierarchy, navigation, labels, empty/loading/error states and interrupted work.
- Verify GitHub registration → install → sign-in → repository selection → import return journey.
- Check provider availability language, review/PR actions and clear separation of definitions, proposals and execution.
- Remove obsolete copy and review unused UI state/imports after account-first changes.

### Acceptance evidence

- Critical tasks can be completed with clear success/failure/recovery states.
- Screens never imply unverified connectivity, test evidence or autonomy.

Dependencies: none.

### BP-06 — Seventeen screen families may become navigation scope before the first workflow is usable.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P1; experience chapters 1/3/8
Resolution: MVP exposes Focus, Projects, Work, Decisions and Connections; advanced centers remain discoverable but labeled planned/limited. Product density expands after successful user journeys.
Acceptance: Beginner completes connect → evidence → candidate → review without developer coaching; executive can explain unknown score and next action.

### BP-11 — Many agent discussions and risk scores can create approval fatigue and duplicate interruptions.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P1; UI action/notifications
Resolution: Group by underlying decision/effect, make dissent/evidence concise, preserve critical risk separately from default score; cap optional notifications.
Acceptance: Operator correctly distinguishes pending proposal, pending effect and reconciled outcome under incident load; false/misleading approvals tracked.

## UX-02 — Complete accessibility and responsive verification

Status: open; priority: P0; owner: Unassigned; kind: engineering.

Current: Responsive styles and component primitives exist; no measured accessibility audit is complete.

### Required work

- Test keyboard flow, focus return, dialogs, select controls, semantic labels and screen-reader feedback.
- Check contrast, readable type, reduced motion, zoom to 200%, mobile/tablet and narrow layouts.
- Review graph accessibility, text alternatives and status announcements.

### Acceptance evidence

- Representative viewport and assistive-technology journeys pass with recorded findings.
- All critical actions work without a mouse.

Dependencies: UX-01.

### BP-12 — Standards and token contrast do not prove live authentication, graph/table parity or high-impact review accessibility.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P1; accessibility/mobile
Resolution: Release by complete journey, not isolated component. Evaluate real keyboard, screen reader, zoom, touch and poor-network paths, with stop conditions for dangerous confusion.
Acceptance: Independent evaluation across connect, inspect, review, cancel/reconcile and budget change; no critical blockers.

## UX-03 — Design the missing advanced working surfaces

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Current graph, twin, memory and future views show the implemented foundation, not full-system tools.

### Required work

- Design swarm lineage/tool approvals, worker health, connection sync, incident diagnosis and deployment plans.
- Design semantic graph search, timeline/history, twin comparisons, executive evidence and innovation experiments.
- Add prototypes tied to real backend states; avoid presenting decorative demo values as live systems.

### Acceptance evidence

- Each new surface has task-based acceptance criteria and maps to implemented data/actions.
- Usability review covers real target users and failure paths.

Dependencies: UX-01, GRAPH-01, OPS-02, TWIN-01.

## LEGAL-01 — Implement scoped compliance and legal auditing

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Compliance and Legal Auditing are domain definitions; there are no evidence collectors or jurisdiction-specific controls.

### Required work

- Choose applicable standards, jurisdictions and policies from real project context.
- Collect evidence and map controls, license/IP obligations, privacy and retention requirements.
- Track findings and qualified human review where required.

### Acceptance evidence

- Reports distinguish measured controls, missing evidence and legal interpretation.
- No unsupported certification or legal conclusion is issued.

Dependencies: SEC-01, SEC-02, BIZ-01.

## INT-01 — Create reusable integration execution contracts

Status: open; priority: P0; owner: Unassigned; kind: engineering.

Current: Catalog registrations do not connect systems; only bounded GitHub/snapshot adapters have execution code.

### Required work

- Define source identity, authentication, scopes, target resources, discovery, ingestion, incremental sync and actions.
- Add rate limits, pagination, retry/backoff, webhook validation, freshness, deletion and provenance.
- Build secret-safe server or local bridge contracts for HTTP, filesystem and TCP systems.
- Keep provider operations explicit and testable; no arbitrary connector proxy or token copying.

### Acceptance evidence

- Every adapter follows a verified lifecycle and common capability/error contract.
- Cross-source permission boundaries and revoked access are enforced.

Dependencies: AUTH-04, DATA-01.

## REL-01 — Prepare release documentation and operating evidence

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: README, architecture status and evidence files exist, but full operating/developer documentation is incomplete.

### Required work

- Add setup/upgrade guides, API contracts, environment prerequisites and runbooks for shipped capabilities.
- Define versioning, schema migration policy, supported versions and release validation.
- Consolidate evidence without replacing older historical results or claiming stubbed tests are live.

### Acceptance evidence

- A new authorized operator can set up, verify, recover and upgrade the platform using the docs.
- Release notes accurately distinguish engineering work, activation and verification.

Dependencies: QA-01, OPS-04.

## REL-02 — Copy the project to the requested GitHub destination

Status: open; priority: P1; owner: Unassigned; kind: future-user-instruction.

Current: Source is maintained by Sites. The user plans to request a separate GitHub copy later; no destination has been selected.

### Required work

- Wait for the user's next explicit GitHub-copy instruction and destination/visibility.
- Verify the authenticated owner and repository permissions; choose create versus update explicitly.
- Include source, migrations, worker, docs, test evidence and this folder; exclude credentials, caches, build output and dependencies.
- Read back the pushed commit and folder structure; document how the GitHub copy relates to Sites publishing.

### Acceptance evidence

- User-designated GitHub repository contains the exact reviewed source and unfinished-work folder.
- No unrelated repository is modified and no secret is committed.

Dependencies: none.

## REL-03 — Resolve the unused Vercel experiment

Status: open; priority: P2; owner: Unassigned; kind: cleanup-and-verification.

Current: An empty optional worker project was created; sandbox creation returned 403 and no running worker/deployment was established.

### Required work

- Confirm current resources before cleanup.
- Remove or explicitly archive only the unused experiment through an authorized supported operation.
- Keep Vercel out of required architecture and retain a truthful historical record of the failed attempt.

### Acceptance evidence

- No unwanted running resources or required Vercel dependency remain.
- Cleanup outcome is verified; absence of a supported delete operation is documented.

Dependencies: none.

## CONN-01 — GitHub integration

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Bounded snapshot ingestion and OAuth adapter implemented; live consent and advanced sync/CI remain unverified.

### Required work

- Add pagination, incremental sync/webhooks, organization installation verification, larger repositories and authenticated PR/CI evidence beyond the current bounded snapshot adapter.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-02 — GitLab integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Discover projects/branches/merge requests, import source and CI evidence, and create reviewed merge requests through scoped authorization.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-03 — Bitbucket integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Support workspace/repository authorization, branch snapshots, pull requests and Pipelines evidence.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-04 — Azure DevOps integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Support organization/project authorization, repos, work items, pipelines and reviewed pull requests.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-05 — Local Projects integration

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Manual text snapshots supported; dedicated live bridge not implemented.

### Required work

- Build an owner-approved local bridge with selected project roots, safe source ingestion and watched updates.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-06 — Local Directories integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Manual text snapshots supported; dedicated live bridge not implemented.

### Required work

- Implement explicit directory grants, path/symlink containment, filesystem change detection and revocation.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-07 — Monorepos integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Manual text snapshots supported; dedicated live bridge not implemented.

### Required work

- Discover packages, ownership, dependency boundaries, build/test selection and affected-project analysis at scale.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-08 — AWS integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Discover authorized accounts/services/IAM/deployments and billing; add target-scoped infrastructure plans and actions.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-09 — Azure integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Discover subscriptions/resources/identity/deployments and billing with scoped workload authorization.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-10 — Google Cloud integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Discover projects/services/IAM/deployments/billing and supported model permissions.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-11 — Digital Ocean integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Discover projects, droplets, clusters, storage and billing; add scoped reviewed operations.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-12 — Kubernetes integration

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Read selected clusters/namespaces/workloads/RBAC/events; add reviewed manifest rollout and rollback.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-13 — Docker integration

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Docker test runner implemented; ecosystem discovery and real execution unverified.

### Required work

- Discover selected hosts/images/containers and build provenance; distinguish platform test isolation from ecosystem inventory.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-14 — PostgreSQL integration

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-15 — MySQL integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-16 — SQL Server integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-17 — MariaDB integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-18 — MongoDB integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-19 — Neo4j integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-20 — Redis integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-21 — Firebase integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-22 — Supabase integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Discover authorized instances, schemas, data structures, access controls, performance and backup state; add read-only ingestion first and separately reviewed migrations/operations. TCP-only access requires a scoped bridge.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-23 — Figma integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Ingest authorized files/components/flows and connect designs to implementation entities.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-24 — Adobe XD integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Determine a currently supported export/plugin bridge and map design assets/flows with version and availability limits.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-25 — Sketch integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Build authorized document/export/plugin ingestion for symbols, components and user flows.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-26 — Blender integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Build a version-aware bridge for scenes, objects, materials, rigs, render jobs and validated asset outputs.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-27 — Maya integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Build a version-aware scene/asset/plugin bridge with licensed runtime execution and artifact provenance.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-28 — Cinema4D integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Build licensed version-aware scene/asset/render ingestion and controlled execution.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-29 — Notion integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Sync approved pages/databases with stable identities, permission boundaries and change/deletion handling.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-30 — Confluence integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Sync selected spaces/pages, decisions and history with permissions and freshness.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-31 — Slack integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Ingest authorized channels/conversations and decision links; scope any write action separately.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-32 — Teams integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Ingest authorized teams/channels/messages and map decisions without expanding visibility.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-33 — Email Systems integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Select supported providers and folders, ingest authorized correspondence and extract decisions with retention controls.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-34 — Internal Documentation integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Support approved document formats/sources, versioning, source attribution and deletion.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-35 — APIs integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Ingest OpenAPI/GraphQL/schema contracts, authenticated discovery, compatibility and scoped test actions.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-36 — Microservices integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Map service inventory, contracts, dependencies, traces, deployments and ownership across targets.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-37 — Legacy Systems integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Build protocol/version-specific bridges; preserve unsupported coverage and test migration plans.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-38 — ERP Systems integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Select target products and map authorized workflows, business rules and financial entities.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## CONN-39 — CRM Systems integration

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: Catalog entry only; dedicated live adapter not implemented.

### Required work

- Select target products and map customer/workflow/revenue entities with privacy and access controls.
- Implement and test the common connection lifecycle; record actual granted capabilities and target scope.

### Acceptance evidence

- Authorized real-source discovery and incremental read-back are demonstrated.
- Denial, revocation, service failure and unsupported actions fail safely.
- Writes, if shipped, have separate target-specific tests and policy.

Dependencies: INT-01.

## DOM-01 — Security executable specialist

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Vulnerability triage, security design review and validated remediation with scanner evidence.
- Define Security inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Security tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-02 — Backend executable specialist

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Service logic, API behavior, authorization, validation and backend test artifacts.
- Define Backend inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Backend tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-03 — Frontend executable specialist

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Component implementation, state/data flows, browser behavior and frontend regression evidence.
- Define Frontend inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Frontend tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-04 — DevOps executable specialist

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Delivery pipelines, deployment plans, environment consistency and recovery runbooks.
- Define DevOps inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative DevOps tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-05 — Cloud executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Provider resource inventory, IAM boundaries, workload architecture and cost-aware changes.
- Define Cloud inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Cloud tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-06 — Infrastructure executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Infrastructure-as-code plans, drift detection, resource dependencies and reversible changes.
- Define Infrastructure inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Infrastructure tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-07 — Databases executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Schema/query analysis, indexes, migrations, integrity, backup and restore evidence.
- Define Databases inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Databases tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-08 — AI Development executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: AI product workflows, model/tool contracts, evaluation suites and deployment behavior.
- Define AI Development inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative AI Development tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-09 — Machine Learning executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Data lineage, training/evaluation pipelines, leakage checks, reproducibility and model monitoring.
- Define Machine Learning inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Machine Learning tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-10 — LLM Engineering executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Prompt/tool design, model routing, inference budgets, agent evaluation and grounded outputs.
- Define LLM Engineering inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative LLM Engineering tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-11 — RAG Systems executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Document ingestion, chunking, retrieval/reranking, source attribution and retrieval quality evaluation.
- Define RAG Systems inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative RAG Systems tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-12 — Vector Databases executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Embedding/index/version management, access filters, retrieval latency and recall/cost evidence.
- Define Vector Databases inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Vector Databases tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-13 — 3D Development executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Scene/asset pipelines, geometry/material standards, render validation and export provenance.
- Define 3D Development inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative 3D Development tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-14 — Blender executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Version-aware scene, geometry, modifier, material, rig and render operations with inspected artifacts.
- Define Blender inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Blender tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-15 — Maya executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Version-aware scene, modeling, rigging, animation and export operations on an authorized licensed runtime.
- Define Maya inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Maya tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-16 — Unity executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Scene/package/code analysis, asset import, gameplay behavior, build and frame-time verification.
- Define Unity inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Unity tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-17 — Unreal Engine executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Project/plugin/Blueprint/C++ workflows, asset cooking, build, rendering and performance evidence.
- Define Unreal Engine inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Unreal Engine tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-18 — Game Development executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Gameplay/system implementation, content pipelines, game-loop tests and playable artifact validation.
- Define Game Development inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Game Development tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-19 — Mobile Development executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Platform-specific navigation, lifecycle, offline behavior, accessibility and device/build verification.
- Define Mobile Development inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Mobile Development tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-20 — Testing executable specialist

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Meaningful unit/integration/regression tests tied to observable behavior and candidate revisions.
- Define Testing inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Testing tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-21 — QA executable specialist

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Acceptance plans, exploratory journeys, release evidence and defect reproduction.
- Define QA inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative QA tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-22 — Automation executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Scoped repeatable workflows, scheduling, idempotency, retry behavior and human handoffs.
- Define Automation inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Automation tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-23 — UI Design executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Task-focused layout, components, interaction states and design-to-implementation artifacts.
- Define UI Design inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative UI Design tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-24 — UX Design executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: User research, journey design, usability evaluation and evidence-based workflow improvements.
- Define UX Design inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative UX Design tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-25 — Accessibility executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Keyboard, semantic, visual and assistive-technology checks with verified repairs.
- Define Accessibility inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Accessibility tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-26 — Compliance executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Applicable control mapping, evidence collection, scope boundaries and audit readiness.
- Define Compliance inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Compliance tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-27 — Legal Auditing executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: License/IP/privacy obligations, jurisdiction context and qualified-review handoff.
- Define Legal Auditing inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Legal Auditing tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-28 — Documentation executable specialist

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Source-grounded setup/API/architecture/recovery documentation kept consistent with shipped behavior.
- Define Documentation inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Documentation tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-29 — Research executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Source discovery, quality assessment, attribution, competing explanations and reproducible findings.
- Define Research inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Research tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-30 — Business Intelligence executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Authorized business data modeling, KPI definitions, trends and evidence-based decision support.
- Define Business Intelligence inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Business Intelligence tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-31 — Product Management executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Requirements, prioritization, acceptance criteria, roadmaps and measurable outcomes.
- Define Product Management inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Product Management tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-32 — Customer Analytics executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Privacy-aware funnels, cohorts, behavior/feedback analysis and validated customer insights.
- Define Customer Analytics inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Customer Analytics tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-33 — Revenue Optimization executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Unit economics, monetization hypotheses, pricing/conversion experiments and measured outcomes.
- Define Revenue Optimization inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Revenue Optimization tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-34 — Competitive Analysis executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Current sourced competitor capabilities, alternatives, positioning and opportunity comparisons.
- Define Competitive Analysis inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Competitive Analysis tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-35 — Innovation Discovery executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Unmet-needs research, novel concept hypotheses, feasibility and demand validation.
- Define Innovation Discovery inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Innovation Discovery tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-36 — Future Prediction executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Scenario forecasts, uncertainty, assumptions and retrospective forecast evaluation.
- Define Future Prediction inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Future Prediction tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-37 — Architecture executable specialist

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: System boundaries, dependency decisions, tradeoffs, migration plans and architecture fitness checks.
- Define Architecture inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Architecture tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-38 — Code Quality executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Maintainability/debt analysis, safe refactoring and measured regression checks.
- Define Code Quality inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Code Quality tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-39 — Performance executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Profiling, latency/resource bottlenecks, benchmark baselines and measured optimization.
- Define Performance inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Performance tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-40 — Scalability executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Capacity/load models, dependency bottlenecks, scaling plans and verified workload limits.
- Define Scalability inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Scalability tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-41 — Reliability executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Failure modes, SLOs, resilience changes, incident diagnosis and recovery evidence.
- Define Reliability inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Reliability tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-42 — Observability executable specialist

Status: open; priority: P1; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Metrics/logs/traces, correlation, alerts, signal freshness and actionable incident context.
- Define Observability inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Observability tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-43 — Networking executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Authorized topology, routing, connectivity, DNS/TLS and network policy validation.
- Define Networking inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Networking tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-44 — Cyber Defense executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Authorized detection/response workflows, threat indicators and tested containment strategies.
- Define Cyber Defense inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Cyber Defense tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-45 — Penetration Testing executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Explicitly authorized target scope, isolated test plans, validated findings and remediation checks.
- Define Penetration Testing inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Penetration Testing tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-46 — Open Source Analysis executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Upstream provenance, project health, licenses, security and compatibility research.
- Define Open Source Analysis inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Open Source Analysis tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## DOM-47 — Dependency Intelligence executable specialist

Status: open; priority: P2; owner: Unassigned; kind: engineering.

Current: A master swarm definition is registered. A dedicated domain toolset, specialist workflow and domain evaluations are not complete.

### Required work

- Domain deliverables: Dependency graph/SBOM, advisories, update compatibility and supply-chain provenance.
- Define Dependency Intelligence inputs, tools, allowed actions, output artifacts, domain knowledge and success metrics.
- Implement its specialist workflow and route discovered subdomains through bounded child-agent orchestration.
- Connect required domain data sources and perform representative real-task evaluations.

### Acceptance evidence

- Specialist completes representative Dependency Intelligence tasks with source/tool evidence and useful artifacts.
- Failures, unsupported cases and uncertain conclusions are disclosed.
- Child agents respect shared permissions and execution budgets.

Dependencies: RUN-02, INT-01, QA-03.

## AUD-01 — Capability certification envelope

Status: open; priority: P1; owner: QA platform lead; kind: engineering-and-verification.

Current: A platform can look universal while supporting only one language and test command.

### Required work

- Publish per connector/language/model/tool supported versions, permitted operations, parser coverage, evaluation cohort and expiry. Unsupported requests become explicit gaps.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- Reference unsupported cases fail without silent fallback.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: QA-03, INT-01.

### AK-09 — marketplace skill inheritance must not imply verified competence

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** A / “Marketplace packs”; E / “Selection”, “Autonomous creation workflow”.

A says agents inherit declared skills automatically after successful installation. A signature and compatible install do not establish competence in the customer's version, workload or jurisdiction.

**Resolution:** distinguish declared, installed, evaluated and production-qualified skills. Import claims and publisher benchmarks with provenance; only local qualification grants eligibility for the task/environment/risk class. Revocation removes dispatch eligibility first; draining and receipt reconciliation remain explicit.

**Gate:** install a signed but incorrect skill; verify it cannot execute privileged tasks until customer-environment qualification; test dependency revocation on pinned in-flight work.

## Knowledge and memory hostile review

### AK-10 — supported parser and inference envelope must become a product contract

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** K / “Collection pipeline”, “Relationship semantics and constraints”, “Migration from current app”.

The ontology spans virtually everything, but parsers and collectors do not. Without an explicit capability matrix, customers will interpret a beautiful graph as comprehensive mapping even when reflection, generated code, macros, dynamic imports, databases or proprietary tools are unobserved.

**Resolution:** maintain a connector/language/version/analysis-mode matrix stating supported syntax, evidence method, limits, required execution, quality slices and unavailable domains. Every graph/map and health score carries that matrix revision and coverage. Do not advertise complete vulnerability analysis from regex observations. Surface unsound and incomplete static analysis separately.

**Gate:** representative reflection/generated-code/polyglot repositories; unsupported syntax cannot silently disappear or produce confirmed missing-dependency findings; product copy matches actual qualified scope.

### AK-19 — self-created expertise can launder an unverified vendor claim into a capability

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** E / “Permanent research division”, “Autonomous creation workflow”; A / “Marketplace packs”.

A paper, README or threat alert may be authentic yet wrong. Dossier generation and a specialist name can produce false institutional authority if the UI implies the subject is solved.

**Resolution:** research maturity states: sourced claim, independently corroborated, reproduced, environment-qualified, adopted and monitored. Research experts remain research-only until competence qualification. Preserve negative replication and source limitations; prioritize user need rather than novelty volume. Do not auto-install tool dependencies from source text.

**Gate:** fabricated method with credible source formatting, real paper with nonreproducing result and unsupported customer version; no production eligibility until appropriate tests pass.

## AUD-02 — Evidence trust root

Status: open; priority: P0; owner: Security lead; kind: engineering-and-verification.

Current: A signed report can still be signed by the same compromised worker that created the artifact.

### Required work

- Separate workload identity, attestation verification, artifact hashing and evaluation identity. Bind evidence to exact attempt, candidate, image and test manifest.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- Forged/stale/mismatched reports cannot authorize effects.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: RUN-01, RUN-03.

### AK-17 — release fixture booleans are not verifiable attestations

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** EG / `evaluatePromotion`; E / “Experimental contract”, “Autonomy boundary”.

The helper accepts caller-supplied booleans for independent evaluation, policy, rights and hard constraints. It does not verify signatures, expiry, evaluated candidate hash, cohort, metric thresholds, evaluator role or baseline still being deployed. Missing arrays can throw rather than deny. This is fine as a fixture but dangerous if promoted into production.

**Resolution:** production controller validates typed signed evaluation and policy receipts; exact candidate/baseline/evaluator/dataset hashes; freshness; scope; minimum cohort; prespecified improvement/noninferiority; authority epoch; compatibility and rollback readiness. All malformed inputs fail closed with typed error. Distinguish fixture checks from integration/security qualification in reports.

**Gate:** forged true flags, valid signature for different candidate, stale baseline, expired rights, absent arrays, NaN/overflow amounts and evaluator-role mismatch all deny without dispatch.

### SI-02 — Worker results lack immutable execution/evidence binding

Open review work package. Source: BUILD-BIBLE/reviews/security-infrastructure.md.

**Priority:** P0 before treating worker results as a release gate. **Sources:** `lib/jobs.ts` functions `workerJob()` and `report()`; `app/api/worker/route.ts`; `worker/runner.mjs`.

The worker API uses a shared configured bearer secret. A accepted report supplies job ID, boolean result, output string and literal worker label `docker-isolated`. The report does not carry candidate digest, source digest, command/toolchain/image digest, assigned worker identity, execution attempt, fencing token or single-use report grant. The supplied label is a claim. No independent verification proves the named isolation boundary actually existed. Two workers can overwrite result state while the candidate remains awaiting review; the handler reads then replaces JSON rather than compare-and-setting an execution revision. This is especially important when later designs introduce real behavioral tests.

**Resolved design:** Create a separate durable execution assignment before handing off artifacts. Bind `{tenant, project, job, candidate_digest, source_digest, test_manifest_digest, image_digest, worker_principal, attempt, fence, authority_epoch, grant_epoch, expires_at}` to a narrow capability and execution ID. The report returns measured tool exit codes, manifest/result hashes, execution receipt and upload references. Broker validates identity, assignment freshness, digests, state and schema atomically; duplicate identical receipts are idempotent; conflicting receipts quarantine. A attestation authenticates the execution environment's claim but does not prove tests covered product behavior. Independent verification remains necessary for sensitive releases.

**Proof required:** Tampered digest, stale attempt/fence, wrong worker, replayed capability, copied report, unsupported image, canceled assignment, changed tests, concurrent conflicting completion and unavailable attestation root. No candidate can inherit evidence from a different artifact. Record this as implementation work under SEC-03, RUN-01 and QA-02.

## AUD-03 — Data withdrawal convergence

Status: open; priority: P1; owner: Data lead; kind: engineering-and-verification.

Current: Deleting a source can leave summaries, vectors, caches, backups and model weights carrying it.

### Required work

- Use a derivation registry, immediate deny tombstones, bounded purge workflow, subscriber receipts and restore-time deletion replay. Training contracts declare model withdrawal strategy.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- Deleted material is denied immediately; purge convergence and restored-copy denial are measured.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: DATA-02, DATA-03.

### AK-02 — global pattern admission is stronger than the propagation reference guard

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** K / “Write, consolidate, promote and correct”; E / “Libraries”; EG / `canPropagate`.

The documented policy requires source rights, confidentiality review, current object access, recipient purpose, opt-in where applicable and withdrawal lineage. The helper accepts same-tenant transfer solely from `rightsCurrent`, or cross-tenant transfer from two booleans. Same-tenant is not the same as same-project/classification/purpose authorization. A global-consent flag is not an approved publication receipt or permission to send to any recipient.

**Resolution:** treat the helper strictly as an incomplete illustrative fixture. Production propagation requires a signed publication/admission receipt, current source-access evaluation, destination scope/purpose policy, restricted lineage compatibility and withdrawal generation. Authorization must run on the receiving side too. Retain raw-source restrictions even when an artifact is generalized.

**Gate:** deny same-tenant cross-project secrets; deny withdrawn patterns despite stale consent; deny approved-publication reuse for an incompatible purpose; prove denied content never enters receiving model context.

### AK-11 — withdrawal and retraction require a convergence contract

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** K / “Longevity, forgetting and recovery”, “Consistency and recovery”; E / “Libraries”, “Decades of stewardship”.

The design correctly follows lineage but does not quantify the period in which dependent summaries, exports, cold indexes or trained variants remain usable. At billions of relationships, complete descendant recomputation cannot be instantaneous.

**Resolution:** maintain a small authoritative denied-source/withdrawal generation checked at evidence assembly and release dispatch. Immediately block use of affected references; background purge tracks stores, caches, exports, training manifests and required third-party requests with receipts. Set a measurable deny-enforcement target and separate physical cleanup objective per storage class. Model retirement/retraining obligations are explicit before any training on revocable data. Never promise deleting a source can erase externally downloaded copies.

**Gate:** inject withdrawal during query, cached answer, index rebuild, forecast generation and backup restore; no subsequent authorized delivery uses revoked content; report residual external obligations.

## AUD-04 — Control-plane bootstrap recovery

Status: open; priority: P0; owner: SRE lead; kind: engineering-and-verification.

Current: Policy, KMS and directory services can become mutually dependent during a total recovery.

### Required work

- Maintain independently protected recovery identities, ordered restore runbooks, signed last-known-good manifests and tested key recovery.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.
- Restore workflow histories, object/event offsets, policy/schema versions, keys and tombstones in quarantine with dispatch disabled before reconciling external effects.

### Acceptance evidence

- Cold-region restore succeeds without relying on the failed control plane.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.
- Missing keys/objects, incompatible histories, deleted-source resurrection and unknown external writes prevent unsafe restart.

Dependencies: DATA-03, OPS-04.

### SI-08 — Recovery is a multi-store and external-effect workflow

Open review work package. Source: BUILD-BIBLE/reviews/security-infrastructure.md.

**Priority:** P0 before any sold recovery objective. **Sources:** production chapters 09, 16, 18; DATA-03.

A restored PostgreSQL primary with stale object manifests, missing decryption keys, incorrect Temporal history or resurrected permissions is not successful recovery. Rebuilding graph/vector stores must not resurrect deleted or revoked sources. The present snapshot rollback is not database disaster recovery.

**Resolved design:** A versioned recovery manifest binds control-store checkpoint, object manifest, event archive offsets, compatible workflow code, schema/policy versions, key custody and tombstone ledger. Restore into a quarantined environment with dispatch disabled. Apply deletion/revocation records before making data queryable. Reconcile operation intents and receipts before enabling writes. Validate source availability and projection watermarks; serve only current authorized evidence. Zero-RPO means acknowledged durability under the exact replication topology, not a generic architecture phrase. Measure RTO through customer-visible service restoration, including security/ledger readiness.

**Proof required:** Corrupt/missing backups, inaccessible keys, incompatible workflow replay, deleted tenant resurrection, revoked connection, archive gap, committed-but-unacknowledged provider operation, old grant and missing source object. Restore from an independent clean account is required where the DR contract includes control-account compromise. Exercise both platform-owned and customer-managed-key recovery responsibilities.

## AUD-05 — Evaluator independence and capture

Status: open; priority: P1; owner: Research lead; kind: engineering-and-verification.

Current: Millions of agents can manufacture consensus through cloned reviewers or a poisoned grader.

### Required work

- Assign independent role slots; freeze evaluator/dataset versions; measure lineage/provider correlation; keep adversarial challenge sets and human calibration.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- Clone votes do not increase effective independence; evaluator tampering is rejected.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: RUN-02, QA-03.

### AK-06 — review independence is necessary but lacks an enforceable dependency model

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** A / “Debate record and roles”, “Bounded debate algorithm”; E / “Experimental contract”.

Different identities do not establish independence. Agents sharing prompts, weights, training data, upstream summaries and incentives can produce strongly correlated errors. A role-slot rule prevents vote flooding but does not make four correlated reviewers a security argument.

**Resolution:** record reviewer dependency manifests: author involvement, template lineage, model family/revision, retrieval evidence origin, evaluation ownership and financial incentives. Maintain action-class independence policies with qualified deterministic checks and external evidence where possible. Require at least one materially different verification mechanism for high-risk changes; inability to satisfy the policy yields inconclusive/escalated. Never multiply confidence by reviewer count without a measured correlation model.

**Gate:** cloned reviewers cannot fill independent slots; test a shared misleading source; require a compiler/test/control check to refute a unanimous model error; display unqualified independence honestly.

### AK-18 — continual search needs a portfolio-level false-discovery budget

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** E / “Experimental contract”, “Prompt system”, “Selection”.

Multiplicity control is mentioned, but millions of agents optimizing thousands of variants can repeatedly reuse test sets and promote noise. A passing individual test is insufficient when the selection process itself adaptively inspects outcomes.

**Resolution:** evaluation registry tracks candidate search family, data exposure and test-set reuse; hold independent sealed final-confirmation cohorts. Apply prespecified sequential/multiple-comparison methods suited to the metric and allocation unit. Require durable improvements on realistic matched cohorts and a stable reference, not only a recently weakened baseline. Maintain diversity and rare-slice regression gates.

**Gate:** null-effect candidate swarm cannot produce uncontrolled promotions; repeated holdout access is denied; benchmark overfit and regression on rare frameworks are detected.

## AUD-06 — Human accountability and appeals

Status: open; priority: P1; owner: Product lead; kind: engineering-and-verification.

Current: Autonomous mistakes can leave no person responsible or no correction channel.

### Required work

- Every action class has accountable owner, appeal/correction workflow, understandable evidence and reversible authority. Design workforce/privacy impact review.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- A user can challenge a finding, stop a run and track resolution without exposing hidden data.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: SEC-02, UX-01.

## AUD-07 — Supply-chain build provenance

Status: open; priority: P0; owner: Security lead; kind: engineering-and-verification.

Current: Package scripts and mutable images can subvert perfectly reviewed source.

### Required work

- Pin build inputs, attest builder and materials, quarantine imports, isolate approved mirrors and verify provenance before release.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- Poisoned image/package/attestation fails admission.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: RUN-01, SEC-03.

## AUD-08 — Support and incident access

Status: open; priority: P1; owner: Enterprise lead; kind: engineering-and-verification.

Current: Enterprise isolation can be bypassed by support tooling and telemetry.

### Required work

- Use just-in-time scoped support sessions with owner authorization where required, dual review for sensitive access and redacted observability.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- Support access is denied without valid ticket/scope and appears in audit.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: SEC-02, SEC-03.

## AUD-09 — Independent economy and demand model

Status: open; priority: P1; owner: Finance lead; kind: engineering-and-verification.

Current: ARR targets can hide free-user inference, failed-run costs, working capital and consumption workload.

### Required work

- Link paid execution units to actual workload, include quality-adjusted successful-task margin, customer acquisition capacity, cash collection and liabilities.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- Overage workload raises costs; cash and earned revenue reconcile separately.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: BIZ-01.

### BP-01 — Overage revenue was counted without incremental overage jobs. Forecast margin and financing confidence were overstated.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P0; financial-model.mjs
Resolution: Model v2 calculates overage workload from explicit assumed retail job price and charges supplier model/runtime costs on total workload. Preserve v1 history.
Acceptance: Current generated results reconcile every month; zero-overage, invalid-price and price/workload sensitivity checks pass. This is an arithmetic correction, not commercial validation.

## AUD-10 — Competitive outcome benchmark

Status: open; priority: P1; owner: Founder; kind: engineering-and-verification.

Current: Feature count does not show a reason to switch from established tools.

### Required work

- Measure time to validated repair, recurrence, audit preparation, context reconstruction and total cost on matched workflows.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- A paid pilot demonstrates incremental value beyond an existing coding agent.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: QA-02, DEV-02.

### BP-05 — Market hypotheses lack comparative outcome and paid cohort evidence.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P1; chapters 5/6
Resolution: Pre-register a task sample with difficulty, eligible exclusions, human baseline, current customer tool stack and blind acceptance. Pair coding benefit with retained-memory benefit.
Acceptance: At least ten design-partner teams and repeated use by five, with raw counts, cost, failures and buyer willingness to pay; no claim of statistical market leadership from that sample.

### BP-13 — Weekly retained outcome and eligible acceptance can be gamed by selecting easy tasks or generating needless “fixes.”

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P1; product metrics
Resolution: Include all submitted task outcomes, excluded reason, task difficulty, actual regression/harm, useful rejected analysis and baseline time. Outcome utility is customer-rated, not agent self-voted.
Acceptance: Cohort metrics reproduce from immutable event receipts; denominator changes versioned; independently sampled harmful outcomes reported.

## AUD-11 — Blast-radius containment of learning

Status: open; priority: P1; owner: Evolution lead; kind: engineering-and-verification.

Current: A popular but incorrect lesson can propagate globally faster than it is corrected.

### Required work

- Limit lesson rollout by scope and rate, track affected releases, quarantine disputed knowledge and propagate signed withdrawal.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- Poisoned lesson cannot reach every tenant before detection; rollback is demonstrated.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: AUD-03, AUD-05.

### AK-12 — derivation invalidation can become a graph-wide denial-of-service

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** K / “Scaling, security, resilience and production acceptance” / “Billion-relationship scaling”; E / “Collective intelligence and graph evolution”.

A widely used erroneous lesson or public dependency may have enormous descendant fanout. Immediate recomputation competes with incident work, while serving stale derivations can enable unsafe effects.

**Resolution:** priority lanes for authorization invalidation, critical safety retraction and ordinary freshness; compact dependency manifests; lazy validity checking plus bounded recompute. Pin effect prerequisites to fresh admitted evidence. Rate-limit adversarial revise/retract churn without delaying access denial. Isolate blast radius by library release and consumer cohort.

**Gate:** revoke a million-dependent pattern under load; prove protected operations fail closed, unaffected tenants remain available and progress/lag metrics stay truthful.

## AUD-12 — Cross-cell budget conservation

Status: open; priority: P0; owner: Runtime lead; kind: engineering-and-verification.

Current: Parent and child workflows in separate regions can reserve the same remaining spend.

### Required work

- Keep a root reservation authority; transfer signed allocations with durable debit before credit and reconcile uncertain handoff.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.
- Implement immutable balanced financial posting separately from operational reservations; currency-consistent settlement and compensating corrections; reconcile provider charges above reservation without silently widening user budget.

### Acceptance evidence

- Network partition cannot multiply available funds or release unresolved liability.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.
- Duplicate receipts, currency mismatch, imbalance and immutable-history edits fail; uncertain liability and controlled exposure are explicit.

Dependencies: RUN-03, DATA-01.

### AK-03 — credits cannot fund actual exploration independently of money

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** A / “Economy semantics”; E / “Agent economy”.

A correctly states nonfinancial credits are not real usage/billing authority. E says credits fund exploration inside fixed budgets. That wording can be implemented as an exchange rate that authorizes spend through reputation.

**Resolution:** credits influence allocation priority for already authorized and reserved budget; they never create, increase or transfer financial entitlement. A policy-controlled budget allocator may consider credit as one advisory input. Exact money reservations and tenant spending caps remain separate authoritative ledgers.

**Gate:** arbitrarily inflate credits and verify no grant, vote slot, model call or spend cap increases; show allocation receipt references a pre-existing money reservation.

### AK-05 — cross-cell budget and sponsorship transfers lack a crash-safe protocol

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** A / “Dynamic swarm graph”, “Scheduler policy”, “Capacity and partitioning”.

Exactly one financial root and conserved budgets are correct requirements. The documents do not define how a delegating cell reserves and transfers budget when the receiving cell accepts but the acknowledgement is lost. Ordinary outbox delivery alone cannot decide whether money may be refunded.

**Resolution:** allocate unique transfer IDs and non-overlapping child reservation ceilings. Sender records prepared reservation, receiver records accepted allocation, sender records committed delegation; duplicates converge to the same receipt. Until reconciliation resolves unknown acceptance, funds remain unavailable to new work. Refund only after receiver proves cancellation/fence or no acceptance. The receiving cell cannot enlarge the root budget. This is an application protocol with ledger reconciliation, not a claim of universal distributed exactly-once delivery.

**Gate:** fault-inject each boundary, duplicate requests, stale epochs and lost acknowledgements; assert total settled plus reserved usage never exceeds authorized root ceiling; assert one charge root per attempt.

## AUD-13 — Residency-local placement authority

Status: open; priority: P1; owner: Infrastructure lead; kind: engineering-and-verification.

Current: A global quorum can violate residency or block independent regional operation.

### Required work

- Separate global non-content locator from per-residency ownership authority. Transfer across boundaries only under explicit policy with fencing.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.
- Specify quorum geography, lease/clock assumptions, allowed DR destinations and remote target fencing limitations by residency contract.

### Acceptance evidence

- Loss of another residency domain does not grant or revoke local authority incorrectly.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.
- Partition/skew/stale-home tests show one writer; no regional DR claim if policy disallows an alternate region.

Dependencies: DATA-01, OPS-04.

### SI-06 — Placement consensus must fit residency and failure domains

Open review work package. Source: BUILD-BIBLE/reviews/security-infrastructure.md.

**Priority:** P0 design clarification before global infrastructure. **Sources:** production chapters 01, 09 and 17.

The architecture correctly chooses single home writers and a consensus-backed placement authority. It leaves exact quorum geography and global-versus-regional ownership scope to implementation. A global quorum holding private membership/ownership records across prohibited jurisdictions could violate residency; a quorum with an effective single-region majority could prevent disaster promotion; cached routing cannot safely grant ownership.

**Resolved design:** Use a separate ownership authority domain per contracted residency boundary. Each domain owns routing epochs/write leases for its permitted cells and has an explicitly tested quorum placement. Global routing contains only reviewed minimal locator metadata or opaque tenant routing handles; it delegates ownership to the domain. A residency policy permitting only one region cannot claim regional-disaster promotion outside that region. Its contracted mode offers zone resilience and controlled outage/restore until a permitted DR location exists. Dedicated disconnected enterprise deployments run local authority and do not participate as another writable cloud master.

Consensus partitions never create a second authority. Old-home lease expiry plus bounded monotonic time/skew checks and explicit fencing governs promotion. Sixty-second lease, twenty-second renewal and five-second skew bounds are experiment targets from ADR clarification; they must be adjusted from measured infrastructure and target-adapter behavior. A stale region cannot dispatch new privileged operations through a cached epoch. Remote targets that cannot validate epochs require exclusive broker authority and a documented limit on already-dispatched effects; epoch fencing does not unsend a request already accepted by a cloud API.

**Proof required:** Partition every majority/minority shape; old region isolation; clock jump/skew beyond bound; delayed renewals; authority recovery from backup; conflicting migration; adapter unable to check epoch; delayed provider completion after promotion. Show state transitions and zero double-writer privileged dispatch. Report actual loss windows and unresolved remote operations.

## AUD-14 — Disconnected and local mode contract

Status: open; priority: P1; owner: Enterprise lead; kind: engineering-and-verification.

Current: Offline enterprise or desktop features can imply stale privileged authority.

### Required work

- Declare read-only cached mode by default; scoped expiring offline grants and local budgets are opt-in; reconcile conflicts on reconnect.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- Expired/offline credentials cannot authorize cloud effects.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: SEC-02, AUD-13.

## AUD-15 — Licensed content and export feasibility

Status: open; priority: P1; owner: Compliance lead; kind: engineering-and-verification.

Current: 3D/CAD datasets, proprietary sources and market feeds may forbid the proposed processing.

### Required work

- Registry for code/model/dataset/content/tool licenses and permitted inference/training/export. Unsupported licensed runtime stays unavailable.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- Artifact export and training check rights independently.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: INT-01, LEGAL-01.

## AUD-16 — Long-lived compatibility and ownership succession

Status: open; priority: P1; owner: Architecture lead; kind: engineering-and-verification.

Current: Decades of jobs can outlive vendors, signatures and maintainers.

### Required work

- Contract deprecation windows, migration replay, cryptographic inventory, portable exports, key rotation and successor stewardship.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- Historical releases can be reconstructed and verified after provider replacement.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: DATA-03, REL-01.

## AUD-17 — Customer concentration and provider collapse

Status: open; priority: P1; owner: CEO; kind: engineering-and-verification.

Current: One model, cloud, customer or marketplace publisher can dominate economics and uptime.

### Required work

- Measure concentration; maintain tested alternatives, cash stress scenarios, model outage routing and export pathways.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- Loss of largest provider/customer has a bounded documented response.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: AUD-09, AUTH-03.

## AUD-18 — Experiment interference and causal claims

Status: open; priority: P1; owner: Research lead; kind: engineering-and-verification.

Current: Concurrent repairs and business experiments confound apparent improvements.

### Required work

- Track assignment units, simultaneous interventions, treatment provenance, holdouts and outcomes; suspend causal claims when interference is unresolved.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- Revenue/latency attribution reports known confounders.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: TWIN-01, BIZ-01.

## AUD-19 — Operational readiness of the company

Status: open; priority: P1; owner: Operations lead; kind: engineering-and-verification.

Current: A technical platform still fails without support, procurement, contracts and escalation coverage.

### Required work

- Create trust center, customer onboarding/offboarding, vendor assessment, insurance/procurement review, incident communications and support staffing.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.
- Operate disclosure/abuse channels, customer incident communications, key-custody agreements, export/exit and support ticket-scoped access.

### Acceptance evidence

- A real pilot rehearses escalation, export, billing dispute and incident notification.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.
- Pilot rehearses vulnerability report, incident notification, export/delete and support-access expiry.

Dependencies: REL-01, LEGAL-01.

### SI-10 — Enterprise compliance and support are operating systems, not swarm names

Open review work package. Source: BUILD-BIBLE/reviews/security-infrastructure.md.

**Priority:** P1 discovery/program work; P0 for any regulated customer contract. **Sources:** production security/operations chapters; LEGAL-01 and SEC-03.

Legal and compliance departments are catalog definitions. Hash chains, encryption and audit retention alone do not establish a compliance program. Applicable law, contracts, regulated data classes, subprocessors, source licenses and qualified review ownership depend on actual customers and deployments.

**Resolved design:** Maintain scoped control inventory, system/data inventory, processing purpose, owner, evidence cadence, exception expiry, contract/subprocessor mapping, incident obligations and independent review records. Customer support uses case-bound time-limited grants, stronger reauthentication, recorded reason and customer-visible access. E2EE support cannot promise server-side plaintext inspection. Account closure/export/deletion, billing disputes, abuse reporting, source rights, vulnerability disclosure and customer-owned disaster recovery need explicit journeys/runbooks. Retention defaults cannot override a legal hold or promise literal perpetual storage. No legal conclusion or certification is generated solely by an agent.

**Proof required:** Simulated support misuse, expired support grant, customer key revocation, retention hold conflict, deletion after export, incident notification exercise, subprocessor change, connector consent withdrawal and marketplace license mismatch. Qualified accountable humans determine applicable requirements and disposition.

### BP-09 — Founder-led support can hide unpriced service labor and on-call dependence.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P1; chapters 6/7
Resolution: Log onboarding, customization and support minutes by account; separate product revenue from service contracts; define escalation owner and replacement.
Acceptance: Mature cohort contribution includes support and direct delivery costs; founder absence drill and support backlog trigger work.

### BP-15 — Enterprise badges and promised SLAs can precede operationally qualified service.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P1; enterprise strategy
Resolution: Contract only a demonstrated region/data mode/action class; maintain responsibility matrix for customer-owned workers, provider failures and support access.
Acceptance: Signed testable SLO/SLA scope, restore rehearsal, escalation, access review, procurement evidence and separately costed deployment.

## AUD-20 — Option-based future readiness

Status: open; priority: P1; owner: Strategy lead; kind: engineering-and-verification.

Current: No design is future-proof against AGI or paradigm shifts.

### Required work

- Fund reversible options with invalidation triggers; test model/tool/compiler/schema replacement instead of predicting inevitable dominance.
- Implement versioned contracts, failure/recovery behavior, operational ownership and observability.
- Exercise representative authorized workflows and negative/adversarial cases; retain exact artifacts and receipts.

### Acceptance evidence

- Each future scenario maps to a reversible experiment and stop rule.
- Evidence binds the exact implementation revision and scope; design checks alone do not close this task.

Dependencies: FUT-01, BIZ-02.

### AK-23 — civilization metrics must reward user outcomes rather than organizational expansion

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** E / “Civilization model”, “Scorecard”, “Agent economy”; A / “Autonomous-company simulation”.

A complex agent economy may consume more coordination than it saves. Simulated emergence or rising agent population can be mistaken for platform value.

**Resolution:** compare dynamic swarms against single-agent, deterministic automation and human-assisted baselines at equivalent budgets. Retain swarm structure only where measured quality, cost, resilience or speed improves. Expose verified deliverables per dollar, user-benefit outcomes, dissent resolution, recurrence and concentration alongside internal scores. Simplification and safe retirement count as improvements.

**Gate:** matched workload experiments; coordination overhead and failure correlation included; raw agent/idea/message count cannot increase the headline score.

## AUD-21 — Curated marketplace release and settlement

Status: open; priority: P1; owner: Marketplace lead; kind: engineering-and-verification.

Current: Final audit identified a missing or incomplete contract/verification gate.

### Required work

- Signed module admission, permission upgrades, malicious release revocation, independent domain evaluations and payout/refund reconciliation.
- Implement and test normal, denial, concurrency, recovery and revocation paths where applicable.

### Acceptance evidence

- Signed module admission, permission upgrades, malicious release revocation, independent domain evaluations and payout/refund reconciliation.
- Exact revision, operational owner and repeatable evidence are recorded.

Dependencies: SEC-02, AUD-07, AUD-09.

### BP-10 — Early marketplace storefront can outpace pack quality, rights and liquidity.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P1; roadmap phase 3/7
Resolution: Launch curated first-party registry first. Open submission requires signing, staging, entitlement isolation, provenance/license, revocation and support accountability.
Acceptance: Real outside developer publishes a qualified pack, user receives measurable outcome, withdrawal disables unsafe versions and settlement reconciles.

## AUD-22 — Provider billing path and liability reconciliation

Status: open; priority: P1; owner: Finance/platform lead; kind: engineering-and-verification.

Current: Final audit identified a missing or incomplete contract/verification gate.

### Required work

- Separate customer plan usage, platform fees, API receipts and unknown liability; prove no double billing or unauthorized fallback.
- Implement and test normal, denial, concurrency, recovery and revocation paths where applicable.

### Acceptance evidence

- Separate customer plan usage, platform fees, API receipts and unknown liability; prove no double billing or unauthorized fallback.
- Exact revision, operational owner and repeatable evidence are recorded.

Dependencies: AUTH-02, AUD-12.

### BP-03 — Retail-value allowances, expected monthly jobs and provider/BYO-account charges are not one entitlement contract.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P0; chapters 4/8
Resolution: Included jobs in forecast are utilization hypotheses. Production allowances use immutable tariff versions and monetary/quantity ledger, distinguish external provider charges, and reserve actual maximum cost before dispatch.
Acceptance: Trial receipts demonstrate included allowance consumption, overage opt-in, hard cap, refund/credit, downgrade and no double billing.

## AUD-23 — Unified service/API compatibility matrix

Status: open; priority: P1; owner: Architecture lead; kind: engineering-and-verification.

Current: Final audit identified a missing or incomplete contract/verification gate.

### Required work

- Version /v1 APIs, event schemas, state mappings, plugins, models and migrations; run replay/compatibility and deprecation checks.
- Implement and test normal, denial, concurrency, recovery and revocation paths where applicable.

### Acceptance evidence

- Version /v1 APIs, event schemas, state mappings, plugins, models and migrations; run replay/compatibility and deprecation checks.
- Exact revision, operational owner and repeatable evidence are recorded.

Dependencies: DATA-01, RUN-02.

### AK-01 — lifecycle table, diagram and learning execution disagree

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** A / “Required lifecycle states”; AL / `transitions` and `activity_allowed_in`.

The prose/table and JSON permit Created→Archived, Learning→Dormant, Active→Learning and Active→Archived, while the diagram omits these edges. More importantly, Learning requires an approved training/evaluation objective, but AL allows execution activities only in Active. An engineer following that contract can prevent a Learning principal from doing the very work needed to qualify.

**Resolution:** durable Learning permits only learning/evaluation activity classes under separate narrow grants. Busy/Reviewing/Collaborating remain display activities; their eligibility must include lifecycle plus task class, not an unconditional Active-only list. Training orchestration may alternatively be performed by an Active evaluator on an inactive candidate principal; select and document that pattern per learning mode. Generate diagram/table/API transitions from a canonical transition-and-guard registry. Every permitted edge needs entry, exit, effects, compensation and quiescence requirements.

**Gate:** enumerate all allowed and forbidden transitions; execute learning qualification without granting ordinary production work; prove concurrent retirement blocks new learning dispatch; test diagram/contract parity.

### AK-04 — assertions need one canonical modality taxonomy

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** K / “Provenance and epistemic states”; E / “Provenance and contradictions”; K / “Answer contract”.

K uses observed/human_asserted/inferred/predicted; E uses observed/inferred/simulated/forecast; answer labels additionally include recorded_decision/hypothesis. These are related concepts but not interchangeable schema enumerations.

**Resolution:** separate epistemic modality (observation, human assertion, inference, hypothesis, forecast), evidence environment (real, sandbox-real, synthetic-simulation), and admission lifecycle. `recorded_decision` is an answer presentation type sourced from an accepted decision. Map old enumerations through explicit versioned adapters. Synthetic evidence never becomes a real observation through migration.

**Gate:** round-trip all old examples; reject simulated forecasts from factual-current projections; verify exact timestamps and original modality survive export/import.

## Supreme swarm hostile review

### AK-21 — genome compatibility solver needs explicit constraint semantics

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** E / “Genome record”, “Selection”; A / “Marketplace packs”.

Five module families and hashes support provenance, but no defined compatibility language decides conflicting decision rules, incompatible retrieval schemas, license combinations or tool behavior changes.

**Resolution:** manifest includes typed interface versions, environmental predicates, dependency ranges resolved to hashes, data-right constraints, policy requirements and resource envelope. Solver returns a reproducible compatibility proof or unsatisfied constraints; unresolved behavioral compatibility requires environment tests. Never resolve a security/policy conflict by weighted fitness.

**Gate:** contradictory decision modules, incompatible schema/embedding generation, withdrawn dependency and conflicting source rights fail admission; compatible recombination still undergoes behavior qualification.

## AUD-24 — Behavior-evidence policy by action class

Status: open; priority: P0; owner: Security/development lead; kind: engineering-and-verification.

Current: Final audit identified a missing or incomplete contract/verification gate.

### Required work

- Snapshot edit versus validated change versus deployment has explicit required evidence; missing/stale tests cannot authorize high-risk actions.
- Implement and test normal, denial, concurrency, recovery and revocation paths where applicable.

### Acceptance evidence

- Snapshot edit versus validated change versus deployment has explicit required evidence; missing/stale tests cannot authorize high-risk actions.
- Exact revision, operational owner and repeatable evidence are recorded.

Dependencies: QA-02, AUD-02.

### SI-03 — Snapshot apply can proceed with no external test result

Open review work package. Source: BUILD-BIBLE/reviews/security-infrastructure.md.

**Priority:** P0 for future PR/deployment policy; current snapshot-only behavior must remain explicitly labeled. **Source:** `lib/jobs.ts` `decide()` apply guard; `architecture/STATUS.md`; `PRODUCTION-ARCHITECTURE/10-autonomous-development-and-healing.md`.

The current apply guard blocks explicit `externalTests.passed === false` but permits null/missing external tests. Passing static checks and bounded model review can therefore authorize a stored snapshot change. That is consistent only with the documented prototype integrity workflow; it does not satisfy the target release contract for behaviorally tested code.

**Resolved design:** Distinguish snapshot experimentation, repository delivery, staging deployment and production release in action policy. A snapshot-only change can use its stated low-risk policy. Repository/deployment actions evaluate mandatory evidence by risk and affected behavior. Required evidence cannot pass through null, unsupported, stale, partial or unrelated results. Review consensus cannot waive a hard test/security veto. Display missing evidence clearly instead of treating absence as success.

**Proof required:** For each action tier test missing/failed/expired/wrong-digest tests, partial scanner coverage, changed base revision and missing required reviewer role. A low-risk snapshot action must never silently become an external release permission.

## AUD-25 — Atomic active-job admission

Status: open; priority: P0; owner: Runtime lead; kind: engineering-and-verification.

Current: Final audit identified a missing or incomplete contract/verification gate.

### Required work

- Enforce concurrency/resource admission atomically; concurrent enqueue cannot exceed quota; failure releases only valid allocations.
- Implement and test normal, denial, concurrency, recovery and revocation paths where applicable.

### Acceptance evidence

- Enforce concurrency/resource admission atomically; concurrent enqueue cannot exceed quota; failure releases only valid allocations.
- Exact revision, operational owner and repeatable evidence are recorded.

Dependencies: RUN-03.

### SI-04 — Active-job count is not atomic admission or financial reservation

Open review work package. Source: BUILD-BIBLE/reviews/security-infrastructure.md.

**Priority:** P1 in the prototype; P0 before paid concurrent usage. **Source:** `lib/jobs.ts` `enqueue()`; `PRODUCTION-ARCHITECTURE/16-relational-schema-and-data-lifecycle.md`.

The current ten-job guard reads COUNT before insertion. Concurrent requests can all observe a permitted count and exceed it. The fixed attempts/context/patch budgets remain useful but do not establish a transactional organization-wide compute or currency ceiling.

**Resolved design:** Atomically acquire a quota slot and a maximum-cost reservation under the owning authority before accepting work. Split root budgets into conserved child allocations; never let recursive agent creation open a fresh unlimited balance. Explicitly reserve worst-case uncertain provider charges until reconciled. Fairness applies to tenant/project/provider/work class independently. Cancellation releases undispatched reservations and reconciles dispatched consumption rather than refunding blindly.

**Proof required:** Barrier-synchronized concurrent admissions; crash before/after reservation; duplicate admission key; canceled queued task; exhausted root budget; child allocation conservation; provider timeout with later usage receipt; retry without double reservation. No accepted task may lack reserved authority.

## AUD-26 — Awaited sandbox cleanup and evidence

Status: open; priority: P0; owner: Worker/SRE lead; kind: engineering-and-verification.

Current: Final audit identified a missing or incomplete contract/verification gate.

### Required work

- Await cleanup outcomes; verify no surviving containers/files after success, timeout, cancellation and runner crash; alert unresolved cleanup.
- Implement and test normal, denial, concurrency, recovery and revocation paths where applicable.

### Acceptance evidence

- Await cleanup outcomes; verify no surviving containers/files after success, timeout, cancellation and runner crash; alert unresolved cleanup.
- Exact revision, operational owner and repeatable evidence are recorded.

Dependencies: RUN-01.

### SI-05 — Docker cleanup and image identity require stronger guarantees

Open review work package. Source: BUILD-BIBLE/reviews/security-infrastructure.md.

**Priority:** P1 for a supervised trusted-maintenance runner; P0 before hostile multi-tenant execution. **Sources:** `worker/runner.mjs`, `worker/README.md`; production ADR-009 and security chapter.

The runner constrains commands, filesystem, network, user and resources; these are useful controls. It uses a mutable image tag with `--pull=never`; absence of pulling does not bind a particular preinstalled image digest. Output/time limits invoke `docker rm -f` as an unawaited child process. The source directory is removed in finally, but successful container destruction is not awaited or independently read back. No authoring-environment Docker run established actual isolation or cleanup. Rootless/daemon configuration, host patching and mount semantics remain unspecified operational inputs.

**Resolved design:** Pin verified image digest and toolchain manifest. Await supervised destruction, read back container/VM absence, preserve sanitized cleanup receipt, and quarantine a host with uncertain cleanup. Lease-scoped jobs cannot continue consuming resources after cancellation or report completion. Production hostile repository code moves to an independently reviewed microVM-equivalent boundary in separate account/network/node pools; ordinary hardened containers remain a declared trusted lower-risk profile. Never mount cloud/write credentials into job execution. Record host and runtime versions and define patch rollout/revocation.

**Proof required:** Timeout/output overflow, daemon crash, process spawn failure, signal interruption, delayed cleanup, escaped child process/resource pressure, stale worker, mutable-tag substitution and artifact poisoning. Host reuse is denied while cleanup is inconclusive.

## AUD-27 — Causal repair and symptom-recurrence tracking

Status: open; priority: P1; owner: Operations lead; kind: engineering-and-verification.

Current: Final audit identified a missing or incomplete contract/verification gate.

### Required work

- Distinguish symptom relief from root-cause repair and verify delayed recurrence and business invariants.
- Implement and test normal, denial, concurrency, recovery and revocation paths where applicable.

### Acceptance evidence

- Distinguish symptom relief from root-cause repair and verify delayed recurrence and business invariants.
- Exact revision, operational owner and repeatable evidence are recorded.

Dependencies: OPS-02, AUD-18.

### AK-20 — evolution rollback is not sufficient for delayed or irreversible harm

Open review work package. Source: BUILD-BIBLE/reviews/agents-knowledge.md.

**Sources:** E / “Selection”, “Experimental contract”, “Omega governing protocol”; A / “Cancellation, preemption and recovery”.

Changing a prompt back cannot undo leaked data, a bad migration or an external message. Short canaries may miss delayed harm, customer churn and recurring failures.

**Resolution:** distinguish code/config rollback, external compensation, data repair and irrecoverable harm. Canary release plan includes attribution window, delayed monitoring, maximum blast radius and adverse-outcome ownership. Security fixes may have justified noninferiority exceptions but cannot weaken current grants. Uncertain effect outcomes remain reconciliation blockers.

**Gate:** delayed regression, leaked-secret event, irreversible migration and provider call that timed out after accepting a change; no false recovered status from restoring an old genome alone.

## AUD-28 — Engineering staffed capacity and demand forecast

Status: open; priority: P1; owner: Founder/finance lead; kind: engineering-and-verification.

Current: Final audit identified a missing or incomplete contract/verification gate.

### Required work

- Replace target-only acquisition with funnel, sales/onboarding capacity and retention evidence; stress cash collection and contract liabilities.
- Implement and test normal, denial, concurrency, recovery and revocation paths where applicable.

### Acceptance evidence

- Replace target-only acquisition with funnel, sales/onboarding capacity and retention evidence; stress cash collection and contract liabilities.
- Exact revision, operational owner and repeatable evidence are recorded.

Dependencies: AUD-09, AUD-10.

### BP-04 — Seed envelopes and six-month budgets can be read as enough capital for the five-year expansion. Even corrected Base exhausts assumed cash before annual profitability.

Open review work package. Source: BUILD-BIBLE/reviews/business-product.md.

Source/severity: P0; chapters 7/8
Resolution: Fund the next evidence milestone, not all projected hiring. Use monthly liquidity, committed obligations and stop-hiring gates; cash is not automatically replenished by financing.
Acceptance: Board forecast shows planned raise dates, collection delays, downside staffing response and signed funding/available cash separately from target round sizes.

## AUD-29 — Cryptographic inventory and migration drill

Status: open; priority: P1; owner: Security lead; kind: engineering-and-verification.

Current: Final audit identified a missing or incomplete contract/verification gate.

### Required work

- Record cryptographic algorithms/key lifetimes/signature dependencies; test supported algorithm migration and historical verification.
- Implement and test normal, denial, concurrency, recovery and revocation paths where applicable.

### Acceptance evidence

- Record cryptographic algorithms/key lifetimes/signature dependencies; test supported algorithm migration and historical verification.
- Exact revision, operational owner and repeatable evidence are recorded.

Dependencies: SEC-03, AUD-16.

## AUD-30 — Correction, withdrawal and cost-liability UI

Status: open; priority: P1; owner: Product lead; kind: engineering-and-verification.

Current: Final audit identified a missing or incomplete contract/verification gate.

### Required work

- Accessible flows expose correction/appeal, source withdrawal status and unresolved effect/cost; preserve resumability and current authorization.
- Implement and test normal, denial, concurrency, recovery and revocation paths where applicable.

### Acceptance evidence

- Accessible flows expose correction/appeal, source withdrawal status and unresolved effect/cost; preserve resumability and current authorization.
- Exact revision, operational owner and repeatable evidence are recorded.

Dependencies: UX-02, AUD-03, AUD-22.

