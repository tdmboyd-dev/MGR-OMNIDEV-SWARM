# Engineering handoff and implementation contracts

## Normative invariants

1. Private state has a tenant/project owner and current-access enforcement at every data boundary.
2. Consequential effects have one owner, immutable intent, current capability, reserved resources, exact evidence and reconciliation.
3. Historical facts, inferred claims, simulations and forecasts are different assertion types.
4. Agent creation and model confidence cannot grant permission or credit.
5. Code/build/test/review receipts bind immutable digests and current attempt authority.
6. Derived views may lag and disclose their generation; they cannot authorize a stale release.
7. Source withdrawal immediately blocks use even while physical purge converges.
8. Experiments and learning are bounded; candidate-controlled code cannot modify policy or graders.
9. Sensitive unknown outcomes remain reconciling; cancellation is not proof of reversal.
10. Product claims are limited by current implementation and real evidence, regardless of specification completeness.

## Workstream contracts

| Workstream | Inputs | Outputs | Mandatory failure behavior |
|---|---|---|---|
| Account/resource authorization | Provider registration, owner consent, selected resources | Versioned connection/grant metadata and protected vault handle | Decline/revoke/expiry stops new use; no fallback identity inference |
| Ingestion | Current grant, source revision, extraction manifest | Immutable snapshot, coverage, journal events | Checkpoint pagination/rate limit; classify denied/stale/incomplete |
| Agent planning | Objective, snapshot, capability envelope, budget | Typed dependency plan and expected artifacts | Unsupported skill becomes gap; no invented execution |
| Execution | Claim/attempt/fence, image, artifact and test manifest | Signed outcome/evidence, resource receipts | Timeout/cancel/resource breach stops work and reports cleanup |
| Review/delivery | Exact candidate and tests, independent roles | Review disposition and draft PR/target intent | Stale source invalidates evidence; unknown provider write reconciles |
| Memory/retrieval | Source claims/rights and current requester | Cited authorized answer and coverage | Filter before expansion and after assembly; revoked source denied |
| Billing | Root reservation, dispatch rate card and receipts | Usage settlement and balanced journal | Unknown liability retained; duplicate receipt cannot double-charge |
| Healing | Telemetry, incident scope and repair policy | Diagnosis, scoped plan, outcome | Missing fresh health or irreversible risk blocks automatic deploy |
| Evolution | Curated evidence, immutable baseline, experiment plan | Scoped capability release or rejected candidate | Harm veto, contamination, rights failure or budget breach blocks promotion |
| Marketplace | Signed artifact, rights and declared capabilities | Pinned tenant installation | Permission expansion requires new grant; revoked digest cannot run |

## Action classes

A snapshot edit is an owner-reviewed draft change to imported text; static/integrity checks may be displayed but are not behavioral approval. A validated change requires relevant application tests and independent evidence on exact source/candidate/test/image digests. Deployment additionally requires target grant, digest-bound review, recovery plan, fresh health baseline and provider read-back. A mutable boolean “tests passed” without binding cannot satisfy these contracts.

## Worker receipt contract

Fields: receipt_id, tenant_id, project_id, run_id, task_id, attempt_id, candidate_digest, source_digest, image_digest, test_manifest_digest, execution_identity, attestation_ref, started_at, completed_at, fence_epoch, cancellation_generation, exit_status, test_results_uri, resource_usage, cleanup_status and signature. The verifier validates identity/attestation/signature outside the worker; an unverified self-assertion is not sufficient. Accept only current leased attempt and matching immutable inputs; duplicates are idempotent, changed payload under the same ID conflicts. Store rejection evidence without overwriting the current result.

## Budget transfer contract

The root reservation owns total approved spend. A cross-cell allocation first creates a durable debit and allocation ID in root authority; only a signed grant for that ID enables child dispatch. An uncertain delivery may be retried with the same ID, not a second allocation. Settlement receipts deduplicate by allocation/operation/provider request. Return unspent balance only after terminal reconciliation. Ledger accounting and resource reservation are separate systems with explicit mappings.

## Data withdrawal contract

States: requested, denied_for_use, enumerating_derivations, purging, verifying, completed or blocked_by_named_obligation. Immediate policy tombstone precedes index purge. Track generation/cell/subscriber receipts, backup restore handling and model-training lineage. Completion reports what was erased, what remains lawfully restricted and why. Define measured convergence SLOs before selling them; immediate deny targets and purge times are not yet achieved.

## Release manifest

A release pins source/candidate, build materials, image, tests, evaluators, policy/grants, target, cost reservation, model/prompt/genome versions and rollback/forward-recovery artifacts. Deployment/failover/research releases use different risk policies but the same provenance discipline. Compatibility checks include API/event/ontology/embedding generations and long-running workflow versions.

## Acceptance evidence format

For each task record requirement ID, exact source revision, test environment, inputs/fixtures, observed outputs, negative cases, artifacts/provider receipts, owner, date and remaining limitations. A fixture test verifies its fixture contract; a live integration verifies its provider path; a fault drill verifies its measured failure envelope. Preserve all three labels. No approval or review waives a critical access, secret, isolation, financial or ownership invariant.

## Ownership and development order

Founder owns value/scope/funding; platform/runtime owns durable execution; security owns policy/isolation/provenance; data owns memory/retrieval/withdrawal; research owns evaluation quality; experience owns consent/accessibility/correction; SRE owns restore/incident/capacity; finance owns usage/accounting; enterprise operations owns contracts/support. A small team may hold multiple roles, but high-risk independent reviews cannot collapse into the candidate author signing their own work.

The first milestone is the authorized behavior-tested draft-PR loop. Next: concurrent orchestration/evidence hardening and scoped data controls. Then: team operations/billing/support, richer intelligence, telemetry-backed healing, tested cells and evaluated ecosystem/evolution. Independent research/contracts continue while live provider/host prerequisites remain unavailable.
