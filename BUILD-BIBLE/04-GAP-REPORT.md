# Detailed gap report

Gaps are classified by design, contract, implementation, integration or verification. The accompanying hostile review dossiers provide source-level findings beyond this cross-domain register. All listed runtime tasks remain open.

| Gap | Existing foundation | Remaining gap | Required proof | Task |
|---|---|---|---|---|
| A01 Capability certification envelope | Relevant target design exists; implementation maturity varies | A platform can look universal while supporting only one language and test command. | Reference unsupported cases fail without silent fallback. | AUD-01 |
| A02 Evidence trust root | Relevant target design exists; implementation maturity varies | A signed report can still be signed by the same compromised worker that created the artifact. | Forged/stale/mismatched reports cannot authorize effects. | AUD-02 |
| A03 Data withdrawal convergence | Relevant target design exists; implementation maturity varies | Deleting a source can leave summaries, vectors, caches, backups and model weights carrying it. | Deleted material is denied immediately; purge convergence and restored-copy denial are measured. | AUD-03 |
| A04 Control-plane bootstrap recovery | Relevant target design exists; implementation maturity varies | Policy, KMS and directory services can become mutually dependent during a total recovery. | Cold-region restore succeeds without relying on the failed control plane. | AUD-04 |
| A05 Evaluator independence and capture | Relevant target design exists; implementation maturity varies | Millions of agents can manufacture consensus through cloned reviewers or a poisoned grader. | Clone votes do not increase effective independence; evaluator tampering is rejected. | AUD-05 |
| A06 Human accountability and appeals | Relevant target design exists; implementation maturity varies | Autonomous mistakes can leave no person responsible or no correction channel. | A user can challenge a finding, stop a run and track resolution without exposing hidden data. | AUD-06 |
| A07 Supply-chain build provenance | Relevant target design exists; implementation maturity varies | Package scripts and mutable images can subvert perfectly reviewed source. | Poisoned image/package/attestation fails admission. | AUD-07 |
| A08 Support and incident access | Relevant target design exists; implementation maturity varies | Enterprise isolation can be bypassed by support tooling and telemetry. | Support access is denied without valid ticket/scope and appears in audit. | AUD-08 |
| A09 Independent economy and demand model | Relevant target design exists; implementation maturity varies | ARR targets can hide free-user inference, failed-run costs, working capital and consumption workload. | Overage workload raises costs; cash and earned revenue reconcile separately. | AUD-09 |
| A10 Competitive outcome benchmark | Relevant target design exists; implementation maturity varies | Feature count does not show a reason to switch from established tools. | A paid pilot demonstrates incremental value beyond an existing coding agent. | AUD-10 |
| A11 Blast-radius containment of learning | Relevant target design exists; implementation maturity varies | A popular but incorrect lesson can propagate globally faster than it is corrected. | Poisoned lesson cannot reach every tenant before detection; rollback is demonstrated. | AUD-11 |
| A12 Cross-cell budget conservation | Relevant target design exists; implementation maturity varies | Parent and child workflows in separate regions can reserve the same remaining spend. | Network partition cannot multiply available funds or release unresolved liability. | AUD-12 |
| A13 Residency-local placement authority | Relevant target design exists; implementation maturity varies | A global quorum can violate residency or block independent regional operation. | Loss of another residency domain does not grant or revoke local authority incorrectly. | AUD-13 |
| A14 Disconnected and local mode contract | Relevant target design exists; implementation maturity varies | Offline enterprise or desktop features can imply stale privileged authority. | Expired/offline credentials cannot authorize cloud effects. | AUD-14 |
| A15 Licensed content and export feasibility | Relevant target design exists; implementation maturity varies | 3D/CAD datasets, proprietary sources and market feeds may forbid the proposed processing. | Artifact export and training check rights independently. | AUD-15 |
| A16 Long-lived compatibility and ownership succession | Relevant target design exists; implementation maturity varies | Decades of jobs can outlive vendors, signatures and maintainers. | Historical releases can be reconstructed and verified after provider replacement. | AUD-16 |
| A17 Customer concentration and provider collapse | Relevant target design exists; implementation maturity varies | One model, cloud, customer or marketplace publisher can dominate economics and uptime. | Loss of largest provider/customer has a bounded documented response. | AUD-17 |
| A18 Experiment interference and causal claims | Relevant target design exists; implementation maturity varies | Concurrent repairs and business experiments confound apparent improvements. | Revenue/latency attribution reports known confounders. | AUD-18 |
| A19 Operational readiness of the company | Relevant target design exists; implementation maturity varies | A technical platform still fails without support, procurement, contracts and escalation coverage. | A real pilot rehearses escalation, export, billing dispute and incident notification. | AUD-19 |
| A20 Option-based future readiness | Relevant target design exists; implementation maturity varies | No design is future-proof against AGI or paradigm shifts. | Each future scenario maps to a reversible experiment and stop rule. | AUD-20 |

## Core operational gap inventory

| System | Current evidence | Missing production proof |
|---|---|---|
| Model-account execution | Fixed-origin API adapters; primary account-first UI | Approved supported no-key inference and usage authorization |
| GitHub delivery | OAuth/import/draft-PR source and stubbed boundary tests | Live owner consent, target read-back and revocation |
| Worker | Portable fixed-command Docker runner; argument tests | Actual isolated execution, attestation, cleanup and supervision |
| Agent organization | 47 definitions; bounded root/two-review workflow | Durable evaluated specialists, exact evidence and quota conservation |
| Knowledge/memory | Snapshot heuristic graph and D1 records | Semantic extractors, authorized hybrid retrieval, temporal/withdrawal guarantees |
| Healing/twins | Snapshot README/integrity repair; illustrative scenarios | Runtime telemetry, calibrated staging, permitted deployment and observed recovery |
| UI | Built owner-private console; static design atlas | Real critical-journey browser/mobile/assistive testing and correction flows |
| Enterprise/global | Target cell/identity/security architecture | App-level tenancy, support controls, load/failover/restore evidence |
| Business | Editable corrected scenarios and pricing hypotheses | Paid demand, contribution, capacity/acquisition and cash collection evidence |
| Marketplace/evolution | Design contracts/reference guards | Real independent evaluation, release control, quality supply and settlement |

No missing department is solved by assigning a name alone. Security, SRE, finance, research/evaluation, support/enterprise operations, experience and product accountability must be staffed or explicitly assigned for the launch scope. Some roles can share a person in an MVP; independence-sensitive approval cannot be self-review.
