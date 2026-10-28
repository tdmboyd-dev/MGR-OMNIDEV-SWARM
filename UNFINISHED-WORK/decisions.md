# Decisions and remaining choices

## Accepted direction

- Product: OmniDev Swarm, an orchestration platform rather than a chatbot.
- Keep the current Site owner-private; no public multi-tenant launch is authorized by existing architecture.
- Prefer account sign-in over asking users to paste model keys.
- GitHub account authorization and selected repositories are the repository direction.
- Vercel is not a required component. A failed optional sandbox experiment did not establish a worker.
- Preserve bounded execution budgets; a schema without a nesting limit does not imply infinite compute.
- Keep review, evidence and rollback visible; never report a proposal as an executed action.
- Create a GitHub copy later when the user explicitly requests it and identifies the destination.

## Choices still needed as implementation reaches them

- Approved hosted ChatGPT plan integration versus a separately implemented local runtime; desired first additional AI providers.
- Owner-authorized isolated worker host and concrete project/deployment targets.
- Which integrations and specialist domains are first operational priorities.
- Production auto-action policy, permitted environments, blast radius and review/merge rules.
- Team/tenant permission model, backup objectives, retention and data residency.
- Applicable compliance/legal standards and qualified review ownership.
- Real product/customer/revenue data sources and evaluation success metrics.

These are recorded choices, not a request to answer everything now. Continue independent prerequisite work and ask only when a choice becomes necessary.
