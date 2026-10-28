# Final Omniscient Audit — additions before consolidation

“Omniscient” is the requested review name, not a claim of complete knowledge. The following additions challenge the existing design and are mandatory integration decisions for this version. Unknown unknowns remain an ongoing discovery process.

## A01 — Capability certification envelope

**Blind spot:** A platform can look universal while supporting only one language and test command.

**Integrated design:** Publish per connector/language/model/tool supported versions, permitted operations, parser coverage, evaluation cohort and expiry. Unsupported requests become explicit gaps.

**Accountable role:** QA platform lead. **Acceptance:** Reference unsupported cases fail without silent fallback.

## A02 — Evidence trust root

**Blind spot:** A signed report can still be signed by the same compromised worker that created the artifact.

**Integrated design:** Separate workload identity, attestation verification, artifact hashing and evaluation identity. Bind evidence to exact attempt, candidate, image and test manifest.

**Accountable role:** Security lead. **Acceptance:** Forged/stale/mismatched reports cannot authorize effects.

## A03 — Data withdrawal convergence

**Blind spot:** Deleting a source can leave summaries, vectors, caches, backups and model weights carrying it.

**Integrated design:** Use a derivation registry, immediate deny tombstones, bounded purge workflow, subscriber receipts and restore-time deletion replay. Training contracts declare model withdrawal strategy.

**Accountable role:** Data lead. **Acceptance:** Deleted material is denied immediately; purge convergence and restored-copy denial are measured.

## A04 — Control-plane bootstrap recovery

**Blind spot:** Policy, KMS and directory services can become mutually dependent during a total recovery.

**Integrated design:** Maintain independently protected recovery identities, ordered restore runbooks, signed last-known-good manifests and tested key recovery.

**Accountable role:** SRE lead. **Acceptance:** Cold-region restore succeeds without relying on the failed control plane.

## A05 — Evaluator independence and capture

**Blind spot:** Millions of agents can manufacture consensus through cloned reviewers or a poisoned grader.

**Integrated design:** Assign independent role slots; freeze evaluator/dataset versions; measure lineage/provider correlation; keep adversarial challenge sets and human calibration.

**Accountable role:** Research lead. **Acceptance:** Clone votes do not increase effective independence; evaluator tampering is rejected.

## A06 — Human accountability and appeals

**Blind spot:** Autonomous mistakes can leave no person responsible or no correction channel.

**Integrated design:** Every action class has accountable owner, appeal/correction workflow, understandable evidence and reversible authority. Design workforce/privacy impact review.

**Accountable role:** Product lead. **Acceptance:** A user can challenge a finding, stop a run and track resolution without exposing hidden data.

## A07 — Supply-chain build provenance

**Blind spot:** Package scripts and mutable images can subvert perfectly reviewed source.

**Integrated design:** Pin build inputs, attest builder and materials, quarantine imports, isolate approved mirrors and verify provenance before release.

**Accountable role:** Security lead. **Acceptance:** Poisoned image/package/attestation fails admission.

## A08 — Support and incident access

**Blind spot:** Enterprise isolation can be bypassed by support tooling and telemetry.

**Integrated design:** Use just-in-time scoped support sessions with owner authorization where required, dual review for sensitive access and redacted observability.

**Accountable role:** Enterprise lead. **Acceptance:** Support access is denied without valid ticket/scope and appears in audit.

## A09 — Independent economy and demand model

**Blind spot:** ARR targets can hide free-user inference, failed-run costs, working capital and consumption workload.

**Integrated design:** Link paid execution units to actual workload, include quality-adjusted successful-task margin, customer acquisition capacity, cash collection and liabilities.

**Accountable role:** Finance lead. **Acceptance:** Overage workload raises costs; cash and earned revenue reconcile separately.

## A10 — Competitive outcome benchmark

**Blind spot:** Feature count does not show a reason to switch from established tools.

**Integrated design:** Measure time to validated repair, recurrence, audit preparation, context reconstruction and total cost on matched workflows.

**Accountable role:** Founder. **Acceptance:** A paid pilot demonstrates incremental value beyond an existing coding agent.

## A11 — Blast-radius containment of learning

**Blind spot:** A popular but incorrect lesson can propagate globally faster than it is corrected.

**Integrated design:** Limit lesson rollout by scope and rate, track affected releases, quarantine disputed knowledge and propagate signed withdrawal.

**Accountable role:** Evolution lead. **Acceptance:** Poisoned lesson cannot reach every tenant before detection; rollback is demonstrated.

## A12 — Cross-cell budget conservation

**Blind spot:** Parent and child workflows in separate regions can reserve the same remaining spend.

**Integrated design:** Keep a root reservation authority; transfer signed allocations with durable debit before credit and reconcile uncertain handoff.

**Accountable role:** Runtime lead. **Acceptance:** Network partition cannot multiply available funds or release unresolved liability.

## A13 — Residency-local placement authority

**Blind spot:** A global quorum can violate residency or block independent regional operation.

**Integrated design:** Separate global non-content locator from per-residency ownership authority. Transfer across boundaries only under explicit policy with fencing.

**Accountable role:** Infrastructure lead. **Acceptance:** Loss of another residency domain does not grant or revoke local authority incorrectly.

## A14 — Disconnected and local mode contract

**Blind spot:** Offline enterprise or desktop features can imply stale privileged authority.

**Integrated design:** Declare read-only cached mode by default; scoped expiring offline grants and local budgets are opt-in; reconcile conflicts on reconnect.

**Accountable role:** Enterprise lead. **Acceptance:** Expired/offline credentials cannot authorize cloud effects.

## A15 — Licensed content and export feasibility

**Blind spot:** 3D/CAD datasets, proprietary sources and market feeds may forbid the proposed processing.

**Integrated design:** Registry for code/model/dataset/content/tool licenses and permitted inference/training/export. Unsupported licensed runtime stays unavailable.

**Accountable role:** Compliance lead. **Acceptance:** Artifact export and training check rights independently.

## A16 — Long-lived compatibility and ownership succession

**Blind spot:** Decades of jobs can outlive vendors, signatures and maintainers.

**Integrated design:** Contract deprecation windows, migration replay, cryptographic inventory, portable exports, key rotation and successor stewardship.

**Accountable role:** Architecture lead. **Acceptance:** Historical releases can be reconstructed and verified after provider replacement.

## A17 — Customer concentration and provider collapse

**Blind spot:** One model, cloud, customer or marketplace publisher can dominate economics and uptime.

**Integrated design:** Measure concentration; maintain tested alternatives, cash stress scenarios, model outage routing and export pathways.

**Accountable role:** CEO. **Acceptance:** Loss of largest provider/customer has a bounded documented response.

## A18 — Experiment interference and causal claims

**Blind spot:** Concurrent repairs and business experiments confound apparent improvements.

**Integrated design:** Track assignment units, simultaneous interventions, treatment provenance, holdouts and outcomes; suspend causal claims when interference is unresolved.

**Accountable role:** Research lead. **Acceptance:** Revenue/latency attribution reports known confounders.

## A19 — Operational readiness of the company

**Blind spot:** A technical platform still fails without support, procurement, contracts and escalation coverage.

**Integrated design:** Create trust center, customer onboarding/offboarding, vendor assessment, insurance/procurement review, incident communications and support staffing.

**Accountable role:** Operations lead. **Acceptance:** A real pilot rehearses escalation, export, billing dispute and incident notification.

## A20 — Option-based future readiness

**Blind spot:** No design is future-proof against AGI or paradigm shifts.

**Integrated design:** Fund reversible options with invalidation triggers; test model/tool/compiler/schema replacement instead of predicting inevitable dominance.

**Accountable role:** Strategy lead. **Acceptance:** Each future scenario maps to a reversible experiment and stop rule.
