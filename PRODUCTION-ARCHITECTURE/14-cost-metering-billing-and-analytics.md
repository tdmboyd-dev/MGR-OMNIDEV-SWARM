# Cost tracking, metering, billing and analytics

## Financial authority

Cost is an execution admission constraint, not a dashboard estimate added after agents run. Root runs reserve maximum permitted model, compute, storage, connector and paid-plugin usage. Child reservations allocate the same root ceiling; spawning agents cannot create new credit. Organization budgets, project/environment caps, daily/monthly limits and recurring automation ceilings apply concurrently.

Use PostgreSQL immutable double-entry ledger with exact integer micro-currency units (`numeric(20,0)`) and explicit ISO currency. Every balanced journal group sums to zero per currency. Foreign exchange creates separately valued entries with rate/source/time; never sum currencies without conversion. Ledger corrections are compensating entries, not historical UPDATEs. Economic state is not stored authoritatively in Redis or ClickHouse.

Accounts include customer receivable/credits, reserved capacity, earned service revenue, provider/compute payable, marketplace payable, tax liability, refunds and internal allocation accounts. Operational reservations are distinct from actual financial settlement; the accounting mapping is reviewed before invoices are produced. User-facing spend and provider invoices are different reconciliation facts.

## Reservation and settlement lifecycle

1. Admission validates plan/entitlement and estimates a bounded maximum from requested output tokens, input size, compute limits, paid tools and rate-card version.
2. Atomically reserve against root and organization/project available balance using row locks or serializable control transactions. Reservation ID follows every descendant dispatch.
3. Execute allowed work with enforced limits and collect usage receipts: provider input/output/cache token categories, model/region, duration/CPU/GPU/memory, object bytes/retention, paid plugin calls and operation ID.
4. Verify/deduplicate receipts, compute cost using the dispatch-bound rate card and settle consumed portion. Release unused reservation at terminal state, retaining pending amounts for unresolved provider outcomes.
5. Reconcile provider/cloud/plugin billing exports against recorded receipts; append adjustments with provenance and customer policy.

An unknown provider response can consume billable usage. Do not release its full reservation or blindly call again until reconciled or the unresolved liability is explicitly accounted for. A small internal exposure reserve can cover legitimate post-dispatch price/usage variance; do not silently enlarge the user's approved root budget. Stop future dispatch if exposure exceeds policy.

Use `usage_receipt_id`/provider request ID uniqueness and exact dimensions to prevent replay charges. One model call's streamed tokens are one usage receipt, not a billable event for every delta. Rate-card revisions are immutable with effective dates and customer contract overrides. Retries are visible in actual cost attribution and do not hide wasted spend.

## Plans and billing paths

Support organization subscriptions/seats, consumption credits, enterprise committed use, dedicated infrastructure charges and marketplace tool/template charges. Entitlements define allowed capabilities and quotas, not security permissions. Seat ownership/provisioning reconciles with organization membership; removing a user need not erase their historical audit.

Account-based model plan usage is metered separately from platform fees. If a customer's ChatGPT or other eligible account plan pays the model provider, OmniDev must not label that usage as its own API charge or bill twice for the same pass-through item. Display actual billing path, any separate platform/compute/plugin charges and remaining provider-plan availability if supported. A provider plan limit cannot trigger silent API-key fallback or a new financial obligation.

Payment/invoice integration uses a supported payment service provider, idempotent invoice/payment operations and signature-validated webhook ingestion. Tax, payment onboarding and contractual credit/refund rules require qualified implementation/review. No real financial account or spending authority is established by this design.

## Cost allocation and executive controls

Dimensions: tenant, workspace, project, repository, root run, agent/template, swarm, provider/model, tool/plugin, environment, region/cell, resource class and initiative. Provide actual, reserved, estimated and reconciled values separately. Identify repeated failed runs, low-quality expensive templates, embedding refresh waste, idle compute and cross-cloud egress. Cost recommendations include expected savings, switching/quality/residency risk and verification experiments.

Threshold policies can pause optional work, lower configured concurrency, require review or schedule off-peak compute. They cannot switch models, reduce security checks or export data to another region without compatible explicit policy. Enterprise chargeback uses declared allocation rules and includes shared infrastructure overhead with an explainable basis.

## Analytics architecture

Product events use versioned schemas, minimum necessary properties, tenant consent/residency and deletion identifiers. Source code, prompts, secrets and raw private conversations are excluded by default. Ingest separately from control facts into regional ClickHouse/object lake; curated materializations power cohorts, funnels, task success, latency/cost, plugin quality and business KPIs.

Analytical results tolerate late arrivals and explicit corrections; financial ledger remains the authoritative billed amount. Query quotas and suppression/minimum-group rules protect shared/global aggregates. Attribution and causality are distinct: a conversion correlated with a feature is not proven caused by it. Customer/business analytics sources retain their own permissions and retention.

Quality controls reconcile event counts, duplicate IDs, schema drift, missing usage receipts and tenant deletion propagation. Platform-growth metrics never replace task correctness, security or actual customer outcomes as agent evaluation goals.
