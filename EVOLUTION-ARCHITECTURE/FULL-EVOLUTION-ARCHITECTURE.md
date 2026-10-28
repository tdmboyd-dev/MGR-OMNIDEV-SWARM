# OmniDev Swarm: complete evolution architecture

Target design, not a claim of live autonomous evolution.

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


---

# Learning systems and adaptive expertise

## Evidence pipeline
Capture successes, failures, observations, comparisons, simulations, experiments, peer review, user corrections, historical outcomes and resolved forecasts. Each signal records tenant, actor, task, capability version, source revision, timestamp, rights, sensitivity, outcome and confidence. Outcome metrics must distinguish task completion from actual user benefit. A positive click, an agent's confidence or a peer vote is not proof of correctness.

Curators reject injected instructions, corrupted provenance, duplicate clone feedback and unverifiable claims. They group incidents by root cause, preserve dissent and record uncertainty. Conflicting evidence produces competing hypotheses with applicability boundaries rather than silently overwriting a lesson. Source corrections or deleted rights trigger withdrawal and downstream invalidation.

## Learning modes
| Mode | Mechanism | Promotion requirement |
|---|---|---|
| Episodic | Retrieve relevant task history within scope | Provenance and current access |
| Semantic | Consolidate repeated verified lessons | Deduplication, contradiction and expiry review |
| Procedural | Version workflows, tool instructions and checks | Replay and integration evaluation |
| Prompt | Generate and compare prompt variants | Held-out evaluation and canary |
| Retrieval | Tune ranking, chunking and graph expansion | Recall, precision, leakage and latency tests |
| Adapter / fine-tune | Train an approved model variant on licensed data | Training consent, contamination controls and model release gates |
| Social | Transfer reviewed expertise modules | Independent validation in receiving domain |

Changing system knowledge does not automatically modify provider model weights. Provider-hosted training requires a supported training interface and account rights; an OAuth identity alone does not grant inference or training. Begin with memory, retrieval and versioned procedures; treat weight changes as separately governed releases.

## Expertise profile
For each skill and environment maintain accuracy, success/failure, innovation quality, forecast calibration, task quality, satisfaction and learning speed. Record numerator, denominator, sample interval, cohort, evaluator version and uncertainty. Accuracy is evaluated against independent outcomes; satisfaction is a separate subjective signal. Innovation measures adopted value after review, not idea count. Learning speed measures time and cost to sustained competency at a fixed benchmark.

Maintain profiles per language/framework/version/risk tier rather than a universal “smartness” score. Use minimum samples and interval estimates; mark missing evidence unknown. Compare matched task cohorts or randomized assignments to reduce selection bias. Specialization should follow demonstrated strengths while preserving exploration budgets for less-tested agents. Trust cannot be inherited by clones or purchased with knowledge credits.

## Forgetting, drift and refresh
Memory retention and retrieval priority are separate. Preserve permitted historical evidence while reducing stale lesson priority. Check framework/version applicability and invalidate recipes after breaking API changes. Maintain representative replay sets to detect catastrophic forgetting. Retrain or refresh only with rights and budgets; quarantine a skill if harm or drift exceeds its limit. User correction updates a record with provenance, not every tenant's default immediately.

Forecasts are scenarios until resolved. Simulated outcomes are labeled synthetic and cannot be counted as real-world wins. Learning from futures means learning from assumptions, sensitivity and later observed resolution. A diversity of credible evidence should outweigh repeated copies of the same claim.


---

# Agent genetics and autonomous capability creation

“DNA” is a versioned software manifest, not biological intelligence. An agent genome references five immutable module families: Knowledge DNA (sources and concepts), Reasoning DNA (planning/review policies), Skill DNA (typed capabilities), Workflow DNA (task graphs), and Decision DNA (decision rules and evidence thresholds). Identity, credentials, user consent, permissions, accumulated trust and vote eligibility are not inheritable traits.

## Genome record
A genome contains ID, semantic version, content hash, parent hashes, module hashes, applicability predicate, tool requirements, license/rights manifest, compatible AgentOS versions, evaluation manifest, risk tier, resource envelope, expiry/review date and signature. A trait names its purpose, inputs, outputs, dependencies, failure modes and rollback replacement. Parent links form an acyclic lineage graph. A release pins exact module hashes, never mutable “latest.”

Mutation changes a candidate prompt, workflow, retrieval rule or skill configuration. Recombination selects compatible module versions from approved parents. A compatibility solver rejects incompatible tool contracts, contradictory decision rules, invalid licenses and missing evaluation. No permissions union is allowed. Behavioral cloning transfers tested procedures and approved knowledge references; it does not duplicate a human account or model identity.

## Selection
Evaluate on quality, safety, latency, cost, robustness and domain applicability. Maintain a Pareto frontier; a faster but less reliable candidate may be acceptable for drafts and unacceptable for migrations. Safety and privacy are hard constraints, not weighted tradeoffs. Compare to the exact current baseline and a stable reference benchmark. Preserve specialist diversity so one popular trait does not erase capability in rare environments.

Successful traits propagate through signed capability releases. Poor traits become deprecated within their failing context; keep failure evidence for audit and do not remove unaffected uses without analysis. A receiving swarm revalidates on its own environment. Rollback restores the previous genome and procedural versions; durable business side effects require explicit compensations.

## Autonomous creation workflow
A discovered framework, threat or platform creates a gap record. Deduplicate against existing expertise. If a reusable skill suffices, extend an existing candidate; otherwise propose a temporary specialist with narrow goals. Define training sources, tools, benchmarks, budget and retirement conditions. Spawn only under AgentOS quotas. Research, sandbox and evaluate before granting production task eligibility.

New swarms require a measurable coordination need: independent skills, queue pressure or incident isolation. An agent can propose an investigation/emergency team; policy may automatically instantiate preauthorized templates. Novel executable tools and external access remain owner-controlled. Unknown technologies initially use read-only research experts. Expire unused specialists, archive permitted knowledge and release compute.

## Merge, split and retirement
Merge expertise modules and task routing, never identities or credentials. Split roles when queues, conflicts or security boundaries demand separation. Drain tasks with lease/fencing rules before transferring ownership. Keep stable references for audit. Destroyed agent instances may retain a minimized legally permitted tombstone; deleting private source propagates through memory and derived artifacts. Retirement does not silently revoke obligations for an in-flight change.


---

# Collective intelligence and graph evolution

## Libraries
Pattern, lessons-learned, optimization, security, architecture and innovation libraries share one evidence envelope. Each entry has claim, evidence links, applicability, contrary evidence, rights, sensitivity, owner, version, quality status and review date. A lesson from one project improves another only when transfer is authorized and technically relevant. Tenant-private code, secrets, customer details and unique business strategies never enter a global pool by default.

Local → project → organization → consented global propagation is a controlled release pipeline. Redaction is insufficient where context reidentifies a tenant. Prefer general recipes supported by independently licensed/public evidence; require opt-in and privacy review for tenant-derived patterns. Aggregate metrics use minimum cohorts, suppression and a documented privacy mechanism where appropriate. Global indexes cannot bypass current project access. Withdrawal tracks all derived summaries, embeddings, training manifests and exports; completed weight training may require model retirement or retraining according to its deletion contract.

## Provenance and contradictions
Represent evidence as entities, transformations as activities and responsible actors as agents using W3C PROV concepts. Record derivation DAGs, source revision hashes and policy versions. Assertions include confidence, evidence strength, valid time, transaction time and assertion type: observed, inferred, simulated or forecast. A derived answer must display its evidence and uncertainty; unsupported causal inference remains a hypothesis.

## Self-optimizing ontology
Graph evolution creates candidate relationship types, classifications and abstractions in a registry. A proposal specifies semantics, cardinality, tenant scope, migration and backward compatibility. Evaluate representative queries, false merges, entity-resolution accuracy and access filtering. Test shadow indexes before rollout. Additive changes can be automated under approved rules; breaking ontology/schema changes require owner-controlled release gates.

Never rename away historical meaning. Store ontology version on assertions and provide translation views. Preserve IDs while enriching classification. Entity resolution may propose a merge but cannot merge separate tenant entities or conflate similarly named services without evidence. Unsupported nodes connect to an owning scope and a gap marker; do not fabricate a relationship just to satisfy “nothing isolated.”

## Retrieval evolution
Compare lexical, vector and graph retrieval using time-aware, access-filtered gold queries. Measure relevance, citation fidelity, coverage, latency and cost. Filtering occurs before candidate expansion and again before response assembly. Track derived-index watermarks; incomplete generations must be visible. A ranking candidate may not optimize clicks by burying security findings or stale-source warnings. Rollback selects a compatible index generation, not mixed schema fragments.

Cross-library subscriptions deliver version notifications, not uncontrolled source broadcasts. Subscribers validate applicability and grants before importing. Invalidated high-risk lessons generate affected-release queries and a remediation queue. Knowledge growth counts verified usable coverage after deduplication and withdrawal, not raw nodes or embeddings.


---

# Experiments, meta-reasoning and prompt evolution

## Experimental contract
Every experiment freezes hypothesis, baseline hash, candidate hash, population, assignment unit, exclusions, primary metric, secondary metrics, harm constraints, sample plan, stopping rule, spend limit and expiry. Choose repository or organization assignment when users/tasks contaminate one another. Stratify by domain and risk. Register the plan before observing outcomes. Use sequential methods with valid error control if continuously monitored; do not repeatedly peek and claim an ordinary fixed-sample significance result.

The evaluator belongs to an independent service identity. Hidden tests remain inaccessible to candidates. Keep time-separated and external challenge sets to detect contamination and benchmark overfitting. Count correlated clones as one evidence lineage. Repeat promising results on a fresh cohort. Report confidence intervals, effect size, adverse outcomes and cost, including inconclusive results. Multiple candidate search requires multiplicity control or independent final confirmation.

Sandbox simulations screen architecture, security, deployment, business and UX alternatives. They do not certify production behavior. A digital twin records calibration error and model assumptions. Business experiments need an authorized real cohort before revenue claims become observed evidence. Stop immediately for privacy violations, unexpected privilege, destructive behavior or hard budget breach.

## Meta-reasoning
Evaluate plans against outcome-grounded criteria: correct decomposition, dependency coverage, uncertainty handling, evidence fidelity, recovery, collaboration and user value. Store concise decision rationale, cited evidence, tool traces and outcome attribution. Do not require storage of private chain-of-thought. Confidence alone is not a quality metric; a critic's assertion is itself evidence to evaluate.

Use counterexample generation, independent review, alternative plans and causal diagnosis. Separate model limitations from retrieval, tool, permission and environment failures. Escalate disagreement when evidence cannot resolve it. A meta-policy candidate goes through the same independent gates; recursion depth and critique budget are finite. Optimize the cheapest process that sustains quality, not the longest debate.

## Prompt system
Prompts are typed artifacts with template version, variables, instruction hierarchy, tool schema hashes, model compatibility, intended scope and content hash. Generate candidates from failure clusters and approved lessons. Store diffs and hypotheses. Test injection resistance, refusal/permission behavior, source grounding, task success, latency and token cost. Pin model revision where supported and record observed provider revision otherwise.

Promote only if the candidate passes absolute harm constraints and the required improvement/noninferiority bounds against the frozen baseline. Cross-model portability is measured separately. Canary by scope with instant version rollback. A model change invalidates compatibility assumptions and triggers reevaluation. Never optimize a prompt to conceal uncertainty, bypass controls or manipulate satisfaction ratings.

OPRO research supports candidate generation and evaluation as a useful pattern on studied tasks; it does not prove universal recursive self-improvement. Prompt optimization must be constrained by independent evaluation and operational boundaries.


---

# Research, invention and future exploration

## Permanent research division
Technology watch swarms monitor approved scientific, AI, infrastructure, software and business sources. Connector schedules respect licensing, robots/API terms, rate limits and budgets. Maintain source publication date, access date, author, provenance and revision. Distinguish primary evidence, vendor claim and commentary. Novelty detection compares against existing knowledge and prompts independent corroboration for consequential claims.

Research queues prioritize expected information gain, user relevance, urgency and cost. A new paper is not automatically a platform dependency. Produce a dossier: problem, method, evidence, limitations, replication plan, rights, threat model, maturity and potential benefit. Reproduce only in isolated workers. Convert a discovery into a capability candidate through the normal evaluation and release pipeline.

## Invention pipeline
Idea → evidence review → novelty/competitive search → feasibility → prototype → validation → adoption decision → monitored outcome. Record source attribution, contributor rights, prior art search scope, expected customer value, assumptions, failure modes and cost. “Patent concept” is a research label; patentability and ownership need qualified review. Do not represent an idea as patented or commercially validated.

Cluster duplicate ideas and preserve alternative designs. Rank by problem severity, evidence, feasible differentiation, time-to-value, risk and opportunity cost. Maintain separate portfolios for core platform, customer-specific and speculative research. An invention's success score depends on adopted outcomes, not number of generated pitches. Stop low-value work and preserve lessons.

## Scenario engine
Generate bounded ensembles across technology adoption, traffic, pricing, model availability, regulation, competitors and failure conditions. Each scenario stores assumptions, horizon, conditional outcomes, dependency model, random seed, simulator version and evidence. Thousands of runs use quotas, representative sampling and diversity selection rather than unlimited model calls. Separate Monte Carlo variation from fundamentally different structural futures.

Rank strategic paths by robustness, regret, downside exposure, reversibility and option value. Assign probabilities only where calibration is defensible; otherwise provide ranges and stress cases. Use backtesting and proper scoring such as Brier/log score for resolved events. Never count synthetic scenarios as accurate predictions. Long horizons widen uncertainty and should trigger flexible investments, not false precision.

Forecast time horizons align with the knowledge architecture's year 1/3/5/10 views. Future memory stores scenarios separately from factual history. Revision preserves original predictions and resolution criteria so accuracy cannot be improved by rewriting the past. Emerging market and threat signals open research tasks before any production action.


---

# Autonomous adaptation and civilization simulation

## Organization optimization
Represent departments, swarms, agents, tasks, responsibilities and communication as a versioned organizational graph. Measure queue wait, handoff failures, duplicated work, unresolved disagreement, skill gaps, user outcomes and spend. Propose department creation, merger, split, retirement or routing change with measurable goals and a counterfactual baseline.

Simulate first. Shadow new routing while old ownership remains authoritative. Canary on a bounded project cohort, drain leases, transfer knowledge references and verify responsibility coverage. Every task has one accountable owner even when many experts collaborate. Reporting reorganization does not change access policy; security boundaries remain explicit. Roll back if handoff error, starvation or quality worsens. Avoid oscillation using minimum evaluation windows, hysteresis and cooldowns.

## Agent economy
Knowledge credits advise exploration priority inside already authorized and reserved budgets; they do not create or enlarge spending authority. Trust and influence reflect independently measured contributions; they cannot purchase credentials, vote slots or constitutional authority. Use decay and domain specificity where evidence becomes stale. Penalize gaming, fabricated discoveries and reciprocal-review rings. Preserve baseline opportunity for new specialists so incumbents do not monopolize all tasks.

Authority is assigned by policy and accountable ownership, not accumulated popularity. Credits are internal accounting, not money or financial assets. Cost ledgers charge model, worker, storage and review resources to tenant and experiment. Cooperation rewards reused verified work and reduced total cost, not message volume.

## Civilization model
An agent-based simulator models bounded populations, skills, knowledge exchange, leadership rules, research investment, competition for tasks and collaboration. Explicitly parameterize cooperation incentives, learning limits, failure correlations, communication delay and resource scarcity. Compare centralized, federated and dynamic task-routing policies under the same workload.

Track welfare proxies: verified task outcomes, user benefit, fairness of task allocation, concentration, resilience, spend and unresolved harm. Emergent behavior in a simulator is a hypothesis about coordination, not evidence of consciousness or actual organizational superiority. No simulator can grant agents control of real organizations. Simulated policies must pass independent runtime tests and authorized canaries.

Stress tests include faction formation, collusion, misleading reputation, runaway spawning, shared-provider failure, privacy leakage and expert loss. Isolation limits contagion; independent review reduces correlated failure. Run destructive scenarios only in simulation. The resulting artifact is a recommendation with evidence and uncertainty, not an unreviewable command.


---

# Omni Evolution Score, Omega Protocol and decades of growth

## Scorecard
| Dimension | Evidence-based measure |
|---|---|
| Learning rate | Time/cost to sustained benchmark improvement |
| Knowledge growth | New verified, accessible coverage minus invalidations |
| Innovation rate | Validated adopted value per research budget |
| Prediction accuracy | Calibration and proper score on resolved forecasts |
| Automation growth | Verified useful automation with stable harm rate |
| Agent growth | Qualified capacity per resource unit, not instance count |
| Resolution speed | Matched-cohort time to durable fix with recurrence check |
| Discovery speed | Time to independently verified relevant finding |
| Adaptability | Recovery to competency after controlled change |
| Future readiness | Tested options and resilience against declared scenarios |

Store raw metric, units, cohort, denominator, uncertainty, baseline, evaluator version and observation interval. Unknown evidence stays unknown. Normalize to fixed versioned anchors; retain historical raw series when anchors change. Publish coverage alongside scores. A summary index may use declared weights only where dimensions are sufficiently measured; critical safety failure invalidates the summary rather than being averaged away. Raw agent count and graph size are operational counters, not improvement rewards.

## Omega governing protocol
Protect users through explicit accountability, understandable control and appropriate owner consent. Protect data through least privilege, tenant isolation, residency, provenance and enforceable deletion. Protect systems through bounded execution, independent evaluation, reversible releases and emergency suspension. Promote truth through evidence, uncertainty and visible correction. Promote learning and innovation through permitted experimentation. Promote transparency and collaboration through inspectable decisions and interoperable contracts.

These rules are versioned policy controlled by accountable human governance. Evolution agents cannot rewrite them, disable audits, expand their own grants or remove stop controls. Policy changes require documented rationale, independent review and owner approval appropriate to scope. Runtime enforcement is outside candidate-controlled code. The release controller fails closed when policy/evidence is missing or signatures do not verify.

A emergency stop cancels new claims and incrementally fences active side effects. Preserve evidence, revoke compromised grants, roll back compatible releases and initiate incident response. Recovery requires root-cause evidence and a scoped restart; do not blindly retry a compromised loop. Audit override identity, scope, reason and expiry. NIST AI RMF informs risk management; this design is not a certification.

## Decades of stewardship
Use open export formats, durable identifiers, migration registries, algorithm agility and key rotation. Support provider replacement, model retirement and tool deprecation. Maintain a compatibility matrix across AgentOS, genomes, schema, prompts, models and policy. Migrations are resumable, idempotent, dual-read where necessary and verified before old paths retire.

Indefinite memory is constrained by rights, deletion, cost and policy. Define retention classes, archive retrieval objectives and legal holds without promising literal irreversible remembrance. Tenant exit exports authorized evidence, releases and decisions; remove inaccessible data from retrieval and propagation. Preserve minimized audit records only where permitted.

Use a steward-owned operating budget, succession and disaster recovery plan. Test backup restoration and release reconstruction from signed manifests. Periodically reassess score gaming, research usefulness and long-term environmental/resource cost. Continuous improvement includes choosing to pause, retire or simplify capabilities. Sustainable evolution is measured by lasting user value and reliability, not autonomous expansion alone.


---

# Contracts, scaling and implementation sequence

## APIs and events
REST resources: /evolution/candidates, /genomes, /experiments, /discoveries, /scenarios, /releases and /scores. POST uses an idempotency key; writes use expected_version. GET applies current tenant and object permissions, including historical versions. Long-running commands return a workflow ID. Event envelope: event_id, tenant_id, cell_id, entity_id, entity_version, event_type, occurred_at, schema_version, trace_id, causation_id, payload_hash and source pointer. Consumers deduplicate event_id and reject stale fencing epochs.

Use events evidence.accepted, candidate.proposed, evaluation.completed, release.canary_started, release.promoted, release.rolled_back, discovery.withdrawn and ontology.generation_ready. Delivery is at least once; state transitions and transactional outbox provide effective idempotence. Dead letters remain scoped and inspected. WebSocket/SSE dashboards expose filtered status, spend, confidence, lineage and emergency controls, never private model reasoning.

## Storage reference
Authoritative tables: evolution_candidates(tenant,id,version,state,baseline_hash,candidate_hash,policy_version,budget,owner); genome_versions(tenant,id,version,hash,manifest_uri); evaluations(tenant,id,candidate_id,dataset_hash,evaluator_hash,metrics_uri,signature); releases(tenant,id,scope,genome_hash,previous_release,state,fence); experiments(tenant,id,plan_hash,assignment_uri,state); observations(tenant,id,source_uri,rights,classification,outcome); derivations(tenant,parent,child); withdrawals(tenant,id,source_id,status); evolution_metrics(tenant,dimension,cohort,interval,raw,coverage). Composite tenant keys and row-level policy are mandatory; object access is enforced separately. Large artifacts are immutable object blobs with content hashes.

## Scale and reliability
Partition by tenant/home cell and bounded project shard. Schedule millions of logical agents as inactive manifests; only leased tasks consume workers. Fair queues impose per-tenant model, sandbox, research and storage limits. Deduplicate experiment inputs; cache only within allowed scope and revision. Batch offline evaluations, prioritize security withdrawals and reserve incident capacity. Hierarchical aggregation avoids a global all-agent conversation.

Target capacity inherits the production architecture; it is not achieved by this specification. Benchmark ingestion, evaluation throughput, derived-index lag, release-controller latency and withdrawal convergence. Set measured SLOs per class before broad launch. Metrics include queue age, evaluator disagreement, rollback rate, harm rate, cost per validated improvement and stale applicability. Compare costs to benefit before spawning new capacity.

## Implementation gates
1. Evidence foundation: provenance, rights, versioned outcomes, deletion traversal, fixed baselines; prove cross-tenant denial and deterministic replay.
2. Offline evolution: prompt/workflow candidates and independent evaluation with signed artifacts; prove tampering rejection, contamination isolation and failed-candidate retention.
3. Authorized canaries: narrow release scopes, quotas, last-known-good rollback and stop controls; prove stale-lease denial, side-effect compensation and outage recovery.
4. Collective learning: consented libraries and context-specific trait transfer; prove withdrawal propagation and no trust/credential cloning.
5. Research/invention/futures: reproducible dossiers, scenario manifests and resolution scoring; prove synthetic/observed separation and spend enforcement.
6. Adaptive organization: shadow routing, topology simulation and controlled migration; prove ownership coverage, no access expansion and rollback.
7. Long-term stewardship: export, compatibility migrations, restore drills and governance succession; prove recovery and lawful retention behavior.

The accompanying reference guard tests validate design invariants using fixtures. They do not implement provider execution, independent evaluation services, microVM isolation or production self-healing. Track those in the existing UNFINISHED-WORK folder; architecture completion does not close them. Prompt 8 remains reserved for the user's next specification.
