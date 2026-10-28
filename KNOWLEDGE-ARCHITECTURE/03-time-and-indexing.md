# Timeline intelligence, indexing and ingestion

## Bitemporal and scenario semantics

Every assertion has valid time (when the claim applies in its domain) and recorded time (when OmniDev knew it). Use half-open intervals [start,end) in UTC, retaining source timezone/precision where significant. A late incident report can change today's understanding of yesterday without rewriting what engineers knew yesterday. Transaction sequence and source revision order break timestamp ties; clock time alone does not provide distributed ordering.

Queries require valid_at, known_at, branch/environment and optional scenario_id. “Current” defaults to latest committed knowledge watermark and current valid time, returned explicitly. Historical queries must still use current access permissions: possession of a past grant is not a right to see revoked data now. Graph projections materialize current state for fast reads; archival bitemporal assertions reconstruct historical snapshots on isolated analytical workers. Projection lag is explicit.

Past and current states are observations or accepted claims. Future states are scenario branches, each with assumptions, parent baseline, forecast model/version, horizon, distributions or ranges where calibrated, uncertainty and evaluation dates. Year 1/3/5/10 are horizon labels, not guarantees. Version 1/2/3 are immutable release/snapshot references; planned versions are proposed scenarios until deployed evidence establishes a release. Never connect a forecast dependency as a confirmed present dependency.

A snapshot manifest pins source revisions, event sequence per partition, extractor generations, ontology version, graph/vector/lexical watermarks, ACL epoch and source coverage. It is a consistent cut where obtainable; if sources cannot be atomically captured, label bounded skew and affected domains. Cross-store reads wait for compatible watermarks for correctness-sensitive operations, or return partial coverage for exploratory reads. Timeline comparison computes added/removed/modified claims, decision changes, risk/test coverage and deployment/outcome differences. Renames use identity lineage rather than counting every move as deletion plus invention.

## Collection pipeline

1. Authorize connection scopes and register source ownership, residency and expected coverage.
2. Collect immutable source revisions or bounded incremental batches; preserve external cursors and webhook signatures.
3. Normalize identifiers and parse in isolated workers. Language AST/LSP/build metadata outranks regex guesses; unsupported syntax reports incomplete coverage.
4. Extract typed entities/assertions with evidence spans, context and method reliability. Link structural provenance for every admitted object.
5. Resolve identities conservatively; deduplicate by collector revision; quarantine illegal relation types and malformed intervals.
6. Append canonical batch and outbox atomically. Workers apply idempotent projections with per-batch receipts and fencing.
7. Publish searchable watermark after integrity/authorization checks. Never mark unseen files deleted from a partial failed scan.
8. Run gap rules and invalidate affected summaries/answers by dependency lineage. Incremental changes reparse affected reverse dependencies under a budget.

Connector sources include source control, cloud inventories, databases, issue/design/document systems, conversations, telemetry and creative tools. Each has its own limits and permission semantics. Source deletion and revoked scope invalidate retrieval even before slow physical cleanup finishes. Secrets are redacted or quarantined before embeddings. Encrypted server-blind sources use authorized customer-side extraction; central reasoning receives only explicitly disclosed claims. End-to-end encryption does not secretly permit central plaintext indexing.

## Index plan

| Index | Key or strategy | Purpose and caveat |
|---|---|---|
| Entity lookup | tenant/source namespace/external key, unique scoped identity map | Stable exact lookup; parser identity collisions reviewed |
| Assertion lookup | tenant, subject, predicate, context, recorded sequence | Materialize accepted/current views; never drop disputed evidence |
| Temporal index | GiST range indexes on valid and recorded ranges plus tenant-selective B-tree | Historical interval intersection; benchmark multicolumn strategy and partition pruning |
| Graph adjacency | partition + entity + predicate + direction; current and selected historical projections | Bounded traversal; expand high-degree hubs with pagination |
| Lexical | authorized chunks, symbols, exact identifiers, fielded BM25 | Code identifiers and exact errors; lexical matches are not proof |
| Vector | collection generation, tenant/project/source/ACL metadata, embedding and chunk versions | Tenant/resource prefilter plus authoritative recheck; quality measured by corpus |
| Decisions | scope/status/date, alternatives, selected option, outcome metric | Rationale and outcome retrieval with evidence |
| Timeline | snapshot/release/commit manifests and partition sequence offsets | Reproducible state comparison |
| Gap/ownership | subject/rule/version, coverage, owner, freshness | Find blind spots without treating missing authorization as missing documentation |
| Answer lineage | source assertion/evidence IDs → answer IDs and summaries | Invalidation on correction, deletion, expiry and ACL changes |

Neo4j constraints enforce selected uniqueness and property contracts supported by the pinned edition. Service validation enforces domain/range, provenance, temporal consistency and cross-node policies; database constraints are not a complete ontology validator. Use version-qualified entity projection keys so historical versions do not violate current-identity uniqueness. Qdrant filtering must use trusted policy-derived filters; metadata ACL alone is not an authentication system.

## Chunking and embedding generations

Chunk source code by symbol and logical block, documents by section with heading lineage, conversations by topic episodes with speaker/time, decisions by rationale/alternatives/outcomes, and 3D assets by manifest/scene metadata plus supported multimodal features. Preserve parent IDs and exact source spans. Never split away the negation or conditions of a security policy. Large binaries remain in object storage; retrieval uses manifests/previews and authorized tool inspection.

Chunk IDs include artifact digest, selector and chunker version. Embeddings are indexed by model digest/version, dimension, tokenizer, normalization, distance metric and language/domain evaluation. Store separate generations for incompatible models. Build shadow index, replay deltas, compare recall/latency/isolation and switch a routing generation after gates; do not mix dimensions or scores across incomparable spaces. Lexical retrieval remains available when embeddings fail, within identical policy and provenance boundaries.

Cold data retains journal/object history and compressed lexical metadata; restore historical vectors on demand where cost warrants. A tenant requesting historical semantic search gets an operation handle and coverage status if restoration is necessary. Retention and legal deletion always override cold restoration.
