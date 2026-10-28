# Evolution kernel and system architecture

## Operating contract
OmniDev can improve over decades by converting authorized observations into reproducible, measured capability releases. Each interaction is a potential learning signal, not a guaranteed improvement. A failed experiment is useful evidence; an unmeasured change is not an improvement. Logical swarm nesting is unrestricted by schema, while active agents, experiments, model calls, storage and deployment are explicitly budgeted.

Evolution is a control plane separate from AgentOS execution. Omni Core requests capabilities; the Evolution Coordinator schedules proposals; independent evaluators measure them; policy decides permitted release scope; AgentOS runs an immutable released version. A candidate may not edit its evaluator, held-out dataset, grants, constitutional rules or release evidence.

## Services and authority
| Service | Responsibility | Durable output |
|---|---|---|
| Observation collector | Receive signed outcomes, user feedback, incidents and telemetry | Evidence records with source and consent |
| Learning curator | Deduplicate, classify, redact and establish applicability | Versioned lessons and training manifests |
| Evolution coordinator | Prioritize gaps and manage bounded candidate workflows | Candidate state and resource ledger |
| Genome registry | Store immutable expertise modules and lineage | Content-addressed manifests |
| Evaluation service | Replay, adversarial, quality, safety and cost comparison | Signed evaluation artifacts |
| Experiment service | Assign cohorts and enforce stopping rules | Allocation and outcome records |
| Release controller | Enforce current policy, canary and rollback | Scoped release and last-known-good pointer |
| Research / invention services | Produce source-grounded hypotheses and prototypes | Discovery and invention dossiers |
| Forecast service | Generate and calibrate conditional scenarios | Scenario ensembles and resolved predictions |
| Organization optimizer | Propose topology and workflow changes | Organization plan and migration evidence |
| Governance service | Maintain Omega policy, audits and emergency controls | Policy versions and override history |

The tenant home cell owns writes under a fencing epoch. PostgreSQL stores authoritative workflows, policy and releases; object storage stores immutable evidence; graph, vector and lexical indexes are derived views with generation watermarks. Redis is a cache, never the sole release authority. Event streams carry identifiers and hashes, not unrestricted tenant source. Regional replicas respect residency; failover transfers ownership before accepting writes.

## Universal improvement loop
Observe → Understand → Map → Analyze → Predict → Simulate → Plan → Build → Test → Deploy → Measure → Learn → Improve → Evolve. Each traversal is a finite workflow with a deadline, spend cap, cancellation generation and accountable owner. Repetition is scheduled by policy; “forever” means sustained stewardship, not an unstoppable job.

Observation and mapping establish provenance and gaps. Prediction produces hypotheses. Simulation screens alternatives. Planning records risks, success criteria and permission scope. Build creates a candidate. Test compares a fixed baseline. Deploy is a scoped, reversible release. Measurement checks real outcomes and delayed harm. Learning stores the result, including failed or reverted releases. Evolution updates only the relevant capability version.

Candidate lifecycle: observed → proposed → curated → sandboxed → evaluated → approved → canary → promoted. Any pre-release state can become rejected or expired; canary/promoted can become rolled_back or suspended. State changes use compare-and-swap version and an idempotency key. Replaying an event cannot duplicate a release.

## Autonomy boundary
Existing policy may authorize automatic low-risk prompt, retrieval or workflow changes inside a sandbox and narrow canary. New data access, tools, execution grants, model providers, security controls, financial commitments and external side effects require the appropriate owner-controlled authorization. Agents cannot create permission by creating more agents. Child authority is the intersection of parent, template, target policy and current account grant. Evolution cannot weaken these intersections.

This package is a target design. Existing bounded workers and static analyses do not implement this distributed evolution plane. All implementation backlog items remain open until their own acceptance evidence exists.
