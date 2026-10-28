# Contracts, scaling and implementation sequence

## APIs and events
REST resources: /evolution/candidates, /genomes, /experiments, /discoveries, /scenarios, /releases and /scores. POST uses an idempotency key; writes use expected_version. GET applies current tenant and object permissions, including historical versions. Long-running commands return a workflow ID. Event envelope: event_id, tenant_id, cell_id, entity_id, entity_version, event_type, occurred_at, schema_version, trace_id, causation_id, payload_hash and source pointer. Consumers deduplicate event_id and reject stale fencing epochs.

Use events evidence.accepted, candidate.proposed, evaluation.completed, release.canary_started, release.promoted, release.rolled_back, discovery.withdrawn and ontology.generation_ready. Delivery is at least once; state transitions and transactional outbox provide effective idempotence. Dead letters remain scoped and inspected. WebSocket/SSE dashboards expose filtered status, spend, confidence, lineage and emergency controls, never private model reasoning.

## Storage reference
Authoritative tables: evolution_candidates(tenant,id,version,state,baseline_hash,candidate_hash,policy_version,budget,owner); genome_versions(tenant,id,version,hash,manifest_uri); evaluations(tenant,id,candidate_id,dataset_hash,evaluator_hash,metrics_uri,signature); releases(tenant,id,scope,genome_hash,previous_release,state,fence); experiments(tenant,id,plan_hash,assignment_uri,state); observations(tenant,id,source_uri,rights,classification,outcome); derivations(tenant,parent,child); withdrawals(tenant,id,source_id,status); evolution_metrics(tenant,dimension,cohort,interval,raw,coverage). Composite tenant keys and row-level policy are mandatory; object access is enforced separately. Large artifacts are immutable object blobs with content hashes.

## Scale and reliability
Partition by tenant/home cell and bounded project shard. Schedule millions of logical agents as inactive manifests; only leased tasks consume workers. Fair queues impose per-tenant model, sandbox, research and storage limits. Deduplicate experiment inputs; cache only within allowed scope and revision. Batch offline evaluations, prioritize security withdrawals and reserve incident capacity. Hierarchical aggregation avoids a global all-agent conversation.

Target capacity inherits the production architecture; it is not achieved by this specification. Benchmark ingestion, evaluation throughput, derived-index lag, release-controller latency and withdrawal convergence. Set measured SLOs per class before broad launch. Metrics include queue age, evaluator disagreement, rollback rate, harm rate, cost per validated improvement and stale applicability. Compare costs to benefit before spawning new capacity.

## Implementation gates
1. Evidence foundation: provenance, rights, versioned outcomes, deletion traversal, fixed baselines; prove cross-tenant denial and deterministic replay.
2. Offline evolution: prompt/workflow candidates and independent evaluation with signed artifacts; prove tampering rejection, contamination isolation and failed-candidate retention.
3. Authorized canaries: narrow release scopes, quotas, last-known-good rollback and stop controls; prove stale-lease denial, side-effect compensation and outage recovery.
4. Collective learning: consented libraries and context-specific trait transfer; prove withdrawal propagation and no trust/credential cloning.
5. Research/invention/futures: reproducible dossiers, scenario manifests and resolution scoring; prove synthetic/observed separation and spend enforcement.
6. Adaptive organization: shadow routing, topology simulation and controlled migration; prove ownership coverage, no access expansion and rollback.
7. Long-term stewardship: export, compatibility migrations, restore drills and governance succession; prove recovery and lawful retention behavior.

The accompanying reference guard tests validate design invariants using fixtures. They do not implement provider execution, independent evaluation services, microVM isolation or production self-healing. Track those in the existing UNFINISHED-WORK folder; architecture completion does not close them. Prompt 8 remains reserved for the user's next specification.
