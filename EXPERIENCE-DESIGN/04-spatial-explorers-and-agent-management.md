# Knowledge graph, architecture and swarm explorers

## Map-based knowledge explorer

The explorer behaves like a navigable map: search an entity, zoom from broad systems into local relationships, inspect details and follow related nodes. Initial view is a bounded project-centered neighborhood, not all billions of graph nodes. Map layers include source, services/infrastructure, documentation/decisions, business/revenue and agents/tasks. Layer controls are independent from source permissions.

Toolbar includes search, scope, relationship/type filters, time/context, reset view, zoom controls, table/map toggle and coverage. Legend maps type to icon/shape and labeled color. Structural provenance and observed dependency edges are solid; inferred relationships dashed; forecast edges dotted with labels. Unresolved references have a distinct outline and explanatory state. Do not encode epistemic state only by line pattern/color without text detail.

Node selection opens inspector: identity/type, source revision, owner, summary, evidence, inbound/outbound relationships, decision history, unresolved questions and available actions. Edge selection explains predicate, source, modality, temporal validity and confidence method. Table mode lists the same authorized entities/relationships and supports all meaningful navigation/actions. Node position is layout, not measured geographical distance or confidence.

Pan/zoom via pointer/touch has button and keyboard alternatives. Search focuses selected entity and announces result count. Breadcrumb/history lets users step back through exploration. Pin views store permitted entity IDs and query configuration; shared links reauthorize recipients. Remote shard unavailable shows partial visible coverage; it must not reveal denied objects through missing-node placeholders/counts.

Timeline has explicit observed/current/scenario modes, release/version chooser and valid/known-time advanced controls. Scrubbing previews a labeled snapshot; apply commits the selection and updates all panels consistently. Year 1/3/5/10 futures have a separate scenario selector; no future node is silently blended into current architecture.

## Architecture explorer

Architecture view emphasizes systems, deployment boundaries, data flow, APIs, cloud resources and fitness checks. Level switch: organization landscape, project/service, component/module, code symbols. Use C4-style scope semantics without forcing every repository into an identical diagram. Boundary filters expose environment, region/cell, network zone, owner and criticality. Dependency view traces upstream/downstream impact and cycles with explicit static/runtime coverage.

Compare mode selects baseline/candidate manifests and displays added/removed/changed components, interface compatibility, costs, expected risks and decision rationale. “What breaks if removed?” opens impact analysis and isolated tests; reachability alone remains potential impact. “Propose replacement” opens alternatives/requirements/acceptance, not instant architecture mutation. Export includes authorized data, evidence labels, context and uncertainty; recipients do not receive hidden records.

## Swarm visualization and zoom hierarchy

Organization → Project → Swarm → Agent → Task is a drill-down path, not a permanent identity hierarchy. Map clusters group by current objective/domain/project; cross-membership is shown on selection. “Hierarchy” and “collaboration” modes distinguish creation/cost lineage from peer interaction. Task ownership remains authoritative attempt assignment, not nearest animated agent.

| Zoom level | Primary information |
|---|---|
| Company | Objective portfolio, projects, capacity/risks and active incidents |
| Project | Swarm clusters, work dependencies, evidence gaps and budgets |
| Swarm | Member roles, tasks, conversations/debate, knowledge flow and coordinator |
| Agent | Lifecycle/activity, skills/modules, grants, memory selectors, trust/performance/health evidence |
| Task | Input/output revisions, lease/fence, tests/review, tool receipts, waiting conditions and acceptance |

Animation is limited to brief selection/focus transitions or optional low-frequency activity pulses. It cannot imply actual network packets or successful work. Health/lease/presence are separate badges. Conversations show structured claims/evidence/objections and concise rationale, not private hidden chain-of-thought. Resource heat maps show reserved/actual usage and queue pressure with table equivalence.

## Agent control panel

Agent detail tabs: Overview, Tasks, Skills & Modules, Grants, Memory & Sources, Discussions, Evaluations, History. Overview displays desired lifecycle and observed activity, named blockers, accountable owner and actual worker/model availability. Performance/trust/health show rubric, samples, recency, uncertainty and disputed evaluations; unknown is explicit. Trust is not a permission indicator.

Controls: request expert, join/reassign swarm, pause/drain, resume/readmit, clone expertise, propose merge, transfer permitted knowledge, retire and authorized destruction workflow. Plain descriptions explain credential/grant differences. Clone/merge previews competence/module changes and clearly states destination permissions; never presents privilege union as a checkbox default. Retiring a busy agent shows in-flight operations and objective reassignment. Destroy has retention/legal and purge receipts rather than an instantaneous “forget everything” animation.

Task panel highlights state, dependencies, expected outcome, success criteria, candidate artifacts, review/dissent and actual effect result. Cancel shows whether work stopped, cost remains pending or external effect is reconciling. No endless spinner for missing provider authorization; offer the available account consent action.
