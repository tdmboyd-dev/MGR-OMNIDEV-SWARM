# Final Super Audit — eleven company lenses

These are hypothetical engineering perspectives based on the requested lenses. They are not statements, endorsements or private knowledge from these companies. Product facts require current primary documentation; the improvements below are OmniDev design judgments.

## Microsoft

**Lens:** Enterprise identity and lifecycle.

**Likely criticism to test:** The product cannot sell enterprise trust while relying only on an owner-private gateway.

**Improvement integrated:** Separate organization identity, SCIM lifecycle, entitlement, project ABAC and provider grants; add support access governance and compatibility commitments.

**Different build emphasis:** Build a cohesive enterprise administration plane and audited private marketplace.

**Integration references:** A06,A08,A14,A19.

## Google

**Lens:** Measured distributed systems and research discipline.

**Likely criticism to test:** Scale arithmetic and model confidence are not workload benchmarks or calibrated science.

**Improvement integrated:** Use per-residency cells, workload-shaped capacity tests, error budgets, dataset lineage and independent challenge evaluations.

**Different build emphasis:** Build reproducible evaluation and fleet placement before global growth claims.

**Integration references:** A01,A05,A13,A18.

## Amazon

**Lens:** Operational ownership and unit economics.

**Likely criticism to test:** Too many logical services can outstrip a small team; every uncertain effect becomes an operational burden.

**Improvement integrated:** Start a modular monolith with explicit service ownership, reserved budgets, reconciliation queues and tested restore runbooks.

**Different build emphasis:** Build runbooks and chargeback along with features; split services by demonstrated bottleneck.

**Integration references:** A04,A09,A12,A19.

## OpenAI

**Lens:** Capability evaluation and safe tool use.

**Likely criticism to test:** Provider identity is not inference consent; self-reported agent success does not prove reliability.

**Improvement integrated:** Version model capabilities, typed tool contracts, independent outcomes, current authorization and prompt-injection tests.

**Different build emphasis:** Build a model-independent evidence and tool-execution plane with measured fallback quality.

**Integration references:** A01,A02,A05.

## Anthropic

**Lens:** Constrained agency and feedback quality.

**Likely criticism to test:** Recursive agents and constitutional language can obscure actual privilege boundaries and noisy preference signals.

**Improvement integrated:** Make deterministic policy external to model output, distinguish satisfaction from accuracy, constrain autonomous scope and evaluate instruction/data separation.

**Different build emphasis:** Build inspectable plans, task-specific evaluation and explicit permission intersections.

**Integration references:** A05,A06,A11.

## NVIDIA

**Lens:** Heterogeneous compute efficiency.

**Likely criticism to test:** An all-cloud CPU assumption fails for 3D, inference and training with licensed/GPU dependencies.

**Improvement integrated:** Separate GPU/render/training queues, image and driver compatibility, utilization budgets, model memory envelopes and artifact validation.

**Different build emphasis:** Build reproducible heterogeneous compute classes with cost and scheduling telemetry.

**Integration references:** A01,A07,A15.

## Palantir

**Lens:** Ontology-to-action traceability.

**Likely criticism to test:** A graph of files is not a governed operational model with accountable business decisions.

**Improvement integrated:** Link objects to actions, decisions, business invariants, current permissions and source evidence; make human correction and operational lineage first-class.

**Different build emphasis:** Build governed operational workflows and decision evidence rather than a decorative graph.

**Integration references:** A03,A06,A18.

## SpaceX

**Lens:** Systems verification and configuration control.

**Likely criticism to test:** Generic rollback claims are unsafe when state changes are irreversible or operating conditions drift.

**Improvement integrated:** Bind exact configurations, test failure modes, rehearse recovery, classify reversible versus forward-recovery changes and preserve incident learning.

**Different build emphasis:** Build hardware-style configuration discipline for software release manifests and fault testing.

**Integration references:** A02,A04,A07,A16.

## Anduril

**Lens:** Degraded operation and decisive accountability.

**Likely criticism to test:** Real-time control fails if global dependencies or unclear incident authority block response.

**Improvement integrated:** Use scoped local authority, offline-mode limits, incident command, reserved emergency capacity and stale-data visibility.

**Different build emphasis:** Build resilience under disconnection without granting uncontrolled autonomy.

**Integration references:** A04,A06,A13,A14.

## GitHub

**Lens:** Repository-native delivery and developer confidence.

**Likely criticism to test:** A new dashboard that creates code without branch/test/review evidence loses to existing workflows.

**Improvement integrated:** Honor branch protections, exact base/candidate digests, draft PR handoff, independent tests, provenance and provider-side receipt reconciliation.

**Different build emphasis:** Build reviewable changes directly into the customer workflow before expanding surfaces.

**Integration references:** A02,A07,A10.

## Cloudflare

**Lens:** Edge routing with bounded regional authority.

**Likely criticism to test:** Edge distribution alone does not provide global transactional correctness or tenant isolation.

**Improvement integrated:** Keep edge/BFF composition separate from home-cell writes, fail closed on stale epochs, protect egress and expose degraded panels.

**Different build emphasis:** Build fast scoped reads with explicit origin/authority and blast-radius control.

**Integration references:** A03,A08,A13.
