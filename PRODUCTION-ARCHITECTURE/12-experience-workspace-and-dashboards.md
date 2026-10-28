# Experience, workspace, UI and dashboard architecture

## Client platforms

Web uses a typed React application with server-composed authorized view models, accessible components and virtualized large data surfaces. Preserve the current Sites console as the migration entry point; split BFF/backend contracts without rewriting working experiences unnecessarily. Desktop uses a signed native shell with local project bridge, OS credential storage, system-browser authorization and user-visible directory/device permissions. Mobile is a native/appropriate cross-platform client for monitoring, review, approvals and scoped incident control, with secure device sessions and push preferences. CLI provides scriptable commands, JSON output, resumable logs and provider-supported browser/device sign-in. Voice translates authorized intent into proposed commands; consequential actions require explicit confirmation of target and artifact through the configured policy, and voice alone is not high-assurance identity.

Shared design system defines navigation, type/color/spacing, status/evidence semantics, charts, graph views, diff, artifacts, forms, approvals and error recovery. SDK/model contracts are shared; platform-specific interaction and accessibility remain first-class. Client offline mode permits cached authorized read views with freshness labels and encrypted local storage; it cannot queue production approvals indefinitely or manufacture new capabilities. On reconnect, revalidate identity, grants and source revisions before replaying any permitted command.

## Workspace model

Organization → workspace → project → environment/resources. A user may belong to several organizations but has one explicit active context per action. A project combines repositories, services, design assets, infrastructure, documentation, business objectives and connection mappings. Project grants can be narrower than workspace membership. Environments carry risk tier, residency, action policy, deployment targets and approved data-handling modes.

Command console separates objective entry, plan/dependency view, running activity, evidence, candidate review and external action. Use a command palette for navigation/read actions; production changes open a target/evidence/approval surface. Show agent definitions, proposed agents, queued execution and completed evidence with distinct states. “Connected,” “verified,” “fresh,” “read-only” and “write-authorized” are different connection badges.

Large repository/graph surfaces are paginated/virtualized. The graph defaults to a project-centered bounded neighborhood with search, filters, temporal slider, unresolved nodes and an accessible equivalent table. Do not render billions of nodes in a browser. Selection opens provenance and authorized relationships; node/edge counts obey permission boundaries.

## Dashboard contracts

| Surface | Primary decisions / evidence |
|---|---|
| Executive | Project/business health, security, debt, innovation/revenue opportunities, scale risks, forecasts and Omni Score with coverage |
| Engineering | Tasks, candidates, reviews, CI/test evidence, repository changes and developer experience |
| Architecture | System/dependency graph, decisions, boundaries, migration plans and fitness checks |
| Security | Findings/control coverage, attack surface, threat indicators, remediation evidence and exceptions |
| Research | Sources, questions, freshness, methods, disputed claims and research memory |
| Innovation | Opportunity hypotheses, prototypes, experiments, alternatives and validation outcomes |
| Project visualization | Versioned code/services/assets/infrastructure/user-flow map with provenance |
| Realtime swarm | Lineage, goals, tasks, leases, active/waiting agents, budgets, messages, dissent and health |
| Operations | SLOs, incidents, diagnosis, deployment/rollback, target health and worker availability |
| Costs/billing | Reservations, actual spend, provider/compute breakdown, allocations and invoices |

Every panel response includes tenant/project scope, observation time, source/projection version, coverage and confidence where applicable. A partial BFF composition preserves working panels and labels failed/stale ones. Unknown data never becomes a green zero. Dashboard actions point to the relevant policy-controlled command, not direct database writes.

## User journeys and failure states

Connect account → review provider grant → select resources → inspect ingestion coverage → inspect intelligence → launch objective → inspect plan/budget → observe execution → review evidence/candidate → authorize repository or environment action → observe provider receipt and outcome. GitHub app registration, installation and account consent must be separate visible steps with a safe return path. Hosted AI account availability is explained without replacing unavailable execution with a fake login button.

Persistent activity records let a user resume after interruption. Forms preserve input on retryable failures but never retain secret values in client storage. An unknown side effect shows “reconciling” and disables duplicate dispatch. Canceled/revoked work shows actual stopped versus already-dispatched effects. Approval screens summarize target, exact change, test coverage, risks, cost, expiry and rollback/forward recovery.

## Accessibility and design verification

Semantic navigation, heading hierarchy, labels, keyboard commands, focus management, announcements, contrast, reduced motion, readable type and zoom/mobile layouts are release criteria. Graph/3D/score visualizations need text/tabular alternatives and evidence drilldown. Voice outputs are accompanied by text and explicit editable intent. Color alone cannot communicate severity, completeness or permission.

Test critical journeys on representative browsers/devices, keyboard-only and assistive technology; evaluate latency and interruptions with real backend states. Conduct usability research separately from cosmetic screenshot review. Every dashboard metric has a methodology/source tooltip or detail panel, and all simulated/forecast values are labeled. Design changes are versioned with implementation tasks and acceptance evidence.
