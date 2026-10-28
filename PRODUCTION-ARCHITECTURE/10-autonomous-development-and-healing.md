# Autonomous development and self-healing systems

## Improvement cycle

The durable cycle is `observe → understand → analyze → plan → build → validate → approve/authorize → deploy → monitor → learn → repeat`. Requirements include the user's requested autonomous loop; validation/authorization are mandatory states rather than optional prose. Observation can trigger proposals automatically. Production action requires a configured policy and authorized target.

Triggers: repository/configuration change, security advisory, SLO incident, scheduled debt review, product requirement, customer feedback or validated opportunity. Deduplicate trigger/source revision and attach coverage/freshness. Rank by safety/impact, urgency, dependencies, effort, cost and confidence. Reserved incident capacity prevents research scans from starving outages.

## Development workflow contract

Input: objective, target project/environment, immutable base source, scoped grants, budget, definition of done and change risk. Plan decomposes architecture/implementation/test/docs/migration tasks. Agents retrieve scoped context and propose bounded artifacts. Compile/build/lint/scanners and behavioral tests run against immutable candidate in isolation. Independent specialists review safety and correctness with typed approvals/dissent.

Changes support additions, edits, moves/deletes, binaries/assets and generated infrastructure through explicit manifest types. A patch binds original path/blob and resulting digest. File containment, archive expansion, secret handling and artifact provenance are deterministic checks. Model output cannot request arbitrary host shell execution. Dependencies/commands are discovered and allowed by project policy and controlled images, with approved egress to package mirrors.

Delivery produces branch/PR or reviewed staging deployment. Base revision must still match target; otherwise rebase/regenerate with new evidence and approvals. CI/test evidence binds the exact commit/artifact, tool image and environment. A successful previous run is not reusable for changed code unless declared cache keys cover all relevant inputs.

## Production healing

Incident record: target/project, first/last observation, severity, SLO impact, timeline, telemetry coverage, recent deployments, graph context, suspected causes, commander and repair budget. Diagnose competing causes using evidence rather than a single model guess. Read-only investigation agents can spawn under incident scope; emergency privilege remains separately authorized.

Repair plan includes fault hypothesis, scope, intended effect, alternatives, preconditions, measurable success, blast radius, dry-run/twin evidence and compensation. Allowed automatic actions are narrow classes configured per target (for example restart a stateless unhealthy replica under existing rollout policy). Schema deletion, irreversible data changes, IAM expansion and major production migrations require stronger review. An agent cannot widen its own automatic-action policy.

Deployment uses operation intent/reservation, immutable artifacts, authority fencing, target-scoped capability and idempotent provider adapter. Canary gates use stable pre-change baseline and fresh post-change health. Validate the original fault, new errors, latency, data integrity, business invariants and cost. Stop/rollback when confidence or telemetry is inadequate, not only when an explicit error appears.

For database changes, define forward recovery and backup/checkpoint; rollback may be unsafe after new data is written. The platform must represent “irreversible” and require the configured human decision. Never promise generic rollback for every migration.

## Outcome and learning

Classify outcome as validated repair, symptom relief, regression, inconclusive or failed repair. Store evidence, diagnosis accuracy, elapsed time, user impact, cost, rollback and lessons. Promote reusable playbooks only after representative controlled experiments; do not train/publish private incident content across tenants without permission.

Recurring improvement runs retain objective/budget/stop conditions and produce new versioned proposals. Prevent oscillation with cooldown, repeated-fault correlation and bounded retries. Global/tenant/project kill switches revoke future dispatch and signal descendants. Runbooks handle unknown provider outcome, missing telemetry, sandbox compromise, cost ceiling and conflicting repairs.

## Release acceptance gates

| Gate | Required evidence |
|---|---|
| Access | Current project/target grants, residency and account/provider usage permission |
| Candidate | Exact source/artifact digests; no secret/path/policy violations |
| Behavior | Relevant isolated unit/integration/critical-flow tests; coverage statement |
| Security | Applicable scanner results and reviewed severity exceptions |
| Review | Required independent roles, no unresolved policy veto, approval bound to digest |
| Target | Safe plan, compatible deployment/migration and rollback/forward recovery |
| Outcome | Provider read-back and fresh post-change health observations |

Tests that merely prove files exist are useful integrity checks but cannot satisfy behavioral correctness or production healing. The current implementation has snapshot repairs; this target architecture adds real incident, target and outcome systems without claiming they are already deployed.
