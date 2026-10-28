# Multi-project Integration Engineer and worker fleet

Date: 2026-10-09. Implemented current scope: 2-8 original projects per batch, up to 320 supplied source files / 2.5 MB combined source; model-specific context budgets still apply. Larger integrations require staged batches. There is no claim of global uniqueness, perfect compatibility or full external execution.

## Implemented
- Select multiple imported projects and a shared objective in Development. Persistent plans retain immutable snapshot digests, explicit source namespaces, observed JSON OpenAPI operations, dependency version-string differences and source evidence.
- Plans identify API adapters, event synchronization and shared-package alternatives. Identity, data ownership, mapping, contracts, timeouts, retries, idempotency and rollback remain explicit integration requirements.
- The assigned Integration Engineering brain receives source snapshots and the evidence map to propose real bounded changes, contract artifacts and tests. Joint candidates split into separately staged original-project candidates; stale originals, foreign paths, failed checks and negative specialist reviews are rejected. Repeated staging reuses child job IDs. Separate review/apply/draft-PR steps preserve repository ownership; there is no fake atomic cross-repository deployment.
- The intelligence graph connects all participating projects to their shared integration workspace.
- Worker pool supports 1-10 concurrent isolated jobs per sufficiently provisioned host. CPU/memory admission applies backpressure. Active execution assignments cannot be overwritten by another worker. Unverified cleanup quarantines the process. Doctor diagnostics and an offline application-cache image recipe are included.

## Executed evidence
`evidence/integration-fleet.txt`: 15 SQLite and concurrent scheduler checks, including three-project mapping, patch splitting, replay, unchanged originals, stale-source rejection, 40-job scheduling and duplicate execution claim rejection. Live container tests are not included.
`evidence/worker-host-diagnostic.json`: no Docker daemon installed here. Actual UID-map diagnostic: `unshare --user --map-root-user true` fails with Operation not permitted. This is a host permission gate, not a missing specialist agent.

## Open work that cannot be certified from this environment
- Provision or attach an owner-approved container host and its private Site service access; install/qualify Docker Engine there. No computer/server is selected for this task and this workspace cannot host a privileged/rootless daemon.
- Run representative real application workloads against pinned approved images and offline dependency caches. Benchmark latency, failure rates and resource use before advertising throughput.
- Qualify actual multi-service network topology, database fixtures, identity providers, contract compatibility and rollback against selected real projects. The present worker profile runs each supplied application bundle independently; it does not certify their deployed interoperability.
- Extend contract extraction beyond JSON OpenAPI to YAML, GraphQL, gRPC, AsyncAPI and runtime traces; currently unsupported formats remain unknown, not inferred as absent functionality.
- Extend large-repository repair planning beyond model context/source budgets with dependency-aware slices. Full traversal is separate from unbounded model ingestion.

## Sources and decisions
Docker Engine: https://docs.docker.com/engine/install/ (open source engine; dedicated hardware still needed).
Rootless requirements: https://docs.docker.com/engine/security/rootless/ .
Resource constraints: https://docs.docker.com/engine/containers/resource_constraints/ .
Docker Desktop eligibility: https://docs.docker.com/subscription-billing/desktop-license/ .
OpenAPI contract basis: https://spec.openapis.org/oas/v3.1.0.html .
Disposition: ADOPT the existing Docker engine; MGR-NATIVE integration mapping, candidate splitting, evidence contracts and host-aware scheduling. Rebuilding a container kernel would add risk without solving the unavailable-host constraint.
