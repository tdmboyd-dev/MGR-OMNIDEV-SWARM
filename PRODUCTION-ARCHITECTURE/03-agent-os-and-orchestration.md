# Agent operating system, Omni Core and fractal swarms

## Agent identity and persisted contract

Each agent is a logical principal, not a process. Identity is `{tenant_id, agent_id, template_digest, parent_agent_id, root_run_id, authority_epoch}`. Additional fields: specialization, goal/objectives, immutable context snapshot, task queue reference, working-memory handle, scoped long-term memory selectors, communication subscriptions, tool grants, model policy, cost reservation, deadline, evaluation rubric, health state and retirement policy.

A swarm is a scoped collaboration aggregate with members, parent swarm, objective, project graph snapshot, policy, supervisor and budget. Root departments include Security, Backend, Frontend, DevOps, Cloud, Database, Architecture, Testing, Documentation, Research, AI, 3D, Game Development, Business Intelligence, Revenue, Innovation and Future Prediction. The 47 detailed domains from the existing catalog specialize these departments. All share the same security/task protocol; domain prompts and tools are versioned separately.

No fixed schema depth constrains parent/child hierarchy. Execution still requires available budget and a spawn grant. Depth-sensitive operations use iterative traversal/path indexes, not application stack recursion. Huge subtrees are paginated. Per-root cumulative limits survive spawn/retry; splitting into new agents cannot reset quotas. Long-running improvement loops start new workflow generations with parent lineage and retained budget policy.

## Agent lifecycle

`defined → admitted → ready → leased → executing → checkpointed → reviewing → completed/failed/canceled → retired`.

A suspended agent has no active compute lease. A retired identity remains in the evidence ledger, with credentials revoked and memory retention governed by policy. Health distinguishes no work, waiting approval, waiting provider, unavailable worker, stalled lease, failed execution and unhealthy evaluation. Agent creation is idempotent by `{root_run, parent_task, specialization, generation}`.

The runtime uses a lease with monotonic fencing token plus heartbeats. Control state is durable; Redis presence expires and cannot establish completion. An execution result must match task ID, attempt, lease/fencing token, input digest, output digest and attested execution identity. Late results become evidence-only or are rejected, never applied to a newer revision.

## Omni Core planning algorithm

1. Freeze the objective, target resources, source revision, policy revision and coverage statement.
2. Classify project/domain using evidenced manifests and requirements. Retrieve only authorized context.
3. Generate a typed proposal DAG: inputs, tasks, dependencies, specialist roles, artifact contracts, estimates and acceptance tests.
4. Deterministically validate cycles, dependency existence, allowed targets, inherited capabilities and resource budgets. Model output cannot directly dispatch tools.
5. Reserve a root budget and allocate child allowances. Use weighted fair queues by organization and class; incidents can preempt resumable research but cannot bypass policy.
6. Execute ready tasks in isolated or model-only pools. Persist checkpoints and provenance after every material step.
7. Gather specialist reviews and conflicting evidence. Invoke conflict resolution; preserve dissent.
8. Validate code/artifact/test evidence, authorize the proposed external action and obtain approvals bound to exact digests.
9. Dispatch through tool broker; reconcile uncertain outcomes before retry.
10. Measure outcomes, retain the decision record, update project intelligence and close or continue the improvement generation.

## Collaboration, debate and votes

Agent communication uses typed proposal, question, evidence, review, dissent, escalation and completion messages. Address agents by scoped principal and run; no unrestricted broadcast of private context. A message references content-addressed evidence and a correlation ID. Debate is bounded by round/token/deadline quotas and records unresolved objections.

For a normal engineering choice, assign proposer, independent reviewer and test verifier; security-sensitive choices include the security role. A vote is a recommendation, not authorization. Count one vote per assigned role; spawning extra agents cannot create extra votes. Weighting is rubric-based and recorded before the debate. Shared-model/correlated reviewers are disclosed. A policy veto, failing test or unauthorized action overrides a majority. Conflicts escalate to Omni Core's deterministic policy or a human approver when evidence is insufficient.

Evaluation records task completion quality, regression rate, unsupported claims, security-policy violations, useful artifacts, cost, latency and reviewer disagreement. Do not reward raw agent count, token throughput or unverified self-reported success. Template promotion requires held-out tasks and rollback to a prior template digest.

## Durable workflow implementation

Select Temporal for durable orchestration. Workflow code is deterministic; external model/tool calls occur in Activities whose outputs are recorded. Child workflows correspond to bounded swarm/task groups; periodic Continue-As-New keeps long histories bounded. Large context/output data lives in immutable object storage; workflow payloads carry references and digests. Separate task queues by cell, tool class, CPU/GPU/license and priority. Provider retries respect provider limits and root budgets.

Official behavior basis: [workflow determinism](https://docs.temporal.io/workflow-definition) and [child workflows](https://docs.temporal.io/child-workflows). Product-specific retry, fairness and approval policy are design choices in this package.

## Cost and authority conservation

Child maximum capability = intersection of parent capability, agent-template capabilities, target policy and current grant. Child deadline ≤ parent deadline. Root spent + active reservations + proposed children ≤ root financial ceiling. Model/tool dispatch reserves maximum permitted usage before execution; settlement replaces reservation with signed actual receipt. Cancellation revokes descendant capabilities, stops new dispatch and compensates/reconciles already dispatched effects.

Provider account sign-in supplies only the capabilities granted by that provider. A cloud workforce identity is not a model usage grant. An agent cannot invent a new integration to bypass a missing provider authorization.
