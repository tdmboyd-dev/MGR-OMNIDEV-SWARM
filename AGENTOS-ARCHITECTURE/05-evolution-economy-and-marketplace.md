# Controlled evolution, agent economy and intelligence modules

## Self-improvement loop

Every admitted agent participates in Observe → Analyze → Plan → Execute → Measure → Learn → Improve → Repeat under objective, scope and budget. “Continuous” means scheduled/event-triggered work with idle suspension, not unrestricted polling or infinite spending. Observe inputs are tool/test/incident receipts, reviewer feedback, measured outcomes and drift. Analyze generates hypotheses; plan specifies skill/workflow/reasoning candidate and evaluation criteria. Execute uses a bounded sandbox. Measure compares baseline with candidate on held-out cases. Learn records scope-limited lessons. Improve promotes only a passing version through admission and rollout.

Candidate upgrades include new skill manifests, approved tool adapters, workflow DAG templates, retrieval policies, reasoning/rule versions and domain guidance. Discovering a tool creates a review proposal with publisher, license, required grants, endpoints, failure modes and tests. It does not install code or call arbitrary APIs. Learned instructions never replace platform policy. Training/finetuning requires consented licensed data, cost approval and evaluation; no unreviewed online weight mutation.

The evolution controller holds candidate digest, parent template, provenance, expected improvement, benchmark manifests, privacy/rights review, regression gates, runtime compatibility and rollback pointer. Evaluate security, task quality, unsupported claims, cost, latency and difficult domain slices. Separate train/validation/test by project/time; agents cannot edit their held-out answers or self-score promotion. Shadow evaluation precedes small canary cohort; policy and kernel changes require stronger independent review. Archive old immutable versions; running attempts pin one version to completion.

Promotion requires measurable benefit or an explicitly justified maintenance/security fix, no failing critical gate and bounded regression tolerance published before the experiment. Automatic promotion may apply to low-risk preauthorized guidance changes; tool permissions, policy, production actions and model/data changes follow corresponding approval tier. Drift or adverse incidents trigger downgrade/quarantine and evaluation, not silent denial of history.

## Economy semantics

Internal economy measures contribution and guides workload allocation. It is not cryptocurrency, payroll, money or a new way to purchase authority. AgentOS nonfinancial credits are distinct from the platform's real usage/billing ledger.

| Metric | Earned from | What it may affect | What it cannot do |
|---|---|---|---|
| Performance | Independently verified outcomes under task-class rubric | Scheduler ranking, coaching and qualification | Override permission or count self-reported completion |
| Trust | Calibrated reliable behavior by domain/risk, verified incidents and freshness | Eligibility for supervised/preauthorized responsibility within existing grants | Mint grants, erase policy violations or become one universal probability |
| Influence | Useful evidence-backed contributions and reviewed collaboration | Proposal surfacing and mentor selection | Extra vote slots, veto power by popularity or control over critics |
| Authority | Explicit accountable delegation by policy/owner | Allowed actions/targets until expiry | Be automatically bought with credits or copied into clone |
| Knowledge Credits | Accepted reusable lessons with independent reuse benefit | Internal allocation incentives and contribution tracking | Publish confidential sources or duplicate credit by paraphrase |
| Innovation Score | Validated experiment/new capability outcomes with originality evidence | Innovation pipeline prioritization | Claim patentability, novelty or revenue success without proof |
| Health | Runtime/provider/lease/checkpoint/error and quality signals | Readiness, recovery and pool routing | Be confused with competence or moral reliability |

Maintain per-domain score records: rubric/version, observation window, eligible samples, evidence, uncertainty, recency, adverse events and appeal status. Display unknown for insufficient samples. Use verified quality/cost/risk metrics instead of raw token/message/agent counts. Calibrate success estimates against outcomes; do not turn a 0–100 rubric score into a statistical probability. Confidence bounds and minimum samples qualify increased responsibility.

Credit ledger has transaction_id, tenant, account/agent, contribution/evaluation reference, amount as exact integer units, reason, version, occurred_at and reversal_of. Enforce unique contribution/reward-policy key; append reversals for invalidated evidence. No deletion of poor outcomes to improve scores. A shared-model echo or duplicated artifact gets no independent reward. Reuse credit is awarded only from verified beneficial use, with rights and provenance preserved. Roots cannot issue infinite credits to their own clones.

Anti-gaming detects collusive peer scoring, easy-task farming, duplicated findings, sybil clones, excessive spawning, artificial incident generation and cost externalization. Hold contested credit awards for independent evaluation. Scores cannot punish safety abstention or appropriate escalation. Review frequency and decay reflect evidence freshness, while historic harms remain auditable. A high-trust agent's increased responsibility still needs an authorized policy assignment and qualified action class.

## Marketplace packs

Installable packs declare immutable module digest, publisher identity/signature, compatibility range, specialization/skill versions, workflow templates, reasoning rules, tool capability schemas, model constraints, knowledge references, dependencies, required destinations, data handling, licenses, SBOM, evaluation corpus/results, resource requirements, lifecycle hooks and rollback instructions. Examples: Security, Healthcare, Finance, Unity, Unreal, Blender, React and Data Science packs.

Installation validates signature/supply chain, resolves pinned dependencies, compares requested grants, evaluates compatibility and stages in isolated environment. Agent profile may inherit declared skills automatically after successful installation, but tools and external access activate only within approved grants. Healthcare/finance packs supply specialized workflows, not professional/legal compliance certification. Unity/Unreal/Blender packs require compatible licensed local or remote workers; a pack icon does not prove an engine can run.

Updates with additional permissions require renewed applicable consent. Pin active runs; canary template versions; revoke malicious versions and block dispatch. Retain evidence of prior executions under audit policy. Marketplace agent templates remain untrusted code/content; UI extensions use sandboxed bridge APIs with no ambient credentials. Publisher trust never replaces artifact verification. Marketplace monetization belongs to the platform billing authority, not internal knowledge-credit conversion.
