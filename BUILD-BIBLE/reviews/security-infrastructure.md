# Security, enterprise, infrastructure and scaling review

## Review scope and evidence boundary

This is the Prompt 8 hostile design review, not a penetration-test report, certification, live failover result or claim that the target platform has been implemented. The reviewer read the complete production chapters 01, 02, 04, 05, 06, 09, 10, 15, 16, 17 and 18, the core SQL/capability/event contracts, implementation status/completion documents, current-state and relevant unfinished-work chapters. Direct code inspection covers `db/schema.ts`, `db/store.ts`, `lib/jobs.ts`, `app/api/worker/route.ts` and `worker/runner.mjs`. Findings about those code paths are observations from source; they require executable regression fixtures before being dispositioned as fixed. OAuth implementation and every application route were not independently audited by this reviewer.

The present owner-private Sites/D1 application and the proposed regional PostgreSQL/Temporal/Kafka/Neo4j/Qdrant platform are different systems. The 94 previously recorded SQLite-backed acceptance/runtime checks do not establish cross-tenant isolation, model-provider consent, arbitrary application correctness, worker isolation, disaster recovery or production self-healing. Historical SHA references in architecture chapters describe checkpoints rather than today's application capability. `UNFINISHED-WORK/current-state.md` defines the implementation evidence boundary.

## Verdict from four hostile review teams

| Team | Attack on the design | Required response | Release consequence |
|---|---|---|---|
| Security | An agent's input can influence proposed code, reviews and claimed test results. A compromised worker can impersonate successful execution. A shared owner boundary does not establish tenant security. | Deterministic capabilities outside model reasoning; evidence-bound independently attributable execution; mandatory tenant/project enforcement; hostile-code isolation. | Keep owner-private. Block public multi-user access and production actions until material isolation and effect gates pass. |
| Enterprise | Residency, deletion, support access, key custody, provider terms and recovery responsibilities are described but not demonstrated. | Contracted deployment/processing modes, data inventory, evidence owners, support grants, restore/deletion exercises and provider-specific approvals. | Sell only demonstrated capability with explicit limitations; no certification or SLA claim from architecture alone. |
| Infrastructure | A logical global directory, regional policy and remote target effects can diverge during partitions. A database rollback cannot undo external writes. | Residency-scoped ownership consensus, monotonic fencing, operation intent/reconciliation and tested migration/recovery choreography. | Pause uncertain writes rather than admit a second writer or retry an unknown effect. |
| Scaling | Arithmetic describes averages; hot tenants, embedding refresh, graph federation, subscription fanout and incident storms can dominate resources and cost. | Reference workload distributions, end-to-end capacity budgets, resource-specific admission, reserved incident/control capacity and measured split thresholds. | Treat ten-million-repository capacity as a target; do not label it achieved or price unbounded usage. |

## Detailed findings and disposition requirements

### SI-01 — Tenant authorization is target architecture, not current application enforcement

**Priority:** P0 before any multi-user release. **Sources:** `db/schema.ts`, `db/store.ts`, `architecture/STATUS.md`, `UNFINISHED-WORK/06-security-and-verification.md` SEC-02; `PRODUCTION-ARCHITECTURE/05-security-auth-and-isolation.md`.

Current records/jobs/runtime settings do not carry an organization tenant key or app-level principal permissions. `list()` returns up to 10,000 records without tenant filtering. The current owner-private gateway is a valid stated boundary for a single owner's prototype; it cannot be repurposed into public sharing merely by changing Site audience. This is a missing release prerequisite, not evidence of a cross-tenant leak in an already deployed multi-tenant product.

**Resolved design:** Identity derives tenant membership; route resource IDs remain selectors. Every service operation checks tenant, project, action and source classification. Add tenant-aware immutable IDs, composite foreign keys, project-specific policy and revisioned grants before sharing. RLS provides a secondary SQL boundary; graph/vector caches, object URLs, exports, event subscriptions and support tooling enforce the same policy independently. Migration credentials stay separate from application roles. Dedicated tenant infrastructure still requires resource authorization.

**Proof required:** Two synthetic tenants plus two projects with different grants; cross-tenant known/unknown IDs; pooled DB context; forbidden graph counts/suggestions; filtered vector retrieval; revoked exports and object links; event subscription revocation; shared memory and historical summaries. Assert no content or existence side channel beyond a documented generic denial. SEC-02 stays open until those implemented paths and deployed gateway-to-service assertions are verified.

### SI-02 — Worker results lack immutable execution/evidence binding

**Priority:** P0 before treating worker results as a release gate. **Sources:** `lib/jobs.ts` functions `workerJob()` and `report()`; `app/api/worker/route.ts`; `worker/runner.mjs`.

The worker API uses a shared configured bearer secret. A accepted report supplies job ID, boolean result, output string and literal worker label `docker-isolated`. The report does not carry candidate digest, source digest, command/toolchain/image digest, assigned worker identity, execution attempt, fencing token or single-use report grant. The supplied label is a claim. No independent verification proves the named isolation boundary actually existed. Two workers can overwrite result state while the candidate remains awaiting review; the handler reads then replaces JSON rather than compare-and-setting an execution revision. This is especially important when later designs introduce real behavioral tests.

**Resolved design:** Create a separate durable execution assignment before handing off artifacts. Bind `{tenant, project, job, candidate_digest, source_digest, test_manifest_digest, image_digest, worker_principal, attempt, fence, authority_epoch, grant_epoch, expires_at}` to a narrow capability and execution ID. The report returns measured tool exit codes, manifest/result hashes, execution receipt and upload references. Broker validates identity, assignment freshness, digests, state and schema atomically; duplicate identical receipts are idempotent; conflicting receipts quarantine. A attestation authenticates the execution environment's claim but does not prove tests covered product behavior. Independent verification remains necessary for sensitive releases.

**Proof required:** Tampered digest, stale attempt/fence, wrong worker, replayed capability, copied report, unsupported image, canceled assignment, changed tests, concurrent conflicting completion and unavailable attestation root. No candidate can inherit evidence from a different artifact. Record this as implementation work under SEC-03, RUN-01 and QA-02.

### SI-03 — Snapshot apply can proceed with no external test result

**Priority:** P0 for future PR/deployment policy; current snapshot-only behavior must remain explicitly labeled. **Source:** `lib/jobs.ts` `decide()` apply guard; `architecture/STATUS.md`; `PRODUCTION-ARCHITECTURE/10-autonomous-development-and-healing.md`.

The current apply guard blocks explicit `externalTests.passed === false` but permits null/missing external tests. Passing static checks and bounded model review can therefore authorize a stored snapshot change. That is consistent only with the documented prototype integrity workflow; it does not satisfy the target release contract for behaviorally tested code.

**Resolved design:** Distinguish snapshot experimentation, repository delivery, staging deployment and production release in action policy. A snapshot-only change can use its stated low-risk policy. Repository/deployment actions evaluate mandatory evidence by risk and affected behavior. Required evidence cannot pass through null, unsupported, stale, partial or unrelated results. Review consensus cannot waive a hard test/security veto. Display missing evidence clearly instead of treating absence as success.

**Proof required:** For each action tier test missing/failed/expired/wrong-digest tests, partial scanner coverage, changed base revision and missing required reviewer role. A low-risk snapshot action must never silently become an external release permission.

### SI-04 — Active-job count is not atomic admission or financial reservation

**Priority:** P1 in the prototype; P0 before paid concurrent usage. **Source:** `lib/jobs.ts` `enqueue()`; `PRODUCTION-ARCHITECTURE/16-relational-schema-and-data-lifecycle.md`.

The current ten-job guard reads COUNT before insertion. Concurrent requests can all observe a permitted count and exceed it. The fixed attempts/context/patch budgets remain useful but do not establish a transactional organization-wide compute or currency ceiling.

**Resolved design:** Atomically acquire a quota slot and a maximum-cost reservation under the owning authority before accepting work. Split root budgets into conserved child allocations; never let recursive agent creation open a fresh unlimited balance. Explicitly reserve worst-case uncertain provider charges until reconciled. Fairness applies to tenant/project/provider/work class independently. Cancellation releases undispatched reservations and reconciles dispatched consumption rather than refunding blindly.

**Proof required:** Barrier-synchronized concurrent admissions; crash before/after reservation; duplicate admission key; canceled queued task; exhausted root budget; child allocation conservation; provider timeout with later usage receipt; retry without double reservation. No accepted task may lack reserved authority.

### SI-05 — Docker cleanup and image identity require stronger guarantees

**Priority:** P1 for a supervised trusted-maintenance runner; P0 before hostile multi-tenant execution. **Sources:** `worker/runner.mjs`, `worker/README.md`; production ADR-009 and security chapter.

The runner constrains commands, filesystem, network, user and resources; these are useful controls. It uses a mutable image tag with `--pull=never`; absence of pulling does not bind a particular preinstalled image digest. Output/time limits invoke `docker rm -f` as an unawaited child process. The source directory is removed in finally, but successful container destruction is not awaited or independently read back. No authoring-environment Docker run established actual isolation or cleanup. Rootless/daemon configuration, host patching and mount semantics remain unspecified operational inputs.

**Resolved design:** Pin verified image digest and toolchain manifest. Await supervised destruction, read back container/VM absence, preserve sanitized cleanup receipt, and quarantine a host with uncertain cleanup. Lease-scoped jobs cannot continue consuming resources after cancellation or report completion. Production hostile repository code moves to an independently reviewed microVM-equivalent boundary in separate account/network/node pools; ordinary hardened containers remain a declared trusted lower-risk profile. Never mount cloud/write credentials into job execution. Record host and runtime versions and define patch rollout/revocation.

**Proof required:** Timeout/output overflow, daemon crash, process spawn failure, signal interruption, delayed cleanup, escaped child process/resource pressure, stale worker, mutable-tag substitution and artifact poisoning. Host reuse is denied while cleanup is inconclusive.

### SI-06 — Placement consensus must fit residency and failure domains

**Priority:** P0 design clarification before global infrastructure. **Sources:** production chapters 01, 09 and 17.

The architecture correctly chooses single home writers and a consensus-backed placement authority. It leaves exact quorum geography and global-versus-regional ownership scope to implementation. A global quorum holding private membership/ownership records across prohibited jurisdictions could violate residency; a quorum with an effective single-region majority could prevent disaster promotion; cached routing cannot safely grant ownership.

**Resolved design:** Use a separate ownership authority domain per contracted residency boundary. Each domain owns routing epochs/write leases for its permitted cells and has an explicitly tested quorum placement. Global routing contains only reviewed minimal locator metadata or opaque tenant routing handles; it delegates ownership to the domain. A residency policy permitting only one region cannot claim regional-disaster promotion outside that region. Its contracted mode offers zone resilience and controlled outage/restore until a permitted DR location exists. Dedicated disconnected enterprise deployments run local authority and do not participate as another writable cloud master.

Consensus partitions never create a second authority. Old-home lease expiry plus bounded monotonic time/skew checks and explicit fencing governs promotion. Sixty-second lease, twenty-second renewal and five-second skew bounds are experiment targets from ADR clarification; they must be adjusted from measured infrastructure and target-adapter behavior. A stale region cannot dispatch new privileged operations through a cached epoch. Remote targets that cannot validate epochs require exclusive broker authority and a documented limit on already-dispatched effects; epoch fencing does not unsend a request already accepted by a cloud API.

**Proof required:** Partition every majority/minority shape; old region isolation; clock jump/skew beyond bound; delayed renewals; authority recovery from backup; conflicting migration; adapter unable to check epoch; delayed provider completion after promotion. Show state transitions and zero double-writer privileged dispatch. Report actual loss windows and unresolved remote operations.

### SI-07 — Reference SQL has service-level obligations that cannot be mistaken for database guarantees

**Priority:** P0 before schema implementation acceptance. **Source:** `PRODUCTION-ARCHITECTURE/contracts/core-schema.sql` and chapter 16.

The SQL deliberately does not implement a complete ledger posting procedure or project authorization model. Same-tenant foreign keys alone permit references between different projects/runs inside a tenant unless service checks reject them. Parent-agent/task checks prevent self-links but not longer cycles. Reservation currency equality, settled-versus-maximum policy, valid states and balanced immutable journal groups require further constraints/procedures. A schema-file validator is not a PostgreSQL integration test and does not prove RLS under real service roles.

**Resolved design:** Each owning service supplies complete migrations, restricted roles and cross-entity invariants. Validate same-project/run lineage where required; use transactional cycle/fence checks; constrain state transitions; implement currency-consistent reservations and immutable balanced posting. Cost above the reserved maximum becomes a reconciliation/debt incident governed by billing policy rather than silently violating a ceiling or discarding a real provider bill. Create migration/backfill roles separately and test their limited use. Keep the reference SQL labeled until real migrations run on the supported PostgreSQL version.

**Proof required:** Execute migrations from empty and prior schema; role/BYPASSRLS/owner checks; same-tenant wrong-project links; cycle race; invalid state; mismatched currency; duplicate receipt; immutable correction postings; group imbalance; transaction-local context leakage. The service review must identify exactly which invariants live in SQL and which in code.

### SI-08 — Recovery is a multi-store and external-effect workflow

**Priority:** P0 before any sold recovery objective. **Sources:** production chapters 09, 16, 18; DATA-03.

A restored PostgreSQL primary with stale object manifests, missing decryption keys, incorrect Temporal history or resurrected permissions is not successful recovery. Rebuilding graph/vector stores must not resurrect deleted or revoked sources. The present snapshot rollback is not database disaster recovery.

**Resolved design:** A versioned recovery manifest binds control-store checkpoint, object manifest, event archive offsets, compatible workflow code, schema/policy versions, key custody and tombstone ledger. Restore into a quarantined environment with dispatch disabled. Apply deletion/revocation records before making data queryable. Reconcile operation intents and receipts before enabling writes. Validate source availability and projection watermarks; serve only current authorized evidence. Zero-RPO means acknowledged durability under the exact replication topology, not a generic architecture phrase. Measure RTO through customer-visible service restoration, including security/ledger readiness.

**Proof required:** Corrupt/missing backups, inaccessible keys, incompatible workflow replay, deleted tenant resurrection, revoked connection, archive gap, committed-but-unacknowledged provider operation, old grant and missing source object. Restore from an independent clean account is required where the DR contract includes control-account compromise. Exercise both platform-owned and customer-managed-key recovery responsibilities.

### SI-09 — Capacity and observability thresholds need workload contracts

**Priority:** P1 before beta; P0 before scale/SLA promises. **Sources:** production chapters 01, 04, 09, 15 and 18.

The reference byte arithmetic is useful but not a performance measurement. One hundred cells do not automatically yield a million reliable interactive connections or twenty billion queryable edges. Multi-store fanout, monorepo skew, symbol churn, ACL filters, embedding generation coexistence and burst incident workloads need explicit capacity envelopes. A delta for a 100K-file repository is underspecified without changed-file/byte/language counts and toolchain mix.

**Resolved design:** Define named benchmark profiles with source bytes/file counts/change rate, entity/edge/vector counts, tenant-size distribution, ACL selectivity, query mix, hot-key share, subscription churn, event size and provider latency. Report p50/p95/p99, backlog age, cost, recall, failure and recovery. Use sustained queue growth and forecast exhaustion as split signals; thresholds are per measured resource, not one global utilization percentage. Reserve control/cancellation/incident capacity. During saturation throttle background ingestion/research before status/policy functions. Projection lag produces unknown/stale, not healthy.

Proposed initial operational experiment: warn when measured capacity headroom for loss of one zone is less than 30%; begin placement/split planning when a critical resource sustains more than 70% of its tested safe envelope for thirty minutes or projected growth exhausts headroom within thirty days. These starting values are hypotheses, not contractual guarantees. A stricter workload safety bound overrides them. Multi-window SLO burn alerts must separate user-visible API failures from provider waits and expose both where relevant. Cardinality quotas keep per-task IDs in traces, not global metric labels.

**Proof required:** Hot tenant consumes its quota without starving others; incident storm with provider outage; slow websocket consumers; graph-query fanout; vector rebuild double-storage; drain/migrate while jobs exist; costly repeated embedding refresh. Relate commercial included usage and overage limits to measured unit costs.

### SI-10 — Enterprise compliance and support are operating systems, not swarm names

**Priority:** P1 discovery/program work; P0 for any regulated customer contract. **Sources:** production security/operations chapters; LEGAL-01 and SEC-03.

Legal and compliance departments are catalog definitions. Hash chains, encryption and audit retention alone do not establish a compliance program. Applicable law, contracts, regulated data classes, subprocessors, source licenses and qualified review ownership depend on actual customers and deployments.

**Resolved design:** Maintain scoped control inventory, system/data inventory, processing purpose, owner, evidence cadence, exception expiry, contract/subprocessor mapping, incident obligations and independent review records. Customer support uses case-bound time-limited grants, stronger reauthentication, recorded reason and customer-visible access. E2EE support cannot promise server-side plaintext inspection. Account closure/export/deletion, billing disputes, abuse reporting, source rights, vulnerability disclosure and customer-owned disaster recovery need explicit journeys/runbooks. Retention defaults cannot override a legal hold or promise literal perpetual storage. No legal conclusion or certification is generated solely by an agent.

**Proof required:** Simulated support misuse, expired support grant, customer key revocation, retention hold conflict, deletion after export, incident notification exercise, subprocessor change, connector consent withdrawal and marketplace license mismatch. Qualified accountable humans determine applicable requirements and disposition.

## Contradictions resolved for the final blueprint

| Earlier tension | Authoritative resolution |
|---|---|
| Universal sign-in versus universal provider execution | One identity gateway can unify account UX; every provider/resource/inference grant remains separate, terms-compliant and explicitly supported. |
| Infinite swarm nesting versus finite cost and control | Definitions are extensible; runtime depth, fanout, time, grants, queue slots and currency remain bounded by ancestor policy/reservation. |
| E2EE versus central plaintext AI analysis | Server-blind customer-controlled processing and server-assisted confidential processing are distinct contracted modes with different capabilities. |
| All entities connected versus evidence truthfulness | Store unresolved/isolated entities with explicit coverage; never invent dependency edges merely to satisfy a visualization ideal. |
| Global memory forever versus lawful deletion/residency | Durable scoped retention, source rights, tombstones and restore-safe deletion supersede literal permanent retention. Global patterns require independent rights/privacy review. |
| Automated healing versus unrestricted emergency authority | Preauthorized narrow repair classes only; emergencies may increase investigation priority, never silently widen grants. Irreversible changes use explicit forward recovery and stronger approval. |
| At-least-once events versus exactly-once remote effects | Idempotent local consumers and durable remote operation reconciliation; no end-to-end exactly-once claim for arbitrary cloud/repository/payment APIs. |
| Global HA versus single writer and restricted residency | Residency-domain authority, fenced failover and contracted available destinations; pause uncertain writes and disclose tradeoffs. |
| Passing design checks versus production readiness | Documentation/contracts can pass now. Live consent, isolation, recovery, behavioral correctness, capacity and compliance evidence remain separate release gates. |
| Single mutable image tag versus evidence-bound builds | Immutable source/toolchain/image/test/artifact digests and receipts define reproducibility; local tags and worker labels do not. |

## Missing systems to add explicitly to the final build backlog

1. Execution assignment/evidence service with per-worker identity, single-use capability, immutable digests, fencing and quarantine.
2. Tenant/project authorization migration covering every API, export, cache, graph/vector result and historical memory.
3. Atomic concurrency/quota/currency admission service and conserved recursive child allocations.
4. Residency-domain ownership authority, quorum placement records, clock health and remote-effect fencing limits.
5. Supervised sandbox destruction, host quarantine and independent artifact scanner/provenance pipeline.
6. Complete PostgreSQL service migrations/roles/procedures and real database integration tests.
7. Multi-store recovery manifest, deletion/revocation replay, independent key recovery and external-operation reconciliation.
8. Workload/capacity registry, per-resource safe envelope and commercial usage guardrails.
9. Control evidence/compliance ownership, support-access workflow, vulnerability disclosure and abuse handling.
10. Deployment rings with database/event/workflow compatibility gates and controlled rollback/forward recovery.
11. Supply-chain publisher/image/template revocation distribution and affected-installation kill/quarantine.
12. Customer exit/export/migration journey that preserves provenance without leaking revoked sources or tokens.

Each addition is a child engineering task under existing SEC, QA, RUN, OPS, DATA, LEGAL and release items. An audit recommendation does not close the parent backlog item. Record owner, dependency, risk, exact completion evidence and target action tier for every implementation.

## Required staged evidence gates

**Private foundation:** Preserve owner-private audience, scoped secrets, honest snapshot-only action labels and baseline tests. Fix/report concurrency and evidence-binding weaknesses before broadening worker responsibilities. No production target changes arise from this design review.

**Authorized development beta:** Real provider-approved model request; real GitHub resource consent; actual isolated worker run; behavioral bug fixture fails before fix and passes after fix; reviewed exact-commit draft PR; timeout/replay/cancellation/revocation failures tested. Provider HTTP stubs remain labeled separately.

**Multi-user beta:** Identity and tenant/project enforcement across all stores; independent security review of material boundaries; access/deletion/export/recovery tests; applicable support/compliance program; transactional budget/ledger admission for paid execution.

**Staging operations:** Induced authorized target outage detected from fresh telemetry; evidence-based diagnosis; bounded repair; independent tests/review; staged deployment/read-back; health gates; successful rollback or documented forward recovery; unknown outcomes cannot retry blindly.

**Enterprise/global release:** Measured sold SLO/RPO/RTO tier; partition and stale-writer tests; compatible multi-store restores; residency and key custody proven; host isolation/cleanup verified; workload bounds and customer cost controls exercised. A global rollout is ringed; an error-budget or critical security breach stops expansion.

## Final reviewer decision

The selected cell-based architecture is coherent after the clarifications above. Its strongest choices are external policy authority, immutable evidence, scoped data, single writers, idempotent effects and bounded execution. Its main risk is treating detailed documentation and a built owner-private prototype as the production capabilities those documents describe. Advance implementation through the stated evidence gates; do not certify global scale, compliance, hostile-code isolation or autonomous production healing from this review.
