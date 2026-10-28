# Microservices, ownership and process boundaries

Services below are logical contracts. Deploy together where throughput and isolation allow; split process boundaries when independent scaling, residency, blast radius or operating ownership demands it. Each service owns its schema and migrations. Shared PostgreSQL infrastructure does not grant cross-service table access. Cross-service writes use APIs or committed events, not direct database mutation.

| Service | Authoritative responsibilities | Storage / contract |
|---|---|---|
| Identity & session | Human identity mapping, sessions, federation, device grants, MFA context | Regional PostgreSQL; OIDC/SAML/SCIM adapters |
| Organization & workspace | Membership, project ownership, environment classification, residency | PostgreSQL; workspace events |
| Tenant directory | Home cell, routing epoch, migration state, signed placement records | Strongly consistent routing database; locally cached signed reads |
| Policy & capability | RBAC/ABAC, action grants, approvals, delegation, revocation epoch | PostgreSQL policy revisions; decision API |
| Connections & vault | Provider registrations, scopes, account/resource mapping, token refresh | Encrypted handles; KMS/vault integration |
| Ingestion coordinator | Webhook validation, scan manifests, checkpoints, connector jobs | PostgreSQL and Kafka; immutable object references |
| Source intelligence | Parsers, dependency/data-flow/API/infrastructure extraction | Sandboxed analyzers; extraction artifacts |
| Graph writer | Canonical entity resolution, edge provenance, projection version | Neo4j partitions; source journal in objects/events |
| Graph query | Authorized bounded graph traversals and projections | Neo4j read replicas; policy-aware query planner |
| Memory | Typed assertions, decisions, provenance, scope, correction/retention | PostgreSQL metadata, objects, retrieval indexes |
| Semantic retrieval | Embeddings, hybrid retrieval, reranking, ACL filtering, citations | Qdrant and lexical index; versioned model registry |
| Omni Core planner | Task decomposition, specialist selection, conflict policy and progress | Durable workflow definitions; planner proposal artifacts |
| Workflow scheduler | Durable state machines, timers, retries, task queues and fairness | Temporal cluster with separate persistence schemas |
| Agent registry & runtime | Agent identities/templates, lineage, turns, health and evaluation | PostgreSQL agent/task aggregates; Redis presence |
| Model gateway | Supported account inference, routing, quotas, timeouts, usage receipts | Provider adapters; no generalized consumer-session scraping |
| Tool broker | Capability validation, target binding, side-effect receipts | PostgreSQL operation ledger; scoped connector executors |
| Sandbox control | Attested placement, images, CPU/GPU quotas, isolation and cleanup | Ephemeral execution pools; PostgreSQL durable manifests |
| Development delivery | Patch/commit baselines, CI evidence, reviewed branches/PRs | PostgreSQL change sets; object artifacts; repository adapters |
| Findings & gaps | Rules, triage, remediation hypotheses, coverage and deduplication | PostgreSQL findings; graph/rule evaluation artifacts |
| Security intelligence | Scanners, advisories, secrets, threat signals and supply-chain facts | Approved feeds; encrypted artifacts; scoped scanner jobs |
| Twin simulation | Twin manifests, scenario execution, calibration and impact intervals | Objects, compute workflows, timeseries/results metadata |
| Reliability & healing | Incidents, diagnosis, repair policy, rollout/health gates and learning | Incident aggregates and durable workflows |
| Future & innovation | Horizons, research, opportunity experiments and evaluations | Versioned hypotheses; evidence bundles |
| Scores & executive views | Methodology versions, coverage/confidence and score snapshots | PostgreSQL snapshots; analytical rollups |
| Realtime gateway | WebSocket subscriptions, resume cursors, presence, status fanout | Redis transient streams/cache; durable resume from event archive |
| Experience BFF | Client-specific view models, navigation and authorization-aware composition | Short-lived private caches; no source of truth |
| Marketplace & plugins | Signed releases, compatibility, installation policy, reviews, payouts | PostgreSQL registry; signed object artifacts |
| Metering & billing | Reservations, immutable usage, rate cards, ledger, invoices/reconciliation | Separate PostgreSQL financial schemas; analytical exports |
| Analytics | Product events, cohort/usage statistics, privacy-safe reporting | ClickHouse and object lake; curated cross-tenant aggregates |
| Observability | Operational metrics, logs, traces, alert routing and SLOs | VictoriaMetrics-compatible TSDB, object/log index, trace backend |
| Audit & evidence | Append-only security/operation/evaluation facts, legal hold, signatures | PostgreSQL pointers; WORM-capable object archive |
| Notification | In-app/device/email/provider notifications with explicit preferences | Delivery ledger, templates and message queues |

## Dependency discipline

A command request should synchronously cross at most gateway → owning service → policy/reservation, then commit and return an operation handle. Long inference, extraction, graph rebuild, rendering and scanning are asynchronous. Read composition uses bounded BFF fanout with deadlines and degraded per-panel states; never synchronously join every store.

Identity, policy, financial reservation and operation intent are required for sensitive writes. Graph, vector, scores and analytics can be unavailable without taking down the core task journal. If policy authority is unavailable, new privileged actions stop; running read-only jobs may use unexpired bounded capabilities where permitted. If billing reservation authority is unavailable, no new billable dispatch occurs; workers checkpoint existing reserved work.

Service schemas are defined under immutable versioned migration paths. Database credentials are service-specific and cannot own or bypass row-security policies. Privileged migration jobs are a separate identity. PostgreSQL transactions never pretend to commit Neo4j, Qdrant and a provider API atomically; committed outbox events drive projections and side effects.

## Ownership and SRE responsibilities

Identity/policy/vault and financial ledger require dedicated review ownership. Execution services own sandbox breakouts and job correctness. Intelligence services own provenance, coverage, retrieval leakage and graph freshness. Experience services own accessibility and consent UX. Platform SRE owns cell capacity, routing epochs, backups and recovery. Security signs releases with material permission/isolation changes. Billing owns reconciliation and corrections, never silently rewrites historical usage.

An incident has one operational commander, an evidence timeline and an explicit severity. Emergency agent creation does not grant break-glass rights; those require independently logged human authorization with scope and expiry.
