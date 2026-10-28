# API and SDK architecture

## Public boundaries

REST `/v1` owns resource commands and conventional reads. GraphQL composes authorized views across projects and dashboards with cost/complexity budgets; it cannot submit raw Cypher or arbitrary service fanout. WebSockets carry scoped subscriptions and collaboration; SSE carries operation progress and model output where authorized. Internal services use versioned gRPC contracts. Enterprise APIs add identity provisioning, organization policy, audit export, residency/dedicated-cell administration and financial reports.

First-party clients use the same policy and operation model as public SDKs. They have no hidden bypass endpoint. Agents use the Tool Broker API with derived capabilities; agent templates cannot directly receive an unrestricted public token. Automation API schedules a durable workflow with explicit source access, project policy, recurring budget and expiry.

## Resource families

| Family | Canonical routes / operations |
|---|---|
| Organizations/workspaces | `/v1/organizations/{id}`, `/workspaces`, `/members`, `/policies`, `/environments` |
| Connections | `/v1/connections`, `/{id}/authorize`, `/callback`, `/resources`, `/sync`, `/revoke` |
| Projects/repositories | `/v1/projects`, `/{id}/repositories`, `/snapshots`, `/intelligence`, `/roadmaps` |
| Agents/swarms | `/v1/agents`, `/swarms`, `/{id}/children`, `/tasks`, `/messages`, `/retire` |
| Runs/tasks | `/v1/projects/{id}/runs`, `/v1/runs/{id}`, `/cancel`, `/events`, `/artifacts` |
| Graph/memory/search | `/v1/projects/{id}/graph/query`, `/memory`, `/search`, `/decisions` |
| Findings/security | `/v1/projects/{id}/findings`, `/{id}/disposition`, `/scans`, `/threats` |
| Candidate delivery | `/v1/change-sets`, `/{id}/validate`, `/review`, `/pull-requests` |
| Approvals/operations | `/v1/approvals`, `/v1/operations/{id}`, `/reconcile` |
| Deployments/incidents | `/v1/environments/{id}/deployments`, `/rollbacks`, `/incidents`, `/repair-runs` |
| Twins/futures/innovation | `/v1/projects/{id}/twins`, `/scenarios`, `/forecasts`, `/opportunities`, `/experiments` |
| Scores/dashboards | `/v1/projects/{id}/scores`, `/v1/workspaces/{id}/dashboard` |
| Marketplace | `/v1/plugins`, `/releases`, `/installations`, `/agents/templates` |
| Metering/billing | `/v1/budgets`, `/usage`, `/invoices`, `/cost-allocations` |
| Automation/enterprise | `/v1/automations`, `/enterprise/scim/v2`, `/audit-exports`, `/residency` |

Paths abbreviated in this table inherit their parent scope; the owning service resolves all resource ownership. The reference OpenAPI contract covers core task/change/deployment commands; the resource catalog is the complete family boundary and must become service-specific specifications during implementation.

## Command contract

Authenticated principal must be a permitted organization/workspace member. Requests include `Idempotency-Key` for effectful POSTs, `If-Match` for updates and an optional request/correlation ID. The server derives tenant/project context. Body max is endpoint-specific: ordinary command 64 KB; snapshots/assets use reserved multipart object uploads, never unlimited API bodies.

Typical `POST /v1/projects/{project_id}/runs` body: objective, immutable source snapshot ID, typed task class, acceptance criteria, requested capabilities, execution policy and cost ceiling in exact currency units. The server checks policy, validates the plan inputs, reserves admission and commits a run/outbox event. Response `202` contains run ID, revision, status, operation URL and progress cursor. It never says code was deployed merely because a task was accepted.

A change-set submission binds parent run, base commit/snapshot digest, patch/asset manifest and evidence refs. Repository or deployment command references an approved immutable change-set; it cannot replace it with new code in the same request. Deployment additionally binds environment/target, plan digest, rollback artifact, health gate and grant/approval.

`GET /operations/{id}` returns `accepted|dispatched|reconciling|succeeded|failed|compensated|canceled`, provider receipt, output artifact and observed outcome. An uncertain side effect remains reconciling until a provider-side read establishes state. Idempotency scope includes tenant, principal/action, target and normalized payload hash; reusing a key with different input returns conflict. Retention is at least the operation reconciliation horizon; release/financial effects retain durable identities beyond ephemeral HTTP cache expiry.

## Read and streaming contracts

List APIs use opaque signed cursor, stable snapshot/watermark and bounded `limit` (default 50, max 200). Do not paginate by mutable offsets for huge changing sets. Responses include source revision, observation time, projection watermark, coverage, classification and `partial` with source-level errors. Strong read-after-write selects the owning authority or waits for a specified watermark until deadline; timeouts return pending state, not stale success.

GraphQL default maximum depth 8, field complexity 1,000 and total resolver deadline 2 seconds; expensive query/memory/graph algorithms become async jobs. DataLoader/cache keys include tenant and authorization epoch. Persisted query IDs are preferred for dashboard panels. SDKs do not cache revoked private results indefinitely.

Streaming uses event IDs and typed terminal events. A model stream has `delta`, `usage`, `completed`, `failed` or `incomplete`; only completed establishes success. A task stream has committed state transitions separate from token text. Partial provider output cannot become validated candidate code without a completed result and schema/behavior checks.

## Errors and abuse controls

Problem body: `{type, title, status, code, request_id, retryable, retry_after_ms, operation_id, details}`. Codes distinguish `unauthenticated`, `forbidden`, `consent_required`, `grant_revoked`, `residency_violation`, `budget_exhausted`, `stale_revision`, `rate_limited`, `projection_pending`, `unsupported_capability`, `invalid_artifact`, `execution_unavailable` and `outcome_unknown`. Error details are sanitized; never include upstream credential responses.

Enforce per-identity/org/project/provider rate, concurrency and resource-weight budgets. Global traffic spikes can degrade research while preserving admission/status and incidents. SDKs retry only declared retryable reads/idempotent commands with jitter and deadlines; never blindly retry a side effect after an unknown outcome. Browser CORS is explicit; CSRF checks apply to cookie mutations. Uploads verify digest, media type, malware and compressed expansion limits before processing.

## SDK design

Publish typed TypeScript, Python and Go SDKs from versioned OpenAPI/gRPC/schema contracts. Provide `createRun`, `watchRun`, `cancelRun`, `queryGraph`, `searchMemory`, `submitChangeSet`, `requestApproval`, `createDraftPR`, `planDeployment` and `observeOperation` primitives. Low-level escape hatches still enforce server policy. SDK examples show account authorization and workload federation rather than requiring user model keys.

Client compatibility policy: support the current major and previous major through a declared deprecation window; versions are pinned in plugin/template manifests. Breaking permission or artifact semantics require a new contract version. Generated client/schema conformance tests and service consumer tests gate releases. Public API documentation includes limits, consistency, residency, usage cost and actual capability availability.
