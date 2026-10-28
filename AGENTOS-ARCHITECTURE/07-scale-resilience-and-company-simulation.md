# Enterprise scale, resilience and autonomous-company simulation

## Capacity and partitioning

Target millions of durable agents/tasks/repositories/decisions, with active execution constrained by measured capacity. A planning profile of 10 million registered agents and 100,000 simultaneous agent turns across 100 mature cells implies 100,000 agent identities and 1,000 active turns per average cell. This aligns with the production target profile; uneven load, giant tenants and hot incidents require additional partitions/dedicated cells. It does not mean 10 million simultaneous model requests or microVMs.

At 100,000 active turns with a 20-second renewal interval, the logical attempt-renewal workload is 5,000 renewals/second globally, approximately 50 per average cell. This excludes controller/placement/worker leases and is an arithmetic target, not a benchmark. Batch renewal transport may reduce requests but each lease remains independently fenced and authoritative. Dormant agents have no compute heartbeat. Registering agents consumes metadata/index/history capacity and is not free.

If average active turn lasts 30 seconds, 100,000 concurrency implies approximately 3,333 completed turns/second at steady state before failures/retries; arrival rate must stay below sustainable service capacity. Provider quotas, context sizes, GPU pools, tool licenses and spend limits may be more restrictive. Queue length does not equal compute throughput. Admission publishes estimated start/finish ranges based on measured rates, not one universal ETA.

Shard registry/task state by tenant/root objective and cell. Place task dependencies close to authoritative objectives, with indexed readiness counters and idempotent dependency receipts instead of repeatedly scanning millions of rows. Partition scheduler ownership with epoch-fenced controllers. Controller lease selects responsibility but does not itself authorize task effects. Bounded pagination and event-driven reconciliation avoid per-agent polling storms.

Cross-cell tasks are delegated operations with explicit parent context, budget allocation, target-cell receipt and source policy. Sender and receiver preserve one financial charge root and no global multiwriter. Intercell failures leave named waiting/reconcile states. No global barrier is required for unrelated objectives. Large company objectives split into independently accountable project work, with aggregate status derived from accepted child receipts.

## Availability and degraded modes

Registry/task/policy authorities run across availability zones per production topology. Temporal/Kafka and stores use separately qualified replication/backup profiles. Redis outage affects presence/cache and hints, not leases, budgets or completion authority. Model provider outage opens circuit breaker and queues work; alternate provider only when authorized by data/residency/model policy and actual grants. Do not hide provider differences in quality or cost.

If policy authority is unreachable, new protected dispatch fails closed. Allowed read projections may remain available with freshness labels. Loss of home-writer lease stops writes/effects after expiry; new cell ownership requires fencing per the production placement protocol. Retryable reads do not grant permission to replay an unknown external write. Restored agent status is reconciled against task/operation receipts and current policy before returning Active.

Use dead-letter quarantine and backpressure for malformed/poison messages, overloaded inference, stalled graph retrieval, unavailable licensed workers and excessive fanout. Maintain operational headroom for restore, incident capacity and index rebuild. Scale worker pools from queue age/resource class under cost ceilings, not raw agent count. No architecture claim assumes unlimited instant cloud capacity.

## Autonomous-company simulation

A company simulation is an isolated scenario with synthetic or consented minimized data, business objectives, repositories, departments, agent modules, staffing/capacity, market/traffic/revenue assumptions and policy. It tests cooperation, task allocation, debate, delivery, incidents and evolution before production adoption. It has no production credentials or external effect permissions by default.

Scenario clock supports accelerated simulated time without falsifying actual audit timestamps. Simulated task durations/costs/outcomes are explicitly labeled; real sandbox tool runs produce real receipts linked separately. Thousands of agents may participate logically while compute concurrency remains bounded. Seeded randomness and pinned versions enable replay; stochastic model outputs are preserved for analysis rather than assumed deterministic.

Measure objective attainment, verified artifact quality, collaboration cost, dependency bottlenecks, task starvation, unresolved conflict, incident recovery, budget adherence, false confidence and knowledge propagation. Stress scenarios include contradictory decisions, noisy alerts, failing providers, poisoned packs, key employee/agent loss, scarce GPU/license capacity and cascading dependencies. Simulated discoveries/optimizations remain hypotheses until real qualified tests establish value.

Omni Core manages strategic objective queues, not an unchecked company ownership transfer. Humans set organization priorities, permitted effect classes, budget/residency constraints and accountable approval. Within those constraints, verified loops can continuously maintain/improve projects. Autonomous breadth grows only as evidence supports additional preauthorized action classes.

## Verification gates

| Gate | Required proof |
|---|---|
| Agent contract | Every required field typed; skills/capabilities/grants separated; unknown scores supported |
| Lifecycle | Ten requested states correctly represented; drain/cancel/retire/destroy and stale-generation rejection exercised |
| Fractal organization | No fixed schema depth; aggregate budget/fanout conserved; merge/clone does not copy authority or votes |
| Scheduler | Fairness, deadline, starvation, concurrent claim, DAG cycles, skill/risk eligibility and resource reservation tests |
| Runtime | Worker crash before/after effect, late result, lease expiry, cancellation and unknown-side-effect reconciliation |
| Communication | Tenant/channel filtering, replay/deduplication, expiry, out-of-order sequence and bounded storms |
| Debate | Independent roles, quorum, candidate revisions, policy veto, dissent and human escalation |
| Evolution | Held-out regression evaluation, poisoned candidate rejection, canary rollback and privacy/license gates |
| Economy | Duplicate reward/clone/collusion prevention, exact integers, reversals and no credit-derived grants |
| Incidents | Automatic team admission, limited emergency capacity, authorized containment and sustained verified recovery |
| Marketplace | Signed version pinning, dependency/license/resource compatibility, consent and revocation |
| Command center | Correct lag/status, resumable streams, authorized detail, accessible tables and cancellation evidence |
| Scale/recovery | Target mixed workload at partition size, hot tenant/incident, multi-zone/region fencing and restored revocations |

Define and publish target workload before measurement: millions of dormant identities plus mixed active model/tool/review tasks, uneven tenants, adversarial bursts and long histories. Qualify 10k→100k→multi-cell populations and then million-scale metadata/queues. Pass latency/fairness/cost correctness gates at each stage. The production control API SLO remains 99.95% design availability and bounded p95 metadata latency; external provider/tool availability is disclosed separately. No benchmarks are claimed executed in this documentation wave.
