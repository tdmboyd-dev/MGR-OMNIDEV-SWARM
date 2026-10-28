# API design, decisions and integration sequence

## REST and command contracts

Authenticated APIs inherit the platform's tenant/current-policy enforcement, stable error codes, idempotency keys, exact-target approvals and operation handles. Public inputs cannot choose an unrestricted tenant. Effectful commands require capability scope and expected resource revision; reads recheck source/evidence access.

| API | Semantics |
|---|---|
| POST /v1/agents | Admit pinned template/modules, specialization, scope and resource profile; return identity/admission operation |
| GET /v1/agents/{id} | AgentSpec/Status, authorized score/evidence summaries and observed generation |
| POST /v1/agents/{id}/lifecycle | Desired state and expected revision; drain/retire/destroy governed by policy |
| POST /v1/agents/{id}/clone | Expertise-only candidate, destination scope, no copied grants/trust/votes |
| POST /v1/agents/merge | Composite expertise proposal with source lineage and evaluation plan |
| POST /v1/swarms | Objective/member roles, scoped channels and root budget reservation |
| POST /v1/swarms/{id}/reorganize | Versioned membership/coordinator proposal; validates conflicts and conserved allocations |
| POST /v1/objectives | Outcome, dependencies, acceptance, scope and budget; create plan workflow |
| POST /v1/tasks | Validated task spec; agents cannot bypass planner/scheduler admission |
| POST /v1/tasks/claim | Eligible broker-mediated allocation, request idempotency and capacity |
| POST /v1/attempts/{id}/renew | Fence/generation and checkpoint reference; authoritative lease reply |
| POST /v1/attempts/{id}/complete | Output/evidence/usage receipts and exact input/lease binding |
| POST /v1/runs/{id}/cancel | Root cancellation generation, no new dispatch, reconciliation operation |
| POST /v1/messages | Typed scoped protocol envelope; recipient/channel enforcement |
| POST /v1/debates | Exact problem/options/roles/rubric/quota; bound decision workflow |
| POST /v1/debates/{id}/votes | Assigned role slot and candidate digest; dedup, conflict and quorum checks |
| POST /v1/evolutions | Candidate, baseline, evidence and evaluation plan; not direct kernel modification |
| POST /v1/incidents | Trusted signal or authorized manual incident; correlation/runbook admission |
| POST /v1/modules/install | Signed digest, compatibility, licenses and requested grants |
| GET /v1/swarm-stream | Cursor-bound authorized projections; resync snapshot on stale cursor |

Errors distinguish admission_denied, missing_provider_auth, worker_unavailable, budget_exhausted, competency_unqualified, independence_conflict, stale_candidate, fence_rejected, waiting_approval, effect_outcome_unknown and projection_behind. Unknown outcome responses include reconcile operation ID; client retry does not create another effect. Task claiming and completion are worker/service endpoints authenticated by attested identity, not ordinary browser mutation rights.

Events include agent.created/admitted/lifecycle_changed/retired, swarm.created/reorganized, objective.planned, task.ready/claimed/reviewed/completed, attempt.expired, debate.opened/objection_recorded/decided, evolution.proposed/promoted/rolled_back, credit.awarded/reversed, incident.detected/recovered and module.revoked. Production event envelope applies; entity/tenant/version/epoch references and object digests replace raw sensitive context. Stream summaries are projections, not authority.

## Architecture decisions

A-ADR-01: Agent identity separate from compute and model; millions of logical agents need not be continuously running.

A-ADR-02: Durable lifecycle separate from parallel activity and health; preserve all ten requested display states without contradictory scheduling semantics.

A-ADR-03: Dynamic collaboration graph with auditable acyclic cost/creation lineage; no fixed schema depth, finite runtime budgets.

A-ADR-04: Omni Core federated by home cell; deterministic policy/approval surrounds generative planning.

A-ADR-05: Leased fenced attempts and operation receipts; provider external side effects are reconciled, not assumed exactly-once.

A-ADR-06: Fair scheduling and bounded incident reservation; task priority never bypasses grants.

A-ADR-07: Independent debate roles, fixed rubric, one vote per role slot and nonoverridable policy gates.

A-ADR-08: Trust/influence/credit advisory; authority always explicitly delegated. Clone/merge cannot union privileges.

A-ADR-09: Evolution is versioned proposal/evaluation/canary/rollback, not unreviewed self-modification.

A-ADR-10: Marketplace skills inherit after compatible validated install; active permissions remain separately approved.

## Integration into existing OmniDev Swarm

The current bounded queue/runtime and portable worker contract are starting implementation pieces, not full AgentOS. Preserve existing runtime acceptance results and account-first UI. Map current run/attempt identities to canonical AgentSpec and TaskSpec through an explicit migration adapter; existing regex/static analysis becomes heuristic evidence per prompt 3. Do not relabel present workers as millions-scale or claim every swarm catalog entry is an executable expert.

| Stage | Build deliverable | Production acceptance dependency |
|---|---|---|
| A1 | Registry/admission/lifecycle and template versioning | Identity, grants, drain/revocation and all lifecycle guards |
| A2 | Objective/task DAG, reservations, fair claims/fencing | Concurrent claims, starvation, budget/cancel/unknown effects |
| A3 | Live authorized models and attested isolated workers | Real provider consent, actual executions/receipts, failed-worker recovery |
| A4 | Scoped communication, reviews/debate and decision memory | Isolation, anti-Sybil, quorum, evidence and independent tests |
| A5 | Dynamic swarm reorganization and expertise transfer | No grant expansion, no cost reset, lineage and retained dissent |
| A6 | Evaluations/internal economy/evolution | Meaningful held-out outcomes, anti-gaming and rollback |
| A7 | Incident teams and control-center streams | Rehearsed containment/recovery and accurate realtime states |
| A8 | Marketplace packs and company simulation | Signed/licensed compatible modules, consent, calibrated scenarios |
| A9 | Multi-cell scale/HA/DR qualification | Workload benchmarks, failure injection, current-policy restore |

All prior unfinished items stay open until their implementation/evidence gates pass. This document supplies detailed specification and additional tests; it does not reset earlier architectural decisions or create a mandatory Vercel dependency. Deployment remains portable across the chosen cloud infrastructure.
