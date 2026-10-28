# Research, requirements coverage and qualification queue

Targeted primary-source architecture review, October 8–9, 2026. This is not a claim of end-to-end vendor/kernel performance validation. Pin versions/licenses and execute compatibility, fault and workload tests before release.

| Primary source | Design lesson | Disposition |
|---|---|---|
| [Kubernetes leases](https://kubernetes.io/docs/concepts/architecture/leases/) | Lease/heartbeat coordination patterns | ADAPT patterns; AgentOS requires separate effect fencing and authority |
| [Temporal workflow definition](https://docs.temporal.io/workflow-definition) | Deterministic orchestration with external work separated | ADOPT durable workflow behind AgentOS contracts; version/history limits qualified |
| [OpenTelemetry propagators](https://opentelemetry.io/docs/specs/otel/context/api-propagators/) | Trace context transmission | ADAPT gateway-validated propagation; no sensitive baggage |
| [Production references](../PRODUCTION-ARCHITECTURE/source-references.md) | Workload identity, isolation, events and provider grants | Preserve established boundaries |
| [Knowledge architecture](../KNOWLEDGE-ARCHITECTURE/README.md) | Eight memory layers, evidence and decision semantics | Reuse canonical memory authority |

## Requirements mapping

| Requested area | Specification |
|---|---|
| AgentOS, all agent structure fields, enterprise coordination | Chapter 1 and agent schema |
| Created/Learning/Active/Busy/Reviewing/Collaborating/Dormant/Archived/Retired/Destroyed | Chapter 2, durable lifecycle plus activity model and lifecycle contract |
| Create agent, swarm, temporary expert, investigation/emergency teams, merge, retire, transfer, clone | Chapter 2 operation table |
| Events/messages/tasks/requests/reviews/debates/peer evaluation/voting/escalation | Chapter 4 and communication schema |
| Major decisions, multiple options/arguments/risks/consensus and Omni Core approval | Chapter 4 debate algorithm and decision receipts |
| Priority/urgency/complexity/skills/dependencies/risk/outcome/success criteria, automatic claims | Chapter 3 and task schema |
| Learning skills/tools/workflows/reasoning/recommendations/failures/discoveries | Chapter 5 controlled evolution pipeline |
| Trust/influence/authority/knowledge/performance/innovation economy | Chapter 5 metrics and separate credit ledger |
| Realtime activity/discussions/tasks/problems/risks/opportunities/predictions/heat/resources | Chapter 6 command center |
| Security/outage/revenue/database/deployment emergencies | Chapter 6 emergency table and lifecycle |
| Observe/analyze/plan/execute/measure/learn/improve/repeat | Chapter 5 and incident learning |
| Security/Healthcare/Finance/Unity/Unreal/Blender/React/Data Science packs | Chapter 5 module contract |
| Thousands of collaborating agents/projects/discoveries/optimizations | Chapter 7 isolated company simulation and verified loops |
| Communication/orchestration/lifecycle/scalability/evolution full technical architecture | Chapters 1–8, contracts and release gates |

## Research packets and unresolved empirical work

| Packet dimension | Orchestration/lifecycle | Collaboration/evolution |
|---|---|---|
| Definition/use | Durable principal and task control over isolated inference/tool work | Evidence-backed deliberation and controlled expertise upgrades |
| Standards | Typed APIs/events, workload identity, temporal task/lease semantics | Trace protocol, signed artifacts, decision/memory contracts |
| Papers/open implementations | Reviewed Kubernetes leases and Temporal behavior; scheduling algorithms are baseline design choices | Native debate/governance; no claim votes establish truth or research proves general self-evolution |
| Models/datasets | Planner/model not locked; licensed candidates evaluated on held-out tasks | Domain/project/time-separated debate and upgrade corpora; correlated reviewers disclosed |
| Licensing/providers | Workflow/compute editions and pack licenses verified in procurement; account grants explicit | Signed marketplace models/tools/data with separate licenses and permissions |
| Native alternative/placement | AgentOS owns admission/scheduler/lifecycle atop replaceable infrastructure | AgentOS owns debate/economy/evolution; knowledge service owns memory |
| Hardware/cost | Dormant metadata versus finite CPU/GPU/licensed/inference pools; conserved root resources | Bounded rounds/evaluations/shadow rollout; real cost separate from credits |
| Failure modes | Duplicate claim, expired lease, unknown effect, poison task, unfair queues | Sybil votes, collusive scoring, privilege cloning, poisoned upgrades, drift |
| Evaluation/acceptance | Concurrent claim/recovery/fairness/target workload gates in chapter 7 | Quorum/independence/anti-gaming/regression/rollout gates in chapter 7 |

A-R01 queue: benchmark fair scheduler and lease/fencing transaction design under hot tenants and target concurrency. Status SPECIFIED; no benchmark executed.

A-R02 queue: select planner/reviewer/embedding/reranker models against domain corpus, licenses, provider account grants and correlated-review failure cases. Status QUEUED.

A-R03 queue: implement worker attestation and microVM/GPU/creative-tool compatibility with real target engines. Status SPECIFIED; current live-worker gaps unchanged.

A-R04 queue: calibrate domain/risk trust and evaluate anti-gaming economy on adversarial cooperation scenarios. Status SPECIFIED; score thresholds not empirically proven.

A-R05 queue: validate evolution rollback, pack revocation and tenant memory/permission propagation end to end. Status SPECIFIED.

A-R06 queue: rehearse emergency teams, unknown-side-effect recovery and multi-cell restore/fencing. Status SPECIFIED.

Design decisions are owned by OmniDev; providers remain replaceable. Empirical qualifications stay open until their acceptance gates are evidenced. Source-code existence or documentation checks do not qualify these systems for production.
