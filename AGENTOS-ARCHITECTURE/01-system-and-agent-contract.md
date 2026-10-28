# AgentOS system architecture and agent structure

## Operating-system model

AgentOS is the logical operating system for intelligent principals within OmniDev Swarm. Its kernel provides admission, identity, policy enforcement, scheduling, leases, durable state, communication, resource accounting and effect brokerage. Intelligence modules provide planning, domain reasoning and tools through versioned contracts. An agent is a durable identity and capability profile; a worker is replaceable compute; a model is a provider of inference. These are separate objects. Kubernetes schedules underlying compute, Temporal coordinates durable workflows, and AgentOS schedules authorized intellectual and engineering work on top of both.

This package defines prompt 4's full technical design. It extends the production architecture and prompt 3's eight-layer knowledge architecture. Documentation and reference-contract validation do not establish that the target system is deployed, that all marketplace packs execute, or that the platform operates autonomously at target scale.

Omni Core is a federated orchestration service with deterministic policy around replaceable planning intelligence. It is not a single all-powerful model, singleton process or global database writer. Each cell has an authoritative controller group for its tenant work. Global routing discovers home cells and public templates; private memory and decisions remain within authorized residency. Root objectives may span permitted projects through delegated child work, not by granting global access to one agent.

## Kernel and service ownership

| Service | Responsibility | Durable authority |
|---|---|---|
| Agent Registry | Principal identity, specialization, desired lifecycle, immutable template binding | Per-cell PostgreSQL agent schema |
| Admission Controller | Template signatures, skills, allowed tools, policy/budget/resource checks | Admission receipts and policy revisions |
| Lifecycle Controller | Reconcile desired/observed status, quiesce, archive, retire, destroy | Fenced agent generation and lifecycle events |
| Objective Planner | Resolve objectives into validated task DAGs and acceptance plans | Versioned plan artifacts and objective state |
| Task Scheduler | Fair ready queues, eligibility, atomic claims, lease/fence, starvation prevention | Task authority and allocation transactions |
| Workflow Runtime | Durable execution generations, checkpoints, timers, retries and compensation | Temporal histories plus reference artifacts |
| Worker Gateway | Attestation, worker pool routing, execution receipts | Attempt/worker/lease records |
| Model Gateway | Provider grants, model routing, inference reservation and usage reconciliation | Provider authorization and usage ledger |
| Tool Broker | Exact-target capability enforcement and effect receipts | Operation authority, approvals and idempotency |
| Collaboration Router | Scoped messages, requests, debates and subscriptions | Conversation/message journal and recipient policy |
| Debate Controller | Role assignment, independence, rounds, objections and adjudication | Structured decision record |
| Memory Gateway | Prompt 3 memory admission, authorized retrieval and knowledge transfer | Knowledge journal; no duplicate agent memory truth |
| Evaluation Controller | Outcome quality, calibrated trust, health and regression analysis | Signed evaluations and score revisions |
| Evolution Controller | Candidate skill/workflow/reasoning upgrades, experiments and rollout | Versioned candidates and promotion gates |
| Economy Controller | Knowledge-credit/influence accounting and anti-gaming rules | Nonfinancial credit ledger; actual money remains billing authority |
| Incident Controller | Deduplicated emergency objectives, expert roster and recovery gates | Incident/runbook/action records |
| Module Registry | Marketplace packs, signatures, compatibility and revocation | Immutable module manifests and install grants |
| Realtime Projector | Command-center views, heat maps and event cursor delivery | Derived views; never permission or completion authority |

Use service-owned schemas and APIs. Outbox/inbox connect changes without cross-service uncontrolled database writes. External calls occur in activities with recorded input/output references. Controllers reconcile desired state using compare-and-swap revisions; retrying reconciliation must not create duplicate agents, charge twice or dispatch a second production action.

## Canonical AgentSpec and AgentStatus

| Required field | Technical representation |
|---|---|
| Agent ID | Tenant-scoped UUID principal; immutable; separate generation and template digest |
| Agent Name | Human-readable scoped label; mutable display name, never routing authority |
| Specialization | Namespaced domain and supported versioned task classes |
| Skills | Skill IDs/versions, evidence-backed proficiency and evaluation manifests |
| Capabilities | Template-declared possible operations and typed I/O contracts |
| Permissions | Current delegated grant references, target scope, policy revision and expiry |
| Communication Channels | Authorized subscription/recipient selectors and rate budgets |
| Memory | Working checkpoint plus scoped selectors into session/agent/swarm/project/org/global/innovation/future layers |
| Knowledge Sources | Authorized snapshot manifests, source grants and retrieval policies |
| Reasoning Engine | Versioned planner/rule/model policies, evaluation profile and provider constraints |
| Task Queue | Durable queue selector, assignment inbox and concurrency profile |
| Objective Queue | Prioritized objective references and root budget/deadline inheritance |
| Performance Score | Task-class rubric revision, outcomes, sample size, uncertainty and freshness |
| Trust Score | Domain/action-risk-specific calibrated reliability plus policy incidents; not authorization |
| Health Score | Operational component signals with raw status and confidence; unknown allowed |
| Resource Limits | CPU/GPU/RAM/storage/tokens/turns/concurrency/fanout/time/cost/network/tool limits |
| Lifecycle Status | Requested lifecycle plus observed activity and orthogonal health conditions |

Additional fields: created_by, owner, tenant/project/environment, template/version, module digests, lineage, accountable supervisor, admission receipt, policy/authority epoch, cancellation generation, retention and residency. Scope restrictions intersect across all attached modules. Skills may describe competence; capabilities describe possible operations; grants authorize specific operations. Learning a skill cannot mint a grant.

AgentSpec describes desired configuration. AgentStatus describes observed state, active attempts, readiness, last heartbeat/checkpoint, task/score watermarks and conditions. Every update includes resource_version; stale clients receive revision_conflict. Index registry by tenant/lifecycle, specialization/task class, module version and home shard. Do not create one PostgreSQL polling loop or Kubernetes deployment per dormant agent.

## Isolation and runtime classes

Model-only agents execute constrained inference and structured-output validation with no direct network/tool credential access. Tool-capable agents use brokered operations. Hostile repository execution runs in attested microVM pools; container-only pools serve lower-trust approved workloads, not arbitrary untrusted code. 3D/GPU/game-engine work uses licensed resource-specific workers and appropriate isolated sessions. Browser/device automation requires its own explicit grant and external session policy.

Provider account login supplies only its permitted inference capabilities. AgentOS cannot convert an ordinary Google/GitHub identity login into a hosted AI usage grant. Missing provider authorization yields waiting_provider_auth rather than a concealed API fallback or imaginary worker. Customer-controlled encrypted workspaces execute plaintext reasoning locally under disclosed capability limits.
