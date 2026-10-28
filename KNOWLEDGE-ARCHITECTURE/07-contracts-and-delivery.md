# Service contracts, implementation order and verification

## Knowledge APIs

All routes are versioned under /v1, authenticated and tenant context derives from the server session/capability rather than caller-chosen unrestricted tenant IDs. Commands use idempotency keys bound to principal/action/target/input hash; accepted commands return operation handles. Effectful operations require existing platform capability and approval policy. Never expose raw graph/vector database credentials to clients.

| Route | Input | Result and policy |
|---|---|---|
| POST /knowledge/observations | Pinned artifact manifests, collector version, source context and coverage | Async extraction operation; source.read plus knowledge.ingest |
| POST /knowledge/assertions | Typed sourced assertion proposal | Admission receipt; observed claims require collector evidence; inference rules versioned |
| POST /knowledge/identities/resolve | Candidate IDs, merge/split plan and evidence | Reviewed reversible mapping operation; preserves source lineage |
| GET /knowledge/entities/{id} | Context, valid_at, known_at | Authorized version plus evidence and completeness |
| POST /knowledge/traverse | Seed IDs, predicate allowlist, direction, depth and limits | Scoped nodes/edges, cursors and coverage; server applies smaller policy budget |
| POST /knowledge/timeline/compare | Two snapshot manifests, bounded scope | Temporal delta and skew; asynchronous for archived snapshots |
| POST /memory/entries | Scoped layer/kind/evidence/retention | Versioned memory receipt; no implicit promotion |
| POST /memory/entries/{id}/promote | Destination scope, purpose, evidence and consent | Policy-reviewed copy/view reference and lineage |
| POST /memory/entries/{id}/retract | Reason and evidence | Retraction operation with dependent invalidation receipts |
| POST /decisions | Problem, alternatives, criteria, risks and outcomes plan | Draft version; approval separate from create |
| POST /decisions/{id}/accept | Exact revision, accountable signer and policy | Accepted decision audit record; unauthorized signer rejected |
| POST /decisions/{id}/outcomes | Metrics, method, observation period and evidence | Outcome revision preserving expected values |
| POST /intelligence/search | Question, authorized scope, time/scenario and budget | Cited answer or async investigation; unknowns and uncertainty included |
| GET /intelligence/answers/{id} | Answer ID | Rechecked evidence policy; expired/retracted answer returned stale/redacted or recomputed |
| POST /knowledge/gaps/scan | Coverage manifest, rule set and bounded scope | Findings with applicability and confidence, not unconditional missing claims |
| POST /knowledge/publications | Generalized pattern, source rights, review and consent | Controlled global corpus publication; ordinary memory.write insufficient |
| POST /knowledge/deletions | Authorized target and legal/retention disposition | Tracked invalidation and purge workflow; not direct arbitrary storage deletion |

Errors use stable codes: scope_denied (without hidden object disclosure), temporal_context_required, snapshot_incomplete, projection_behind, evidence_unavailable, identity_ambiguous, unsupported_predicate, budget_exhausted, revision_conflict and operation_pending. Existing platform rate/idempotency/problem contracts apply. Streaming search emits retrieval_started, evidence_ready, claim_ready, verification_update and completed; intermediate generated claims remain explicitly provisional. Stop/cancel commands fence future work and reconcile costs; already published memory writes are corrected through history rather than hidden deletion.

## Events and state machines

Journal emits observation.committed, assertion.admitted, assertion.disputed, assertion.retracted, identity.resolved, projection.advanced, memory.admitted, memory.promoted, summary.invalidated, decision.accepted, decision.evaluated, gap.detected, gap.resolved, answer.invalidated, publication.approved and deletion.completed. Use the production event envelope, exact tenant/context/entity references, aggregate sequence, epoch and evidence/artifact references. No sensitive raw content in event payloads. Outbox/inbox provide at-least-once processing with idempotent receipts; external source effects do not become exactly-once through Kafka.

Ingestion lifecycle: discovered → collecting → collected → parsed → proposed → admitted → projecting → searchable; failures may enter retryable, quarantined or coverage_partial. An operation's searchable stage requires all mandatory projections for its declared retrieval mode; it may provide lexical-only mode when semantic generation is unavailable. Memory lifecycle uses proposed/accepted/disputed/superseded/retracted. Global publication uses draft → rights_review → privacy_review → owner_approved → indexed → withdrawn. Skipping reviews is a policy violation, not a performance optimization.

## Prompt requirements traceability

The ontology catalog covers all 40 requested entity types. Chapter 1 defines schemas and connected provenance. Chapter 2 defines all eight memory layers and every decision field. Chapter 3 provides past/current/future timeline, indexing and source processing. Chapter 4 defines reasoning for every requested question and retrieval stages. Chapter 5 covers all eight missing-knowledge categories and organizational blind spots. Chapter 6 defines billion-edge scaling, security, recovery, quality and production gates. This chapter defines APIs/events and implementable delivery order. Reference JSON schemas, examples and SQL supplement the prose rather than replacing all service migrations.

## Build sequence and evidence

| Stage | Deliverable | Must prove |
|---|---|---|
| K1 | Identity, ontology registry, evidence selectors and collector coverage | Required types, no fabricated semantic edges, stable revision identity |
| K2 | Canonical journal, admission, scoped RLS/ABAC and outbox | Idempotency, invalid evidence rejection, same-tenant FKs, unauthorized source rejection |
| K3 | Versioned graph/lexical projections and temporal manifests | Replay, incomplete batch isolation, current/historical distinction, bounded traversal |
| K4 | Eight memory layers, decisions and consolidation | Restart persistence, correction propagation, no scope expansion, accepted decision fidelity |
| K5 | Vector generations and hybrid retrieval | Domain benchmark, authorization prefilter/recheck, model migration, citation selectors |
| K6 | Reasoning plans, deterministic rules and cited answers | Unsupported conclusions abstain, causal hypotheses tested, context and time respected |
| K7 | Gap engines and organizational continuity | Coverage-conditioned negatives, fair owner analysis, validated failover/handoff evidence |
| K8 | Future/innovation and global pattern publication | Calibrated uncertainty, privacy/right reviews, deletion/withdrawal propagation |
| K9 | Multi-cell scale/recovery and operational readiness | Measured target workloads, hot hubs, failure injection, restore and fenced failover |

Current deliverable status is SPECIFIED: documentation and reference contracts exist and have automated checks. Reference fixtures are design examples, not production repository intelligence. Required live ingestion, graph/memory/reasoning engines, provider execution and multi-cell services remain implementation work. The existing unfinished-work register stays canonical; these stages add detail and acceptance gates to its knowledge/memory/intelligence domains.
