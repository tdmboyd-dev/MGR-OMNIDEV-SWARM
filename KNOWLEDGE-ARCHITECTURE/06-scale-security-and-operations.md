# Scaling, security, resilience and production acceptance

## Billion-relationship scaling

Reuse the platform's 100 mature-cell planning model: 5 billion entity nodes and 20 billion relationship edges across cells, averaging 50 million nodes and 200 million edges per cell. These are capacity targets to qualify, not measured capabilities. Further partition a cell by organization/project groups and hot workload; giant tenants receive dedicated partitions. A graph partition is not automatically a complete cell or a database per small tenant.

Route by residency, tenant home cell, entity partition and generation. Keep common repository traversals local. Cross-project references use scoped edge stubs with directory-resolved remote endpoints; cross-cell federation is explicit, budgeted and permission checked at each destination. Interactive queries contact at most four partitions by default. Wider analysis becomes an asynchronous reserved job and returns a coverage manifest. Do not send a global traversal to every shard for every question.

Canonical identity metadata and assertion journal partition by tenant/project/time as volume dictates; small tenant partitions are grouped physically. Hot current views remain in indexed transactional/graph stores. Historical revisions and extracted batches live in columnar/object archives with manifest indexes. Avoid storing source bodies or complete logs on every graph edge. Estimates for 20 billion edges at 160 bytes raw are 3.2 TB before index/metadata/replication; real storage sizing must measure typed properties, temporal versions and history retention, which can dominate current-state data.

If 200 million current edges per cell each gain five retained revisions on average, the historical assertion representation may approach one billion edge revisions per cell. Do not apply the raw current-edge estimate to history. Budget archival bytes, object operations, rebuild CPU, vector generations and backup storage separately. Each retained forecast/answer also has lineage costs. Reserve compaction/rebuild headroom and backpressure collection before queues exhaust storage.

At 10 billion vectors, 1536 float32 dimensions alone occupy 61.44 TB before graph/index/payload/replicas. Quantization may reduce vector bytes but requires measured retrieval loss and library-specific overhead; never infer quality from compression ratio. Tier by access frequency and rights. Record per-tenant cost for extraction, parsing, embedding, indexes, retrieval, model tokens, archival restore and adjudication. Root query budgets include subqueries and agent recursion, so multiplying experts cannot escape cost ceilings.

High-degree package/platform hubs use typed fanout pages, scoped materialized summaries and async dependency closure. Cache generation-keyed authorized adjacency rather than entire tenant graphs. Do not precompute all-pairs transitive closure. Incremental invalidation batches descendants and labels stale derived results during bounded recomputation; effect gates require fresh underlying evidence.

## Consistency and recovery

Home-cell journal append plus outbox is atomic; projection consumers deduplicate batch IDs and store watermark receipts. Partial graph batch writes are staged under a generation and made visible only after batch integrity commits; failed staging is replayable. Do not report projection completeness from a queue acknowledgment alone. Compaction preserves canonical version lineage, not only the latest projection.

Rebuild into new graph/vector/lexical generations from signed snapshots and journal deltas. Verify entity/edge counts by type, sampled evidence digests, temporal invariants, no dangling accepted endpoints, tenant filters and representative query equivalence. Swap generation routing atomically per scope with rollback. A vector rebuild cannot silently alter identity or source truth. Failed projection retrieval degrades to allowed source/lexical reads with explicit missing semantic/graph coverage; no broader tenant or global fallback.

Regional failover obeys the production single-writer home-epoch protocol. Journal restore cannot independently claim writer ownership; the placement authority fences the old writer. Reconciliation includes in-flight batches and source cursors. Standard regional RPO/RTO remain design targets from the production package, not new zero-loss guarantees. Restore rehearsals test revoked grants/tombstones before reopening answers.

## Authorization, confidentiality and abuse

Enforce tenant, project, branch/environment, classification, purpose and current principal grants before candidate search, before graph expansion and before evidence/context construction. Intersections apply to derivations: a summary containing confidential evidence inherits restrictions from all disclosed inputs. Redaction requires an approved transformation and new policy-reviewed artifact, not automatically a less restrictive classification. Denied content must not reach the model first and be removed afterward.

Store original sensitive artifacts with tenant keys and separated service identities. Encrypt in transit and at rest; end-to-end server-blind workspaces retain customer-controlled plaintext execution. Index secret detection results as redacted findings, not credential values. Conversation/person/customer records have purpose limitation, minimum content and retention. Security access to a document does not imply consent to globally publish its lessons.

Prevent graph inference leakage through counts, topology, ranking, errors and cached summaries. Adversarial tests compare denied object presence/absence, invalid edge endpoints, stale ACL versions, timing and pagination cursor reuse. Rate limits are weighted by traversal fanout/reranking/context/archival restore; expensive authorized queries can still be abusive. Query plan limits apply before execution. Cursor tokens bind tenant/principal/time/query hash/generation and expiry.

## Observability and evaluation

Measure ingestion lag and coverage, parser success by language, identity-resolution ambiguity, assertion dispute/retraction, projection lag, ACL rejection, stale-answer invalidation, retrieval recall, evidence-support precision, answer abstention, cost and latency by approved dimensions. Avoid entity IDs in unbounded metric labels; trace details reside in restricted logs. Observe global aggregate metrics without copying private knowledge to a global data lake.

Maintain an authorized benchmark corpus with seeded truth: multi-language repositories, rename/refactor histories, dynamic dependencies, runtime incidents, late decisions, meetings with ambiguous speakers, deleted sources, contradictory documents and forecast outcomes. Synthetic fixtures supplement but do not replace real authorized project evaluation. Split by project and time to prevent memorized answers and future leakage. Models/datasets/licenses remain separate procurement/research decisions; this design does not pretend a selected production model is validated.

| Gate | Executed proof required before production |
|---|---|
| Ontology and identity | All requested types map; invalid relation domain/range rejected; ambiguous rename remains unresolved |
| Memory scope | All eight layers survive restart; promotion never broadens permissions implicitly; sources invalidate summaries |
| Temporal correctness | Late observation and historical-known-time query differ correctly; scenario never contaminates present |
| Decision fidelity | Accepted decision retains alternatives and expected/actual outcomes across supersession |
| Retrieval | Target recall on corpus, precise citations, complete policy filtering, temporal/context correctness |
| Reasoning | Known dependency closure, honest dynamic uncertainty, reproducible root-cause tests, no fabricated causal claim |
| Gaps | Partial scan cannot assert absence; inaccessible records do not cause misleading visible gap claims |
| Security | Cross-tenant/ACL/timing/prompt-injection/deletion/cache adversarial suites; model context leak checks |
| Durability | Restore journal and projections with revoked data excluded; replay idempotency; partition/fencing failures |
| Scale and cost | Reference mixed workload at target partition size, hot hubs, rebuild load and measured resource ceilings |
| Forecast and innovation | Time-held-out forecast evaluation, uncertainty calibration, hypothesis labels and outcome tracking |

Initial proposed quality thresholds: citation-support precision ≥98%, forbidden-content disclosure zero in release corpus, entity resolution precision ≥99.5% with explicit unresolved recall, retrieval recall@50 ≥90% for answerable benchmark cases, correct abstention ≥95% on intentionally unanswerable questions. These are release targets to validate and refine by risk/domain, not achieved scores. Sampling confidence intervals, difficult slice results and false-positive/false-negative costs accompany aggregate metrics. One passing aggregate cannot hide a failing tenant-isolation or security slice.

## Migration from current app

First preserve snapshot analyzer outputs as legacy heuristic observations, not upgraded facts. Add pinned evidence selectors and coverage manifests. Introduce canonical identity and assertion admission behind existing read contracts. Populate ontology/current projection for supported parsers. Move memory into eight scoped layers with versioned decision records. Add temporal manifests, hybrid retrieval and cited answer contract. Only then enable rule-derived facts, independent diagnostics and bounded simulations. Global pattern publication and organizational-risk scoring require separate privacy/rights and calibration gates.

Run shadow queries against old and new views, compare user-visible findings and demonstrate why differences occur. Keep existing incomplete connectors labeled until live scope and extraction pass. The unfinished-work register remains the implementation authority; this package supplies specifications and acceptance tests without closing those tasks.
