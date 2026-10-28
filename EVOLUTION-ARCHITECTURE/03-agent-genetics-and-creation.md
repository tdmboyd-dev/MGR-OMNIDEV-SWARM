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
