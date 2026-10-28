# Database, graph, memory and vector architecture

## Store ownership

| Store | Role | Authority / consistency |
|---|---|---|
| PostgreSQL | Tenants, workspaces, projects, agents/tasks, policies, approvals, connections, financial ledgers, artifact manifests | Transactional authority per home cell; service-owned schemas |
| Neo4j | Typed project/system relationships and traversals | Versioned materialized graph; rebuildable from extraction/source journal |
| Redis | Presence, session/realtime cache, local throttling and short-lived coordination hints | Ephemeral; no financial balance, durable task or permission authority |
| Object storage | Immutable source snapshots, artifacts, assets, documents, 3D scenes, event archives and backups | Content-addressed versioned manifests; tenant encryption and retention |
| Qdrant | Dense/sparse semantic retrieval | Derived versioned index; service-enforced tenant/resource filters |
| Time-series database | Metrics, workload signals, simulation telemetry | Operational telemetry; explicit retention/downsampling |
| ClickHouse | Product/usage/security analytical rollups | Derived, late-arrival-tolerant analytical projection |
| Lexical search index | Exact code/symbol/doc search and BM25 candidates | Derived; identical ACL/version constraints to semantic search |

All private records include tenant, project/resource scope, classification, residency, source version and provenance. Independent stores maintain a projection watermark. A query can return stale-but-labeled data for permitted read use; release decisions require a matching approved source and evidence watermark. Store failure never authorizes a broader fallback search.

## Knowledge graph model

Canonical node fields: `entity_id`, `tenant_id`, `project_id`, `kind`, `source_system`, `external_id`, `source_revision`, `content_digest`, `valid_from`, `valid_to`, `observed_at`, `classification`, `acl_version`, `extractor_version`, `confidence`, `artifact_ref` and small query properties. IDs are stable within tenant/source; paths/names are attributes, not global identities. Function identity accounts for language-qualified signature and file lineage. A rename creates a lineage relation rather than claiming unchanged identity without evidence.

Node types cover Organization, Workspace, Project, Repository, Commit, File, Package, Function, Method, Class, APIEndpoint, Service, Deployment, InfrastructureResource, Database, Schema, Table, Column, User, Conversation, Message, Ticket, Decision, Requirement, Test, Finding, Agent, Swarm, Run, Artifact, Asset, Model3D, DesignFile, UserFlow, BusinessObjective, CostCenter, RevenueStream and Experiment.

Edge types include `CONTAINS`, `DEFINES`, `CALLS`, `IMPORTS`, `DEPENDS_ON`, `READS`, `WRITES`, `EXPOSES`, `DEPLOYS_TO`, `IMPLEMENTS`, `TESTS`, `OWNED_BY`, `AUTHORIZES`, `MENTIONS`, `DECIDED_BY`, `DERIVED_FROM`, `SUPERSEDES`, `AFFECTS`, `FUNDS`, `GENERATES_REVENUE`, `OBSERVED_IN`, `SIMULATES` and `CONTRADICTS`. Each relationship has its own evidence digest, confidence, temporal validity, source and ACL. An edge cannot reveal a forbidden endpoint or infer one through counts.

Evidence establishes connectivity. An unresolved import/unknown service is a typed unresolved node, not an invented confirmed relationship. A project may contain isolated entities until discovery proves connections; “everything connected” is an integration objective, not permission to fabricate edges.

## Graph partitioning and queries

Partition by residency → cell → organization/project group. Co-locate most repository/package/service relationships. Use a graph partition directory for cross-project links, resolving remote edges through bounded federation. Dedicated large-tenant partitions avoid a database per tiny tenant. A cell has multiple graph databases/partitions and read replicas; route hot projects separately. No design assumes 20 billion edges in one Neo4j instance.

Neo4j composite/federated facilities may assist in-region composition where the chosen edition and deployment support them. Enterprise and hosted availability must be verified before procurement; the architecture also supports application-level federation. [Neo4j composite concepts](https://neo4j.com/docs/operations-manual/current/scalability/composite-databases/concepts/).

Public API accepts typed graph-query operations, never arbitrary untrusted Cypher. Default traversal: depth ≤4, node limit 1,000, edge limit 5,000, 2-second execution deadline; privileged analytical jobs receive separate resource reservations. Pagination uses snapshot/partition cursors. Algorithms such as dependency-centrality run asynchronously on scoped projections, not on interactive query threads. Cross-cell queries return partial coverage explicitly when a permitted shard is unavailable.

Ingestion writes extraction batches identified by `{source revision, extractor digest}`. The graph writer deduplicates by operation ID, applies a versioned batch, marks projection watermark and emits completion. Deleted source produces tombstones; authorized rebuild replays the journal into a new projection and swaps the directory only after validation.

## Memory layers

| Layer | Scope / representation | Lifetime / promotion |
|---|---|---|
| Short-term / working | Turn scratch and compact session context; Redis/object checkpoints | TTL hours; promote only reviewed useful facts |
| Swarm | Shared run hypotheses, reviews and task context | Run retention; authority no broader than participants' project grants |
| Project | Versioned architecture, bug/debt/feature/deployment history | Tenant retention; source-linked corrections |
| Company | Organization decisions, patterns and objectives | Org-authorized access; no implicit access across teams |
| Global intelligence | Public patterns and explicitly consented privacy-reviewed aggregates | Separate corpus; never raw private cross-tenant memory |
| Innovation | Opportunities, novelty research, experiments and outcomes | Versioned hypothesis/validation state |
| Research | Sources, methods, observations and competing conclusions | Source freshness and retention policy |
| Decision | ADR, rationale, approver, alternatives and later reversal | Append-only versions; supersession rather than silent rewriting |

A memory assertion is `{claim, type=fact|hypothesis|decision|observation, evidence_refs, scope, confidence, valid_time, owner, revision}`. Model summaries retain citations and may not replace the original evidence. Contradictions create linked assertions and review tasks. Retrieval marks stale, disputed, superseded and source-deleted facts. “Indefinite memory” means durable preservation when lawful and contracted; user deletion, legal retention and encryption-key revocation still apply.

## Vector and retrieval design

Embedding IDs bind tenant, resource, revision, chunk locator, content digest, embedding-model digest and index generation. Chunk by syntax/document structure; preserve file/line or document locators and source permissions. Images/3D assets have modality-specific embeddings and original-object references. Do not mix incompatible embedding dimensions/model generations in a query.

Qdrant collections are per cell/modality/model generation; small tenants share payload-filtered partitions, large/dedicated tenants receive dedicated shards/collections. The retrieval service injects mandatory tenant and authorized resource filters before nearest-neighbor search. Recheck returned citations against current policy/revocation and source version; filtering after unrestricted retrieval alone is insufficient. [Qdrant multitenancy](https://qdrant.tech/documentation/manage-data/multitenancy/).

Pipeline: authorized candidates → lexical/dense hybrid retrieval → graph expansion within limits → rerank → coverage/diversity check → cited context bundle. Query cache key includes tenant, principal/grant digest, ACL epoch, source/index generation, embedding digest and query. An index miss is not evidence of absence. Embedding refresh uses blue/green generations, held-out recall tests, cost reservation and reversible directory switch. Deletion invalidates reads immediately at policy layer and schedules physical index/object deletion; backup expiry is tracked separately.
