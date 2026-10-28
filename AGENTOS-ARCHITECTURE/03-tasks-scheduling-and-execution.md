# Task execution, orchestration and scheduling

## Objective and TaskSpec

Objectives describe desired outcome, accountable owner, target scope, source snapshot, priority, acceptance metrics, budget, deadline and risk policy. Objective queue entries link dependencies and decisions. A task is a bounded contribution with task_id, objective_id, root_run, task_class, target/input digests, priority, urgency/deadline, complexity estimate, required skill predicates, dependency IDs, risk level, expected outcome, machine/human success criteria, allowed capabilities, evidence requirements, timeout/retry/compensation policy and resource reservation. All fields are versioned and tenant scoped.

Priority reflects importance; urgency reflects time sensitivity; complexity is an estimate with provenance and observed adjustment. Risk distinguishes read-only analysis, artifact proposal, isolated execution, reversible external change and high-impact/irreversible action. A high-priority task does not automatically get a high-risk action grant. Success criteria are executable checks where possible and explicit reviewer criteria otherwise; a generated “done” text is never completion evidence.

Tasks transition proposed → validated → blocked or ready → claimed → running → awaiting_review → succeeded. Attempts may fail, retry_wait, canceled, timed_out or reconcile_unknown. Approval/provider/source dependencies use named waiting conditions, not repeated retries. Dependency completion requires accepted artifacts at exact revisions; successful predecessor from a different source snapshot cannot accidentally unblock an incompatible task.

## Scheduler policy

Partition ready queues by home cell, tenant class and resource/task class. Weighted deficit round robin enforces tenant shares; per-tenant priority and age/deadline ordering select work within that share. Reserve a bounded incident share with borrowing when idle. Rate/concurrency/cost limits remain authoritative. Aging prevents starvation; admission refuses infeasible deadline/budget combinations with explanation instead of promising impossible work.

Eligibility first filters current grants, residency, compatible modules/model access, required skills and score freshness, resource pool availability, conflicts of interest and independent review requirements. Ranking then considers demonstrated task-class quality, estimated completion/cost, data locality and health. Trust and influence are advisory after hard constraints; high trust cannot override a denied target. Unknown competency routes to bounded learning/evaluation or a supervised task, not unlimited responsibility.

Agents request work through a broker. They do not select arbitrary highest-reward jobs or write SQL to mark themselves claimed. Scheduler allocates with an atomic transaction over task revision, ready/dependency state, agent capacity and budget reservation. Claim response binds attempt_id, fencing_token, authority_epoch, lease expiry, input digest, allowed target and resource reservation. Repeated request idempotency returns the same valid allocation rather than reserving twice.

Default task lease profile: 60-second expiry, renew every 20 seconds, 5-second clock-skew design allowance, confirmed against authority time. These match placement lease targets but are separate lease objects. Workers lose permission to start new effects when renewal fails. Monotonic fence and cancel generation reject stale updates and outputs; broker checks fresh authoritative lease/grant at effect dispatch, not only worker-local wall time. Heartbeat presence alone is not a lease grant.

## Durable execution path

1. Pin objective, source/context, module/model/policy versions and acceptance criteria.
2. Planner emits a typed task DAG and estimates. Validator rejects missing dependencies, cycles, impossible target permissions and unbounded work.
3. Reserve root resource/money ceilings and dispatch ready tasks fairly.
4. Worker retrieves authorized memory/evidence, runs inference/tool activity with structured contracts and checkpoints.
5. Persist receipts with input/output digests, attempt/lease/fence, tool identity and usage; model output does not self-certify a tool ran.
6. Independent reviewers/verifiers examine artifacts and tests. Rework is a new bounded task linked to critique, not an infinite conversational loop.
7. Authorize any external effect against exact artifact/target/state/policy and approval. Broker dispatches with provider-compatible idempotency.
8. Reconcile outcome and actual usage, update accepted project memory, evaluate success and release unused reservation.
9. Continue improvement under a new workflow generation only when objective policy and budget permit.

Temporal workflow logic remains deterministic; model, network and tool calls occur outside deterministic replay in recorded Activities. Activity retries must not assume external exactly-once behavior. Use provider idempotency keys, operation ledgers and receipt/reconciliation; an uncertain database/deployment side effect cannot be retried blindly. Continue-As-New bounds long histories with explicit carryover manifests and root budget state. Large artifacts and conversations remain object references, not workflow history blobs.

## Cancellation, preemption and recovery

Cancellation increments root cancel generation and revokes descendant dispatch rights. Current model calls may be noncancelable; retain uncertain-cost reservation until settled. Checkpointable tasks can be preempted at safe boundaries; noncheckpointable effect sections require drain/reconcile. Do not “undo” an irreversible external operation through a generic compensation label. Compensations are explicit tested actions with their own grants and approvals.

A stalled attempt loses lease, is fenced and enters recovery. New attempt reads last accepted checkpoint only after schema/template/source compatibility checks. Late output becomes evidence-only or rejected; it cannot finalize a replacement attempt. If worker dies after producing an artifact but before acknowledging, content-addressed output plus attempt receipt reconciles without charging/repeating work unnecessarily. Poison tasks hit bounded retry ceiling, quarantine with evidence and escalate; invalid grants are not retryable network failures.

Repository work binds immutable snapshots and branches. Concurrent agents may generate separate candidates; integration locks or optimistic target revision checks serialize accepted application. Conflicts become merge/rebase review tasks. No agent can force-apply a stale candidate because its predecessor task succeeded. Production deploy and self-healing continue to use the previously specified twin/test/approval/canary/rollback gates.
