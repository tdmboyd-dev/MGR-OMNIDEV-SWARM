# Experience architecture and navigation

## Product promise and mental model

OmniDev Swarm is a unified environment for directing an engineering organization of AI swarms. The interface helps a person understand what exists, choose what matters, inspect evidence, authorize work and verify outcomes. It does not require the person to understand model infrastructure before receiving value. Complexity lives in scoped drill-downs, not a wall of terminals. The full specification is prompt 5's target experience; current application features retain their actual availability and evidence states.

Five recurring questions organize every screen: What is happening? Why does it matter? What is known? What can I do? What happened after I acted? The default home answers “What should I focus on right now?” with a short ranked focus queue, not a conversational greeting. Research, forecasts and innovation show hypotheses as hypotheses. Active execution distinguishes model access, worker availability and waiting approvals.

The visual system takes information discipline from terminal software, source/review familiarity from developer platforms, spatial inspection from design tools, and coherent operational overview from mission control. These are functional inspirations, not copied branding or literal science-fiction holograms. Avoid endless glowing rings, decorative fake live metrics, spinning intelligence or animated agent chatter that adds no actionable information.

## Client and view-model architecture

Web uses a React shell, accessible shared components and server-composed authorized view models. Routes lazy-load heavy graph/diff/simulation modules; ordinary navigation remains usable while those load. Desktop wraps the experience with explicit local directory/worker permissions and system-browser authentication. Mobile prioritizes focus, status, evidence review and scoped approvals. CLI and voice share command-intent contracts; they do not substitute for visual evidence on consequential approvals.

Each view model includes active organization/workspace/project/environment, authorized capabilities, source/context manifest, as_of, coverage, projection lag, domain values, available actions and action prerequisites. Components never invent capability availability from a catalog entry. Client navigation personalization changes emphasis, not access rights. URL state is shareable only within current permissions; identifiers cannot reveal hidden objects to unauthorized viewers.

Separate durable server data, URL-addressable view state, local ephemeral interaction state and persisted personal preferences. Do not serialize sensitive source bodies or credentials into URLs/local storage. Optimistic UI applies only to reversible personal preferences or safe draft edits; command acceptance, financial balance, permissions and deployment completion require server receipts.

## Global screen hierarchy

Organization / workspace context is always visible. Primary destinations are Focus, Projects, Swarms, Explore, Operations, Discover and Decisions. Settings sits outside operational navigation. Every specialized center is reachable through these groups and Omni Command, without displaying sixteen equally prominent top-level icons.

| Primary destination | Secondary screens |
|---|---|
| Focus | Command Center home, my attention queue, recent decisions/discoveries |
| Projects | Project list; intelligence; repository/source; architecture; dependencies; findings; plans; changes; history |
| Swarms | Swarm visualization; agent roster/detail; task DAG; conversations/debates; resources; incident teams |
| Explore | Knowledge graph; architecture explorer; memory/decisions; digital twins |
| Operations | Security SOC; developer operations; incidents; deployments; connections/workers; costs |
| Discover | Innovation Lab; future projections; research; competitors; product strategy |
| Decisions | Approval inbox; decision records; proposals/reviews; accepted risks and outcomes |
| Settings | Organization/team roles; provider connections; policies; budgets; billing; modules; accessibility/preferences |

Routes are stable, scoped and type-safe: /org/:org/workspaces/:workspace/focus; /projects/:project/intelligence; /projects/:project/repositories/:repo; /explore/graph; /explore/architecture; /explore/twins/:scenario; /swarms/:swarm/agents/:agent/tasks/:task; /operations/security; /operations/devops; /discover/innovation; /discover/future; /discover/research; /discover/strategy; /executive; /decisions/:decision. Project context may filter an organization-wide center, but action targets must be explicit.

## Shell anatomy and responsive navigation

Desktop top bar: organization/workspace switcher, project/environment scope, Omni Command trigger, activity/approval inbox, user menu. Left rail: grouped primary navigation with selected secondary route. Center: page purpose, freshness/coverage, relevant controls and ranked content. Right inspector: selected entity/evidence/actions, dismissible and deep-linkable. Bottom status appears only for active operations or connectivity, not a permanent ticker.

Use 240 px expanded rail, 72 px collapsed rail, 56 px header and 360 px preferred inspector, all tokenized. At widths below 1280, collapse inspector into a full-height sheet or full page. Below 1024, collapse rail. Below 768, use a compact header and five mobile destinations: Focus, Projects, Swarms, Inbox, More. More contains Explore/Operations/Discover/Settings. Command is a persistent labeled button in header; never an unlabeled floating ornament over content.

Breadcrumbs represent Company → Project → Swarm → Agent → Task when drilling through work, but agents may join multiple swarms. Show originating context and membership rather than inventing a permanent tree. Browser Back restores selected item, filters and scroll. Switching organization confirms unsaved work handling and resets incompatible scope; remembered personal preferences do not carry unauthorized object selections.

## Beginner and expert disclosure

Beginner default shows one recommended next action with plain rationale, effort/cost estimate, evidence and a visible alternative. “Analyze project” opens a bounded plan with scope and prerequisites. Explain agent, swarm, snapshot and simulation in context on first encounter; help remains reachable after dismissal. Do not force a tutorial to connect a repository.

Experts can pin filtered views, select compact density, inspect source/diffs, use keyboard navigation, batch eligible reviews and open parallel inspectors. Executive mode summarizes impacts; architect mode foregrounds maps; developer mode foregrounds delivery; agent management mode foregrounds workload. Mode switching preserves navigation and grants. It is not a separate account role or policy bypass.
