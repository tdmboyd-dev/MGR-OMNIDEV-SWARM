# Architecture decisions, evolution and implementation migration

## Decision register

| ADR | Decision | Rationale / consequence |
|---|---|---|
| ADR-001 | Cell-based regional platform | Bounded failure/scale/residency domains; placement and migration control are required |
| ADR-002 | Single home writer per aggregate | Clear transaction/side-effect ownership; regional promotion must fence old writers |
| ADR-003 | PostgreSQL authority; specialized projections | Financial/policy/task transactions stay separate from graph/vector/analytics scale |
| ADR-004 | Neo4j partitioned property graph | Typed traversal model; no assumption of one globally sharded graph database or unlimited instance capacity |
| ADR-005 | Qdrant versioned retrieval partitions | Model/modality generation separation; mandatory pre-query authorization plus current-result recheck |
| ADR-006 | Temporal durable workflows plus Kafka facts | Workflow state/retry semantics separate from replayable business events |
| ADR-007 | Agent principal distinct from worker process | Idle agents cost metadata, not permanent compute; logical hierarchies have no fixed depth |
| ADR-008 | Policy/tool broker outside models | Model proposals cannot self-authorize or acquire secrets |
| ADR-009 | Attested disposable hostile-code execution | Tenant boundaries require stronger reviewed isolation than an ordinary shared container |
| ADR-010 | Account-first supported provider authorization | Identity, resource consent and model usage are distinct; hosted provider approval cannot be invented |
| ADR-011 | Private cross-project memory scoped to organization | Global patterns use public/consented privacy-reviewed material only |
| ADR-012 | Separate E2EE and server-assisted processing modes | Server-blind data cannot also be freely parsed by server-side AI |
| ADR-013 | Exact immutable financial ledger and root reservations | Agent expansion cannot create credit; retries/uncertain outcomes require reconciliation |
| ADR-014 | Evidence-bound reviews/releases/scores | UI status and model confidence cannot establish execution, correctness or a deployment |
| ADR-015 | Portable multi-cloud contracts | No Vercel dependency; managed-service differences and cloud identity remain explicit |
| ADR-016 | Expand/contract and versioned generations | Long-term jobs/data/plugins evolve without breaking histories or wiping provenance |

These decisions are selected target architecture. Product/legal/procurement details such as provider registration, managed-service editions, locations and financial terms remain implementation prerequisites, not undecided core topology. Significant changes need a new ADR with measured evidence and migration consequences.

## Directory and ownership clarification

Use a small consensus-backed placement/ownership authority (etcd-compatible consensus service with reviewed multi-region quorum/failure behavior) for migration epochs and write leases. PostgreSQL directory catalogs and signed cached routing snapshots serve lookups; they cannot independently grant a second writer. Consensus latency affects infrequent placement/lease renewal, not every dashboard read.

A home cell holds a renewable signed ownership lease with a conservative expiry and fencing epoch. New privileged dispatch requires a valid local lease and fresh regional policy/financial authority. During loss of placement quorum, allowed reads continue; new ownership cannot be promoted, and writes stop when the home lease expires. Promotion waits for proof of old fencing or lease expiry plus clock/skew margin. A customer target adapter verifies current epoch before sensitive side effects where supported; otherwise the broker's exclusive authority and receipt reconciliation are required. This sacrifices write availability during uncertain ownership to prevent split-brain changes.

The exact quorum placement, lease duration and clock margin are validated by partition tests; reference targets are 60-second leases, renewal at 20 seconds, and bounded tolerated skew under 5 seconds. They are not vendor guarantees. Dedicated disconnected enterprise deployments use their own ownership authority and explicitly contracted offline operation.

## Current implementation boundary

Current source baseline before this documentation: `ed32f851e6a8123c51e32538187198adac6a20c9`. Owner-private Sites/Vinext application with D1 records/jobs/settings; bounded snapshot analysis, native maintenance, candidate/rollback workflow, provider adapters, GitHub OAuth account flow and portable Docker runner. Baseline evidence: 31 acceptance + 63 runtime/account checks; HTTP providers stubbed; no live isolated host, hosted model-plan activation, production healing or multi-tenant scale verification.

This target architecture does not replace the current application merely by documenting PostgreSQL/Neo4j/etc. It defines migration and implementation contracts. No cloud/database provision, billing activation or public launch is authorized or claimed by the design deliverable.

## Migration waves and evidence gates

| Wave | Engineering outcome | Exit evidence / existing backlog |
|---|---|---|
| 0. Preserve foundation | Snapshot/export current D1 and source; keep owner-private; freeze IDs and record current behavior | Restore/read-back and scoped tests; DATA-03, REL-01 |
| 1. Real authorized loop | Supported model-account path, real repository consent, isolated worker, behavior tests and PR reconciliation | Real model request and isolated fix→tests→draft PR; AUTH-01/02, RUN-01, DEV-02, QA-01/02 |
| 2. Control plane | Organization/workspace/RBAC/ABAC, tenant IDs, PostgreSQL authoritative task/grant/operation/budget schemas | Cross-tenant denial, migration parity, lease/cancel/idempotency tests; SEC-02/03, RUN-03 |
| 3. Durable orchestration | Temporal workflow versions, agent registry, bounded hierarchical specialists, outbox/Kafka | Replay/crash/budget/permission failure suites; RUN-02, INT-01 |
| 4. Intelligence stores | Typed graph, source journal, scoped memory, vector/lexical indexes and projection watermarks | Rebuild/delete/ACL/coverage tests; GRAPH-01/02, DATA-01/02, GAP-01 |
| 5. Operational changes | Telemetry, incident diagnosis, authorized staging deployment, calibrated twin and repair loop | Induced incident repair/rollback with target receipts; OPS-01/02/03/04, TWIN-01 |
| 6. Cells/global distribution | Cell directory/ownership fencing, regional/zone resilience, tenant migration and multi-cloud recovery | Load, partition/failover and restoration drills; QA-03, DATA-03 |
| 7. Business/ecosystem | Domain integrations, research/innovation/futures, executive scores, marketplace and financial settlement | Per-domain/adapter evidence and ledger/quality validation; CONN/DOM inventories, BIZ, EXEC, REL |
| 8. Enterprise experience | Desktop/mobile/local bridges, voice/CLI, accessibility, dedicated/E2EE deployment modes | Device/consent/accessibility/enterprise isolation and support runbooks; UX-01/02/03, SEC-02 |

Waves stage implementation without removing scope. Parallel work can proceed behind stable contracts; opening millions of tenants before isolation and financial controls pass is not an acceleration strategy. Do not mark the 126 unfinished items completed when their architecture is written.

## D1-to-PostgreSQL migration

Add tenant/project/resource context and stable mappings without exposing a multi-user API prematurely. Export immutable source/record snapshots and hashes. Transform generic records into service aggregates with preserved IDs/provenance/history. Import to PostgreSQL in a test cell, compare counts/digests and replay baseline routes. Use an application-owned compatibility layer while switching authority, rather than two uncontrolled writable masters.

Dual projections may compare reads, but command writes have one authority at a time. Pause/fence mutation, drain or checkpoint jobs, migrate leases/attempt history/budgets, validate source/evidence manifests, switch API routing epoch and verify read-after-write. Keep an approved fallback until no post-cutover effects would be overwritten. Encrypted secrets require supported secure key handling/re-authorization, not plaintext CSV exports.

## Long-term evolution

Release contracts include API, event, graph, artifact, agent-template, policy, embedding and twin versions. A compatibility matrix links every executable plugin/template to these versions. Deprecation is a measured migration with affected tenants/runs and rollback, not a hidden rename. Evaluate new models/parsers/algorithms against held-out task/data sets, authorization constraints, quality/cost and source licenses before promotion.

Future scale upgrades add cells and partitions with admission and measured hot-spot migration; they do not require one increasingly enormous global database. New device/cloud/domain technologies attach through versioned bridge/plugin contracts. Existing decisions and failed experiments remain searchable and can be superseded with evidence.
