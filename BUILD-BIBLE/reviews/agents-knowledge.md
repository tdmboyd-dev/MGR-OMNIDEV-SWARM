# Hostile review: AgentOS, knowledge, memory and evolution

Review date: 2026-10-09. Scope: the entire consolidated AgentOS, Knowledge and Evolution architectures, plus the AgentOS lifecycle contract and evolution reference guard. This is a design audit, not a claim that deployed services were penetrated, benchmarked or independently certified. The reviewer roles below are analytical perspectives, not a claim that a separately staffed external research organization reviewed the product.

## Source inventory and authority

- **A:** `AGENTOS-ARCHITECTURE/FULL-AGENTOS-ARCHITECTURE.md`, all 500 lines, including operating model, lifecycle, scheduler, communications, debate, economy, modules, incidents, scale, APIs and qualification queue.
- **K:** `KNOWLEDGE-ARCHITECTURE/FULL-KNOWLEDGE-ARCHITECTURE.md`, all 459 lines, including ontology, eight memory layers, decisions, temporal semantics, ingestion, retrieval, gaps, scale, security, APIs and research.
- **E:** `EVOLUTION-ARCHITECTURE/FULL-EVOLUTION-ARCHITECTURE.md`, all 252 lines, including kernel, learning, genetics, propagation, experiments, research, scenarios, adaptation, Omega and implementation gates.
- **AL:** `AGENTOS-ARCHITECTURE/contracts/lifecycle.json`, complete contract.
- **EG:** `EVOLUTION-ARCHITECTURE/contracts/release-guard.mjs`, complete reference implementation.
- **EC:** `EVOLUTION-ARCHITECTURE/contracts/evolution-contracts.json`, complete catalog.

References use source identifier plus exact section heading so an engineer can locate the decision without trusting a paraphrase. Earlier packages remain historical specifications; the final Build Bible must establish precedence where a resolution here supersedes their wording.

## Verdict and strengths that must survive consolidation

The design has a credible separation between principal, model and worker; journal authority and derived projections; evidence and generated answers; permissions and competence; lifecycle and activities; current reality and forecast scenarios. It rejects uncontrolled privilege cloning, raw cross-tenant learning, majority-vote truth, universal-login inference claims and infinite resource use. These are foundational decisions, not optional enterprise decorations.

The principal weakness is that many decisive safety guarantees remain prose or fixture booleans. Millions-scale coordination and useful self-evolution are not established by a manifest, reference guard or documentation check. The final blueprint should preserve the ambition while making qualified capability classes, transactional protocols, measured release criteria, revocation convergence and accountable owners executable. The following findings are design gaps unless explicitly marked contradiction or implementation blocker. No proposed resolution marks a production task complete.

## Contradictions and precedence resolutions

### AK-01 — lifecycle table, diagram and learning execution disagree

**Sources:** A / “Required lifecycle states”; AL / `transitions` and `activity_allowed_in`.

The prose/table and JSON permit Created→Archived, Learning→Dormant, Active→Learning and Active→Archived, while the diagram omits these edges. More importantly, Learning requires an approved training/evaluation objective, but AL allows execution activities only in Active. An engineer following that contract can prevent a Learning principal from doing the very work needed to qualify.

**Resolution:** durable Learning permits only learning/evaluation activity classes under separate narrow grants. Busy/Reviewing/Collaborating remain display activities; their eligibility must include lifecycle plus task class, not an unconditional Active-only list. Training orchestration may alternatively be performed by an Active evaluator on an inactive candidate principal; select and document that pattern per learning mode. Generate diagram/table/API transitions from a canonical transition-and-guard registry. Every permitted edge needs entry, exit, effects, compensation and quiescence requirements.

**Gate:** enumerate all allowed and forbidden transitions; execute learning qualification without granting ordinary production work; prove concurrent retirement blocks new learning dispatch; test diagram/contract parity.

### AK-02 — global pattern admission is stronger than the propagation reference guard

**Sources:** K / “Write, consolidate, promote and correct”; E / “Libraries”; EG / `canPropagate`.

The documented policy requires source rights, confidentiality review, current object access, recipient purpose, opt-in where applicable and withdrawal lineage. The helper accepts same-tenant transfer solely from `rightsCurrent`, or cross-tenant transfer from two booleans. Same-tenant is not the same as same-project/classification/purpose authorization. A global-consent flag is not an approved publication receipt or permission to send to any recipient.

**Resolution:** treat the helper strictly as an incomplete illustrative fixture. Production propagation requires a signed publication/admission receipt, current source-access evaluation, destination scope/purpose policy, restricted lineage compatibility and withdrawal generation. Authorization must run on the receiving side too. Retain raw-source restrictions even when an artifact is generalized.

**Gate:** deny same-tenant cross-project secrets; deny withdrawn patterns despite stale consent; deny approved-publication reuse for an incompatible purpose; prove denied content never enters receiving model context.

### AK-03 — credits cannot fund actual exploration independently of money

**Sources:** A / “Economy semantics”; E / “Agent economy”.

A correctly states nonfinancial credits are not real usage/billing authority. E says credits fund exploration inside fixed budgets. That wording can be implemented as an exchange rate that authorizes spend through reputation.

**Resolution:** credits influence allocation priority for already authorized and reserved budget; they never create, increase or transfer financial entitlement. A policy-controlled budget allocator may consider credit as one advisory input. Exact money reservations and tenant spending caps remain separate authoritative ledgers.

**Gate:** arbitrarily inflate credits and verify no grant, vote slot, model call or spend cap increases; show allocation receipt references a pre-existing money reservation.

### AK-04 — assertions need one canonical modality taxonomy

**Sources:** K / “Provenance and epistemic states”; E / “Provenance and contradictions”; K / “Answer contract”.

K uses observed/human_asserted/inferred/predicted; E uses observed/inferred/simulated/forecast; answer labels additionally include recorded_decision/hypothesis. These are related concepts but not interchangeable schema enumerations.

**Resolution:** separate epistemic modality (observation, human assertion, inference, hypothesis, forecast), evidence environment (real, sandbox-real, synthetic-simulation), and admission lifecycle. `recorded_decision` is an answer presentation type sourced from an accepted decision. Map old enumerations through explicit versioned adapters. Synthetic evidence never becomes a real observation through migration.

**Gate:** round-trip all old examples; reject simulated forecasts from factual-current projections; verify exact timestamps and original modality survive export/import.

## Supreme swarm hostile review

### AK-05 — cross-cell budget and sponsorship transfers lack a crash-safe protocol

**Sources:** A / “Dynamic swarm graph”, “Scheduler policy”, “Capacity and partitioning”.

Exactly one financial root and conserved budgets are correct requirements. The documents do not define how a delegating cell reserves and transfers budget when the receiving cell accepts but the acknowledgement is lost. Ordinary outbox delivery alone cannot decide whether money may be refunded.

**Resolution:** allocate unique transfer IDs and non-overlapping child reservation ceilings. Sender records prepared reservation, receiver records accepted allocation, sender records committed delegation; duplicates converge to the same receipt. Until reconciliation resolves unknown acceptance, funds remain unavailable to new work. Refund only after receiver proves cancellation/fence or no acceptance. The receiving cell cannot enlarge the root budget. This is an application protocol with ledger reconciliation, not a claim of universal distributed exactly-once delivery.

**Gate:** fault-inject each boundary, duplicate requests, stale epochs and lost acknowledgements; assert total settled plus reserved usage never exceeds authorized root ceiling; assert one charge root per attempt.

### AK-06 — review independence is necessary but lacks an enforceable dependency model

**Sources:** A / “Debate record and roles”, “Bounded debate algorithm”; E / “Experimental contract”.

Different identities do not establish independence. Agents sharing prompts, weights, training data, upstream summaries and incentives can produce strongly correlated errors. A role-slot rule prevents vote flooding but does not make four correlated reviewers a security argument.

**Resolution:** record reviewer dependency manifests: author involvement, template lineage, model family/revision, retrieval evidence origin, evaluation ownership and financial incentives. Maintain action-class independence policies with qualified deterministic checks and external evidence where possible. Require at least one materially different verification mechanism for high-risk changes; inability to satisfy the policy yields inconclusive/escalated. Never multiply confidence by reviewer count without a measured correlation model.

**Gate:** cloned reviewers cannot fill independent slots; test a shared misleading source; require a compiler/test/control check to refute a unanimous model error; display unqualified independence honestly.

### AK-07 — fairness policy needs starvation and incident-abuse bounds

**Sources:** A / “Scheduler policy”, “Incident admission and emergency swarms”; E / “Organization optimization”.

Weighted deficit round robin and aging are starting mechanisms. They do not yet define the service class, maximum queue delay objective, incident admission rate or behavior when an abusive tenant continually emits urgent objectives. Infinite incident preemption can starve ordinary tenants.

**Resolution:** publish per-class quota, admission and borrowing rules; reserve bounded incident capacity; apply authenticated severity corroboration and per-tenant incident ceilings. Scheduling fairness is measured in resource-normalized work, not task count. Preserve nonpreemptable safety reconciliation capacity. Expose rejected/infeasible deadlines rather than disguising them as slow agents.

**Gate:** mixed short/long/GPU/model workloads, hot tenant, fabricated incidents and provider outage; measure starvation, cost fairness, queue delay and protected recovery progress.

### AK-08 — topology optimization can violate accountability during a live handoff

**Sources:** A / “Fractal operations”; E / “Organization optimization”.

Draining and singular ownership are stated, but task ownership, review ownership, message subscriptions and financial allocation can transition at different times. A late accepted result after a department merge can have no authorized reviewer or two conflicting owners.

**Resolution:** topology migration plan includes source/destination generation, ownership transfer points, frozen tasks, reviewer continuity, allocation references and rollback. Use fenced ownership compare-and-swap per task; reorganization status becomes complete only when orphan/duplicate ownership checks pass. Keep dissent and appeal handlers independent of the reorganized subject.

**Gate:** late result, active review, cancelled transfer and rollback during handoff; every task has exactly one effective owner, no duplicated authority and a valid reviewer path.

### AK-09 — marketplace skill inheritance must not imply verified competence

**Sources:** A / “Marketplace packs”; E / “Selection”, “Autonomous creation workflow”.

A says agents inherit declared skills automatically after successful installation. A signature and compatible install do not establish competence in the customer's version, workload or jurisdiction.

**Resolution:** distinguish declared, installed, evaluated and production-qualified skills. Import claims and publisher benchmarks with provenance; only local qualification grants eligibility for the task/environment/risk class. Revocation removes dispatch eligibility first; draining and receipt reconciliation remain explicit.

**Gate:** install a signed but incorrect skill; verify it cannot execute privileged tasks until customer-environment qualification; test dependency revocation on pinned in-flight work.

## Knowledge and memory hostile review

### AK-10 — supported parser and inference envelope must become a product contract

**Sources:** K / “Collection pipeline”, “Relationship semantics and constraints”, “Migration from current app”.

The ontology spans virtually everything, but parsers and collectors do not. Without an explicit capability matrix, customers will interpret a beautiful graph as comprehensive mapping even when reflection, generated code, macros, dynamic imports, databases or proprietary tools are unobserved.

**Resolution:** maintain a connector/language/version/analysis-mode matrix stating supported syntax, evidence method, limits, required execution, quality slices and unavailable domains. Every graph/map and health score carries that matrix revision and coverage. Do not advertise complete vulnerability analysis from regex observations. Surface unsound and incomplete static analysis separately.

**Gate:** representative reflection/generated-code/polyglot repositories; unsupported syntax cannot silently disappear or produce confirmed missing-dependency findings; product copy matches actual qualified scope.

### AK-11 — withdrawal and retraction require a convergence contract

**Sources:** K / “Longevity, forgetting and recovery”, “Consistency and recovery”; E / “Libraries”, “Decades of stewardship”.

The design correctly follows lineage but does not quantify the period in which dependent summaries, exports, cold indexes or trained variants remain usable. At billions of relationships, complete descendant recomputation cannot be instantaneous.

**Resolution:** maintain a small authoritative denied-source/withdrawal generation checked at evidence assembly and release dispatch. Immediately block use of affected references; background purge tracks stores, caches, exports, training manifests and required third-party requests with receipts. Set a measurable deny-enforcement target and separate physical cleanup objective per storage class. Model retirement/retraining obligations are explicit before any training on revocable data. Never promise deleting a source can erase externally downloaded copies.

**Gate:** inject withdrawal during query, cached answer, index rebuild, forecast generation and backup restore; no subsequent authorized delivery uses revoked content; report residual external obligations.

### AK-12 — derivation invalidation can become a graph-wide denial-of-service

**Sources:** K / “Scaling, security, resilience and production acceptance” / “Billion-relationship scaling”; E / “Collective intelligence and graph evolution”.

A widely used erroneous lesson or public dependency may have enormous descendant fanout. Immediate recomputation competes with incident work, while serving stale derivations can enable unsafe effects.

**Resolution:** priority lanes for authorization invalidation, critical safety retraction and ordinary freshness; compact dependency manifests; lazy validity checking plus bounded recompute. Pin effect prerequisites to fresh admitted evidence. Rate-limit adversarial revise/retract churn without delaying access denial. Isolate blast radius by library release and consumer cohort.

**Gate:** revoke a million-dependent pattern under load; prove protected operations fail closed, unaffected tenants remain available and progress/lag metrics stay truthful.

### AK-13 — identity merge and split need downstream revision semantics

**Sources:** K / “Canonical objects”, “Relationship semantics and constraints”, “Knowledge APIs”.

Reversible mappings are specified but not how accepted decisions, citation selectors, external references and task targets behave after a split. Repointing all historical references can falsify which entity an earlier decision targeted.

**Resolution:** identity mappings are temporal assertions; historic references remain bound to original IDs and versions. New current queries resolve through reviewed maps with ambiguity flags. Split impact plan invalidates affected projections and decision/task assumptions; an external-action target is always re-resolved and approved at exact revision.

**Gate:** wrong merge then split; historical answers retain original evidence; tasks targeting an ambiguous merged entity cannot execute; current citations resolve without misleading attribution.

### AK-14 — authorization-sensitive ranking needs side-channel qualification

**Sources:** K / “Authorization, confidentiality and abuse”, “Answer contract”.

The design names count/timing leakage but does not define the attacker model or tolerable behavioral differences. Ranking changes can disclose denied sources even if content and names are filtered.

**Resolution:** isolate private indexes/partitions by policy class where appropriate; derive candidate filters before search; avoid denominator/degree statistics influenced by denied entities. Publish a threat model for content, existence, timing and membership leakage. Use controlled presence/absence differential testing and bounded response shaping where appropriate; do not claim perfect timing noninterference on shared cloud hardware.

**Gate:** paired datasets differing only in denied objects; compare ranks, errors, counts, cursor behavior and timing distributions across tenants and revoked grants.

### AK-15 — answer-quality targets need risk-specific confidence and abstention policy

**Sources:** K / “Observability and evaluation”, “Answer contract”; A / “Economy semantics”.

98% citation support is not 98% answer correctness or safe remediation. Precision targets can be met by abstaining on every difficult question, while a zero observed leak in a finite corpus does not prove zero possible leaks.

**Resolution:** release reports include support correctness, completeness, contradiction detection, causal validity, useful coverage and abstention by domain/risk. Publish sample counts and uncertainty. High-impact recommendations require stronger executable evidence than informational answers. Treat no observed forbidden disclosure as the release-corpus result, not universal security proof.

**Gate:** answerable/unanswerable balanced corpus, rare severe risks, conflicting sources, citations that support only part of a claim and intentionally wrong causal links; measure useful coverage and harm jointly.

### AK-16 — decision memory needs authority expiration and reversal effects

**Sources:** K / “Decision schema and lifecycle”; A / “Bounded debate algorithm”.

An accepted historic decision remains searchable, but must not authorize a later action after source, target, regulation, budget or accountable signer changes.

**Resolution:** separate historic accepted-decision record from current effective policy/action authorization. Decision applicability has version, expiry/review date and dependency conditions. Reversal creates a new decision plus implementation obligations; do not silently erase the old rationale or assume reversal compensates deployed effects.

**Gate:** expired accepted decision, withdrawn approver authority, target revision change and superseded architecture; historical display remains accurate while new dispatch requires current authorization.

## Research and evolution hostile review

### AK-17 — release fixture booleans are not verifiable attestations

**Sources:** EG / `evaluatePromotion`; E / “Experimental contract”, “Autonomy boundary”.

The helper accepts caller-supplied booleans for independent evaluation, policy, rights and hard constraints. It does not verify signatures, expiry, evaluated candidate hash, cohort, metric thresholds, evaluator role or baseline still being deployed. Missing arrays can throw rather than deny. This is fine as a fixture but dangerous if promoted into production.

**Resolution:** production controller validates typed signed evaluation and policy receipts; exact candidate/baseline/evaluator/dataset hashes; freshness; scope; minimum cohort; prespecified improvement/noninferiority; authority epoch; compatibility and rollback readiness. All malformed inputs fail closed with typed error. Distinguish fixture checks from integration/security qualification in reports.

**Gate:** forged true flags, valid signature for different candidate, stale baseline, expired rights, absent arrays, NaN/overflow amounts and evaluator-role mismatch all deny without dispatch.

### AK-18 — continual search needs a portfolio-level false-discovery budget

**Sources:** E / “Experimental contract”, “Prompt system”, “Selection”.

Multiplicity control is mentioned, but millions of agents optimizing thousands of variants can repeatedly reuse test sets and promote noise. A passing individual test is insufficient when the selection process itself adaptively inspects outcomes.

**Resolution:** evaluation registry tracks candidate search family, data exposure and test-set reuse; hold independent sealed final-confirmation cohorts. Apply prespecified sequential/multiple-comparison methods suited to the metric and allocation unit. Require durable improvements on realistic matched cohorts and a stable reference, not only a recently weakened baseline. Maintain diversity and rare-slice regression gates.

**Gate:** null-effect candidate swarm cannot produce uncontrolled promotions; repeated holdout access is denied; benchmark overfit and regression on rare frameworks are detected.

### AK-19 — self-created expertise can launder an unverified vendor claim into a capability

**Sources:** E / “Permanent research division”, “Autonomous creation workflow”; A / “Marketplace packs”.

A paper, README or threat alert may be authentic yet wrong. Dossier generation and a specialist name can produce false institutional authority if the UI implies the subject is solved.

**Resolution:** research maturity states: sourced claim, independently corroborated, reproduced, environment-qualified, adopted and monitored. Research experts remain research-only until competence qualification. Preserve negative replication and source limitations; prioritize user need rather than novelty volume. Do not auto-install tool dependencies from source text.

**Gate:** fabricated method with credible source formatting, real paper with nonreproducing result and unsupported customer version; no production eligibility until appropriate tests pass.

### AK-20 — evolution rollback is not sufficient for delayed or irreversible harm

**Sources:** E / “Selection”, “Experimental contract”, “Omega governing protocol”; A / “Cancellation, preemption and recovery”.

Changing a prompt back cannot undo leaked data, a bad migration or an external message. Short canaries may miss delayed harm, customer churn and recurring failures.

**Resolution:** distinguish code/config rollback, external compensation, data repair and irrecoverable harm. Canary release plan includes attribution window, delayed monitoring, maximum blast radius and adverse-outcome ownership. Security fixes may have justified noninferiority exceptions but cannot weaken current grants. Uncertain effect outcomes remain reconciliation blockers.

**Gate:** delayed regression, leaked-secret event, irreversible migration and provider call that timed out after accepting a change; no false recovered status from restoring an old genome alone.

### AK-21 — genome compatibility solver needs explicit constraint semantics

**Sources:** E / “Genome record”, “Selection”; A / “Marketplace packs”.

Five module families and hashes support provenance, but no defined compatibility language decides conflicting decision rules, incompatible retrieval schemas, license combinations or tool behavior changes.

**Resolution:** manifest includes typed interface versions, environmental predicates, dependency ranges resolved to hashes, data-right constraints, policy requirements and resource envelope. Solver returns a reproducible compatibility proof or unsatisfied constraints; unresolved behavioral compatibility requires environment tests. Never resolve a security/policy conflict by weighted fitness.

**Gate:** contradictory decision modules, incompatible schema/embedding generation, withdrawn dependency and conflicting source rights fail admission; compatible recombination still undergoes behavior qualification.

### AK-22 — future exploration needs falsifiability and no hindsight rewriting

**Sources:** E / “Scenario engine”; K / “Bitemporal and scenario semantics”.

Many scenarios can appear insightful without ever being resolved. Strategic forecasts with vague outcomes cannot earn an accuracy score and can bias roadmaps through narrative confidence.

**Resolution:** each scoreable forecast freezes event definition, horizon, probability/range, source time, resolution source and missing-data rules. Separate scored probabilistic forecasts, structural stress scenarios and speculative inventions. Report coverage and unresolved forecasts. Robust/reversible decisions may be useful without assigning unreliable probabilities to decade-scale AGI or quantum futures.

**Gate:** backtest with source cutoffs; detect future-information leakage; unresolved predictions do not count as successes; original issued forecasts remain immutable.

### AK-23 — civilization metrics must reward user outcomes rather than organizational expansion

**Sources:** E / “Civilization model”, “Scorecard”, “Agent economy”; A / “Autonomous-company simulation”.

A complex agent economy may consume more coordination than it saves. Simulated emergence or rising agent population can be mistaken for platform value.

**Resolution:** compare dynamic swarms against single-agent, deterministic automation and human-assisted baselines at equivalent budgets. Retain swarm structure only where measured quality, cost, resilience or speed improves. Expose verified deliverables per dollar, user-benefit outcomes, dissent resolution, recurrence and concentration alongside internal scores. Simplification and safe retirement count as improvements.

**Gate:** matched workload experiments; coordination overhead and failure correlation included; raw agent/idea/message count cannot increase the headline score.

## Research, enterprise and founder attack perspectives

| Perspective | Strongest attack | Required response |
|---|---|---|
| Research reviewer | Benchmark optimization is being confused with general intelligent evolution | Domain-specific capability reports; independent held-out outcomes; explicit negative results |
| Swarm reviewer | Multi-agent organization multiplies correlated errors and spend | Qualified independence, bounded fanout, baseline comparison and one charge root |
| Knowledge reviewer | Impressive graph density can conceal incorrect or missing semantic links | Evidence provenance, language coverage, ambiguity and useful retrieval metrics |
| Enterprise buyer | Private source can leak through global patterns, exports or caches | Current-policy enforcement, approved publication, withdrawal receipts and tenant exit contract |
| Security reviewer | Candidate can falsify success through evaluator/control-plane access | Separate identities, signed immutable artifacts, kernel-enforced grants and tamper tests |
| Infrastructure reviewer | Cross-cell orchestration introduces uncertain reservations and orphaned authority | Fenced handoffs, transfer reconciliation, protected recovery capacity |
| Founder reviewer | Full agent economy/civilization simulation distracts from repository value | Stage advanced modules behind evidence that they improve accepted customer outcomes |
| Competitor reviewer | Agent counts, graphs and prompts are readily copied | Durable trusted workflow integration, licensed evidence, qualified outcomes and customer control; no claim of an uncopyable moat |

## Required build gates and backlog mappings

The final backlog should create implementation tasks for AK-01 through AK-23, linked to existing platform knowledge/AgentOS/evolution gaps rather than closing or duplicating them without dependency mapping. Each task needs accountable owner, deliverable, negative fixtures, dependencies, acceptance evidence and release tier.

**MVP blocking:** honest supported-scope matrix; source/evidence fidelity; authorized retrieval; provider and actual worker execution; current authorization at effect boundary; explicit uncertainty; precise money reservations; no synthetic results presented as live outcomes.

**Autonomous remediation blocking:** qualified runtime isolation; atomic claim/fence/cancel; independent effect verification; crash-safe external reconciliation; tested rollback/compensation; reviewer independence policy; source and target revision binding; rehearsed stop controls.

**Collective learning blocking:** reviewed rights/publication receipts; receiving-domain qualification; withdrawal generation enforcement; privacy leakage tests; reproducible lesson applicability; no implicit competence/permission inheritance.

**Self-evolution blocking:** signed candidate/baseline/evaluator receipts; protected benchmark registry; portfolio-level selection control; prespecified release thresholds; compatibility solver; delayed-harm monitoring; scope-bounded canary and restore rehearsal.

**Enterprise scale blocking:** measured mixed-workload fairness; hot-hub invalidation; cross-cell allocation/handoff fault tests; archive and deletion restore tests; authority-fenced failover; cost/error budgets measured at declared load.

## Final disposition

Retain the three packages as detailed supporting designs, with this review's precedence decisions incorporated into the final Build Bible. The blueprint should say what is specified, what exists in the current code, what is tested only by fixtures, and what still requires real operational evidence. The platform is not currently qualified as a millions-agent autonomous engineering organization or a continuously self-evolving civilization. It can become more capable through staged, measured, authorized releases; the architecture must make that path testable rather than rhetorical.
