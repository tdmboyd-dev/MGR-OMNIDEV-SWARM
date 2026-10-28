# Relational database design and data lifecycle

## Key and transaction conventions

Use application-generated UUIDs for entity IDs and exact numeric financial quantities. Tenant-local primary keys include `tenant_id`; resource references carry tenant plus entity ID. IDs are opaque, not authorization. Entities include created/updated timestamps, optimistic revision, classification and residency where relevant. Home-cell authority epoch and source/artifact hashes bind workflows and external operations.

Partition high-volume task/events/usage/audit tables by time with tenant-aware indexes and retention automation. Placement directory and service-owned shard maps distribute organizations/projects across PostgreSQL clusters. Dedicated enterprise tenants may move to isolated clusters. A project does not scatter transactional writes across shards for one command. Financial reservations within a root run/org budget use one authoritative shard/transaction; allocation across cells uses explicitly reserved sub-budgets, not concurrent writable balance replicas.

Use transaction-local tenant context, RLS and service role grants. Index common reads by tenant/project/status/time and prohibit unbounded scans. Cursor queries use deterministic time/ID keys. Cross-service IDs are validated by owning APIs rather than arbitrary joins; local relational constraints guard same-tenant relationships. Limit JSON to versioned extension/plan metadata, not a universal unindexed entity dump.

## Logical service schemas

| Owner / tables | Essential columns and constraints |
|---|---|
| Identity: principals, external_identities, sessions, devices | Tenant/principal, provider issuer+subject uniqueness, session digest/expiry/revocation, assurance and device binding; no plaintext tokens |
| Workspace: organizations, memberships, workspaces, projects, environments | Tenant keys, principal/role grants, project-home routing, environment risk/residency; revisioned ownership |
| Connections: provider_registrations, connections, connection_resources, refresh_leases | Provider/application digests, encrypted vault handle, grant epoch/scopes, selected resource identity, refresh fence/expiry |
| Policy: policy_revisions, grants, approvals, revocations | Immutable policy digest, action/targets, input digest, subject, approver, expiry, grant epoch; no self-approved mandatory review |
| Orchestration: swarms, agents, runs, tasks, attempts, checkpoints, messages | Parent/root lineage, template/model policy, state/revision, lease/fence, budget/deadline, input/output refs, scoped typed messages |
| Source: repositories, snapshots, ingestion_jobs, extraction_manifests | Connection resource, immutable commit/tree, source coverage, parser digest, cursor and input/output hashes |
| Graph directory: entity_registry, graph_partitions, cross_partition_edges, projection_watermarks | Stable source IDs, partition/ownership epoch, remote-reference ACL, schema/generation/watermark |
| Memory: assertions, decisions, evidence_links, memory_scopes, corrections | Claim type, provenance, confidence, valid/observed time, retention, supersession and source deletion |
| Retrieval: chunk_manifests, embedding_generations, retrieval_evaluations | Source locator/hash/ACL revision, model/dimension/index generation, status and recall-quality evidence |
| Delivery: change_sets, reviews, repository_handoffs, operations, deployments | Base/artifact/evidence digests, required roles, target/idempotency key, dispatch/receipt/reconciliation, rollback compatibility |
| Findings: findings, finding_occurrences, dispositions, control_evidence | Rule/subject/evidence fingerprint, severity/confidence, lifecycle, signed reviewer and fixed verification |
| Reliability: incidents, diagnoses, repair_plans, health_gates, outcomes | Target, SLO timeline, candidate causes, blast radius, authority, metric baseline and outcome classification |
| Simulation: twins, scenarios, simulation_runs, calibrations | Source/config/data/workload digests, fidelity/coverage, seed/budget, measurements and predictive error |
| Research/business: sources, hypotheses, opportunities, experiments, forecasts | Source rights/freshness, assumptions, horizon, alternatives, metrics/results, confidence and validation |
| Scores: methodologies, score_snapshots, score_evidence | Versioned weights/coverage, source/time window, values/nulls, critical flags and evidence refs |
| Marketplace: publishers, plugins, releases, installations, evaluations, revocations | Signed immutable digests, capability schema, compatibility, tenant install consent and payout identity handles |
| Financial: budgets, reservations, usage_receipts, rate_cards, journal_groups, ledger_entries, invoices | Exact currency units; reservation/root uniqueness, provider receipt dedup, immutable rate version, balanced postings and adjustment lineage |
| Audit: audit_events, evidence_batches, retention_holds, deletion_jobs | Principal/action/target, digest/sequence, signed archive ref, legal scope, purge/rebuild checkpoints |
| Events: outbox, consumer_inbox | Commit-linked event ID/type/version; publisher retry lease; consumer/event uniqueness and processed watermark |

The reference SQL in `contracts/core-schema.sql` defines the core control entities, leasing, operation idempotency, reservations, receipts, outbox/inbox and RLS. It is a design artifact, not a migration already applied to the current SQLite/D1 application. Every service adds its domain schema from the table contracts above during implementation with versioned tests and scoped database grants.

## Isolation and concurrency

Run creation transaction validates project membership/policy, locks relevant budget, reserves maximum, inserts immutable input manifest/run and outbox fact. Task claim atomically increments fencing token and attempt under lease preconditions. Completion checks state, authority epoch, fence and input digest; output/artifact validation is separate from dispatch authorization. Active-job limits use a locked quota/reservation aggregate, not an unprotected COUNT query.

Repository/deployment intent records operation ID and target/payload hash before external dispatch. Unknown outcomes enter reconciliation. Provider receipt uniqueness plus effect intent protects against retries; database transactions cannot roll back a remote provider after commit. Stale approvals, source revisions and lease reports cannot overwrite newer state.

Tenant RLS does not replace fine-grained project/action policy. Tenant context is set only by trusted server code after membership authentication; end users cannot open SQL sessions. Privileged maintenance roles are separate, audited and not exposed to normal services. Backup/CDC/publication roles are reviewed for data leakage.

## Retention and deletion

Source/artifact objects are immutable by content identity within authorized tenant scope; dedup does not leak equality across private tenants. Use encryption-key scope and content manifests to track physical copies. Legal holds and contract retention apply to selected evidence, not a blanket promise of forever. Session scratch has TTL, project history retention is configurable, billing/audit follows reviewed statutory/contract requirements.

Deletion workflow: freeze new ingestion → revoke access/grants → invalidate query policy/cache immediately → tombstone entity/edge/memory/chunk references → delete derived stores/objects according to holds → record backup expiry/key destruction → replay tombstone ledger during restore → verify completion. A tombstone without physical cleanup is not a completed deletion. Analytics/global-pattern pipeline uses consent and deletion lineage; aggregate retention requires a documented privacy/legal basis.

## Schema and model evolution

Expand/contract relational schemas and version event/artifact/graph/embedding contracts independently. Source extractors write a new generation; validate counts, sampled edges and coverage before promoting. Event consumers dual-read versions during migration. Graph/vector rebuilds do not reset disposition history or authorization. Backfill jobs have quotas, checkpoints, cost reservations and cancel/restart safety.

Cell migration snapshots metadata/journal, replicates objects, rebuilds projections, compares manifests, pauses/fences old writes, switches signed directory epoch and verifies operations/ledgers. Financial balances and grants move under explicit ownership fencing. Rollback to old placement is allowed only when no unreplicated effects would be overwritten.
