# Events, messaging, streaming and workflow execution

## Separate communication classes

| Class | Transport | Durability / purpose |
|---|---|---|
| Aggregate business facts | Kafka-compatible regional event bus | Replayable committed facts; per-aggregate ordering |
| Durable task routing | Temporal task queues | Activity/workflow dispatch, retries, timers and recovery |
| Low-latency request/response | Internal gRPC over authenticated transport | Bounded command/query service calls |
| Interactive agent/status updates | WebSockets and SSE through regional gateway | Resume from durable journal; transient token/status fanout |
| Presence / short-lived collaboration | Redis pub/sub or transient streams | Loss tolerable; not task completion or permission authority |
| Telemetry | OpenTelemetry collectors and telemetry pipelines | Sampling/retention independent of business journal |
| Large artifacts | Object storage references | Signed digests; no large code blobs in messages |

Kafka is the reference event bus. Initial topic partitions are capacity-tested, not a partition per tenant: partition key is `{tenant_id, aggregate_id}`. Isolation policies control producers/consumers; application handlers revalidate scope. Dedicated enterprise cells may isolate topics physically. Incident events have a bounded separate lane so scan bursts do not delay repair control.

## Canonical envelope

Required fields: `event_id`, `type`, `schema_version`, `tenant_id`, `project_id`, `aggregate_id`, `aggregate_version`, `authority_epoch`, `occurred_at`, `recorded_at`, `producer`, `actor`, `correlation_id`, `causation_id`, `classification`, `residency`, `payload_ref` or bounded `payload`, and `trace_context`. Envelopes must contain no access tokens, credentials or raw sensitive source. A supplied tenant context is authenticated against producer scope; messages are never trusted merely because they are on a bus.

Topic families: `identity`, `workspace`, `connection`, `ingestion`, `graph`, `memory`, `agent`, `task`, `operation`, `artifact`, `finding`, `incident`, `deployment`, `twin`, `research`, `score`, `usage`, `billing`, `marketplace`. Types are past-tense facts such as `task.admitted.v1`, `operation.dispatched.v1`, `deployment.health_failed.v1`. A requested action is a command to its owner, not an already-completed event.

Default payload limit 64 KB; large content is in immutable objects with hash and authorized retrieval. Schema compatibility is checked in CI. Additive optional fields are allowed within a version; semantic changes create a new type/version and dual-read migration. Consumers reject unsupported schemas into quarantine rather than guessing meanings.

## Transactional outbox and consumer inbox

Owning service commits aggregate revision and outbox row in one PostgreSQL transaction. Outbox publisher may emit twice. Consumer records `{consumer, event_id}` and its local mutation in the same transaction, then acknowledges. Aggregate version and authority epoch detect stale/out-of-order effects. Consumers buffer bounded gaps or request replay; they do not invent missing predecessor state.

Design guarantees at-least-once delivery plus idempotent application effects. Kafka idempotent/transactional operations help within the broker pipeline, but do not make a GitHub PR, cloud change or payment exactly once. [Kafka design](https://kafka.apache.org/41/design/design/). Each external effect uses the operation ledger and provider reconciliation described in the API and deployment chapters.

Dead-letter/quarantine records preserve event ID, sanitized failure, consumer version and retry state. Replay requires an authorized operator, dry-run scope and idempotency safeguards; replay of observational events cannot automatically replay production side effects. Business events retain 7-day hot journal by default, with archive and topic-specific contracts; financial/audit retention is separately governed. Retention is not a substitute for backups.

## Durable workflow semantics

A task is admitted once, then receives attempts. Retries keep the root objective, input revision, capability scope and budget. Retryable errors include bounded network/timeouts and provider cooldowns. Invalid permissions, malformed artifacts and exhausted budgets are not retryable. A side-effect timeout enters `reconciling`, not immediate blind retry.

Workflow nodes have states `pending`, `ready`, `admitted`, `running`, `waiting_input`, `waiting_approval`, `reconciling`, `completed`, `failed`, `canceled`, `compensating`. Root cancellation stops new dispatch, signals descendants, revokes grants, records dispatched operations and performs policy-approved compensation. Successful repository/production writes cannot be canceled by deleting the job record.

Parent completion policy declares required children, optional research and tolerated failures. Compensation is explicit: delete an unused branch only if owned and unchanged; roll back deployment only to a verified compatible version; database reversal is not assumed possible. New workflow generations carry lineage and remaining long-term quota. Continue-As-New/checkpoint policies prevent unbounded histories while preserving searchable events/artifacts.

## Realtime delivery

Subscriptions bind tenant, project, allowed event types and principal. Reauthorize periodically and immediately on sensitive permission changes. Each stream uses a cursor `{cell, aggregate, event_sequence}` and a resume token scoped to the subscriber. Clients deduplicate IDs and reconcile optimistic updates against authoritative revisions. Slow consumers receive a bounded buffer, `resync_required` and a snapshot URL; no infinite server buffer.

Tokens are not put in URL query strings. WebSocket upgrade uses the authenticated session or a one-use short-lived handshake grant; origins and scopes are checked. Heartbeats distinguish disconnected clients from absent activity. SSE emits immutable status/evidence refs; model token streams are transient and clearly separate from committed task completion. Reconnect cannot replay a write automatically.
