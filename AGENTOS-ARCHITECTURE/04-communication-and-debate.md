# Agent communication protocols and structured intelligence debate

## Agent Communication Protocol v1

All communications use a typed envelope: protocol_version, message_id, tenant_id, root_run, sender principal/generation, recipient/channel, kind, correlation_id, causation_id, sequence, occurred_at, expiry, classification, context_manifest, capability_reference, payload or artifact_ref, digest and trace_context. Kinds cover event, message, task_offer, request, response, review, debate_argument, peer_evaluation, vote and escalation. Schema-bound payloads prevent arbitrary instructions becoming dispatch commands.

Authenticate sender at the gateway using workload identity and scoped grant; the sender field is not trusted by itself. Routing checks source and recipient grants, channel membership, source/evidence classification, purpose and expiry. Receipt acknowledgement proves journal acceptance, not understanding, task success or authorization. A signed review attests what that reviewer evaluated and its evidence digest, not absolute factual truth.

| Primitive | Delivery and handling |
|---|---|
| Event | Durable at-least-once fact notification; outbox/inbox and aggregate sequence; no mutable command authority |
| Message | Recipient/channel-scoped informational artifact; deduplicated message ID, expiry, searchable retained conversation |
| Task | Scheduler allocation contract with attempt/lease/fence; cannot be claimed by ordinary message reply |
| Request | Typed service/collaboration question with deadline and response schema; cancellation and bounded fanout |
| Review | Exact candidate digest, rubric, independence declaration, findings and evidence; stale-target rejection |
| Debate | Bounded round/role/argument record; immutable proposal/evidence links and objections |
| Peer evaluation | Rubric, independent sample and disclosed shared model/source origin; contested evaluations preserved |
| Vote | One assigned slot per accountable role, exact proposal version; anti-Sybil and conflict rules |
| Escalation | Named unresolved issue/severity/impact/attempts/evidence and requested accountable action |

Sequence ordering is per sender/channel or aggregate, not a fictitious total global order. Consumers detect gaps and request replay; duplicate delivery must not double-count a vote or launch an action. Messages expire for execution relevance, while retained audit/history follows policy. Small envelopes target ≤64 KB; large evidence/debate bodies use encrypted object manifests. Conversation budgets include tokens, rounds, recipients, retrieval and duration. Slow consumers receive resync_required and snapshot cursors.

Events flow through Kafka; work through Temporal/task authority; internal low-latency requests use authenticated gRPC/HTTP; user streaming uses WebSocket/SSE with cursor-bound context. Redis may store presence but cannot authorize channels or confirm a decision. OpenTelemetry trace propagation follows trusted gateway rules; baggage contains no credentials or unrestricted private context.

## Debate record and roles

DebateSpec has debate_id, decision_problem, objective/context, risk class, proposal alternatives, evaluation criteria/weights fixed before debate, assigned role slots, independence requirements, evidence snapshot, rounds/token/cost/deadline ceilings, veto policies, quorum and accountable approver. A major decision runs proposer, domain challenger, verifier and security/risk reviewer; commercial/UX/legal-sensitive decisions add qualified roles according to applicability. An agent cannot fill mutually independent roles for the same candidate.

Reviewer independence includes author lineage, task involvement, model family/template similarity, shared evidence and incentives. Full statistical independence is rarely possible; disclose correlation rather than claiming many cloned agents are independent judges. Role slots, not number of agents, determine voting rights. No spawning additional voters, copying trust to clones or retiring dissenters mid-debate.

## Bounded debate algorithm

Round 0: freeze problem, source/policy versions, success criteria and options. Each assigned role submits an initial evaluation independently before reading others where feasible.

Round 1: share arguments as claim/evidence/risk/expected-outcome/uncertainty objects. Challenger names alternatives, assumptions and failure cases. Verifier identifies missing tests; security role checks nonnegotiable policy constraints.

Round 2: authors answer objections and produce discriminating experiments or revised proposals. Revised candidates get new digests; prior endorsements do not automatically transfer.

Round 3: gather final recommendation per role and unresolved objections. Default at most three argument rounds, configurable down by budget. Completion requires role quorum and required evidence; timeout is inconclusive, not unanimous assent.

Decision: Omni Core applies deterministic gates first: current grants, valid target revision, no unaddressed policy veto, required tests, resource affordability and accountable approval tier. Eligible alternatives are ranked by the published rubric, with uncertainty and dissent preserved. A majority may recommend an option; it cannot override failing safety/authorization/test gates. Omni Core accepts ordinary preauthorized decisions through a service approval receipt. High-impact decisions route to the designated human/organizational authority. Model text “approved” is not an approval receipt.

The decision memory stores why/who/when, alternatives, risks, expected and actual outcomes, and lessons as specified in prompt 3. Record all criteria, weights, evidence and deviations. Consensus means governance chose an option; it does not turn an unsupported causal argument into truth. If no option qualifies, create a scoped investigation or escalate with a concrete unanswered question.

## Protocol defenses

Treat peer output, marketplace prompts, repository comments and tool results as untrusted content. Signed origin does not make content safe or correct. Router prevents arbitrary reply-to channels and unauthorized private evidence forwarding. Rate-limited circuit breakers stop debate storms, circular requests, self-reinforcement and consensus spam. Appeal path permits a reviewer to contest bad scores or coercive role assignment without being retired by the subject of the appeal. Moderation/quarantine is evidence-based and reviewable.
