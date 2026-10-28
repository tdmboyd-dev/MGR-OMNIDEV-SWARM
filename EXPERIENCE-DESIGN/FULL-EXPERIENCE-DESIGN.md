# OmniDev Swarm — complete experience design specification

Prompt 5. UI/UX architecture, screen hierarchy, flows, wireframes, tokens, interactions, accessibility, client layouts and expansion. Design completion is separate from live implementation and usability validation.

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


# Onboarding, Omni Command and complete user flows

## First-use journey

1. Sign in with the supported identity provider; explain this signs into OmniDev, not every AI provider.
2. Select/create organization and workspace within account permissions; choose project objective in plain language.
3. Connect GitHub or another available source through its actual consent flow. Show scopes/read-write distinction, owner and revocation path. GitHub private-app registration may be required; do not present an unsupported universal one-click provider login.
4. Choose repositories/branches and environment context; show exclusions, residency/data-handling mode and source coverage.
5. Start bounded mapping with an estimated resource budget. Progress reports collected/parsed/projected and failed/excluded scope rather than a misleading global percentage.
6. Land in project intelligence with actual mapped entities, verified/suspected findings and one suggested next step. Missing model grant/worker gives a named connection task; static mapping may still be useful.
7. Optional guided introduction to evidence, candidate review and action approval. Sample workspace is clearly labeled synthetic and can be exited without destroying real data.

Returning users see Focus with current context and unfinished attention items. Empty organizations explain “Connect a project to map its systems” with the available connection action. Disabled future connectors show Planned with what is required; they are not marked Connected.

## Omni Command interface

Command is a natural-language entry point into every registered capability, with discoverability and explicit fallback for unsupported intent. It complements visible navigation and forms. Cmd/Ctrl+K opens a modal command surface. The search field offers recent commands, navigable destinations, available actions and examples grouped by Read/Plan/Build/Operate. Do not require memorizing exact prompt wording.

A command resolves into Intent → Scope → Plan → Execution/Evidence → Result. Read-only bounded queries can execute directly after current scope is clear. Proposed changes present a plan with target project/environment/revision, expected output, costs, risk, required permissions and acceptance criteria. External effects follow exact-target approval policy; words like “fix everything” do not authorize unbounded scope or irreversible production changes.

| User example | Intent result | Honest boundary |
|---|---|---|
| Find every security issue | Scoped security analysis plan, coverage and exclusions | No promise every possible vulnerability is discoverable |
| Map my architecture | Mapping operation for selected sources/context | Dynamic/inaccessible dependencies remain unresolved |
| Show future risks | Evidence-linked risk scenarios by horizon | Forecast assumptions and uncertainty visible |
| Generate version 2 roadmap | Proposed milestone/dependency plan | Proposed future, not already-built release |
| Analyze competitors | Source-qualified competitive research | Source rights/freshness and gaps disclosed |
| Improve performance | Baseline → diagnose → candidate → test plan | Root cause and improvement need measurement |
| Create missing tests | Coverage-conditioned test proposal and isolated validation | Empty search alone is not proof missing tests |
| Build feature proposals | Objectives/gaps → alternatives → acceptance/effort | Proposal creation distinct from deploy authorization |

Ambiguous commands ask one inline targeted clarification with selectable entities/options. “This API” resolves from selection when possible. Show command interpretation as editable structured fields, not private hidden reasoning. Unknown intent suggests related supported actions and records a feature request only with user consent. Cancel stops new work; already dispatched effects reconcile with named operation status.

Command results show source citations, coverage/freshness, concise rationale, alternatives, next action and outcome. History is tenant/scoped with retention; redacted or revoked evidence cannot be retrieved through an old command. Voice input includes transcript review, captioned response and text fallback. Never deploy a consequence solely because speech recognition heard “yes.”

## Core journeys and recovery

| Journey | Steps and screens | Required failure handling |
|---|---|---|
| Investigate critical finding | Focus item → SOC evidence → affected graph → remediation proposal → independent tests → review | Stale source, disputed finding, unavailable sandbox or denied grant remain explicit |
| Build a feature | Strategy opportunity → requirement → plan DAG → swarm execution → candidate diff/tests → approve draft PR → observe | Plan rejection, budget exhaustion, conflict, missing provider auth and unknown PR side effect |
| Diagnose API latency | Project endpoint → performance trace → dependency/decision history → experiment → measured result | Telemetry absent means insufficient evidence, not invented root cause |
| Compare architecture | Architecture explorer → select baseline/candidate → diff impacts → decision record | Partial graph or unresolved calls yields coverage warning and scoped analysis |
| Simulate before change | Candidate → twin scenario → assumptions/fidelity → execute → compare → review | Simulation failure preserves inputs; low fidelity cannot certify safety |
| Executive review | War room → risk/value portfolio → evidence drill-down → decision → outcome | Unknown scores/missing business data remain unknown |
| Manage agents | Swarms → agent detail → activity/grants/resources → pause/drain/retire | Busy work drains; paused agent does not imply production effect undone |
| Respond to emergency | Trusted alert → incident command → expert roster/plan → approve applicable action → verify sustained recovery | Unknown effects/failing rollback/insufficient owner authority block unsafe replay |
| Evaluate innovation | Innovation hypothesis → novelty evidence → prototype/experiment → decision → learning | No claim of patentability or guaranteed startup success |
| Research and remember | Research question → sources/disputes → synthesis → reviewed memory/decision | Restricted source cannot become globally shared through summary |
| Forecast future | Future dashboard → horizon/scenario → assumptions → compare → roadmap | Forecast and actual outcome remain separate; expired predictions labeled |
| Install pack | Module detail → compatibility/grants/license → stage/evaluate → activate | New permissions require actual consent; icon alone does not mean executable engine |

## Approval and trust interaction

Approval surface displays action verb, exact target/environment/source revision, candidate digest, what changes, evidence/tests, expected cost/blast radius, outstanding objections, rollback limits and accountable signer. Separate “Approve proposal” from “Approve deployment.” Defaults never silently include additional environments. Batch approval is available only for compatible low-risk items with visible individual evidence and common policy; high-impact actions remain individually reviewable.

Reauthentication may be required by configured action policy, with accessible password manager/paste/system-browser support. Stale revisions cause a review-refresh path, preserving annotations but invalidating approval. Permission denied explains the needed role/action without leaking forbidden object details. Undo applies only where a tested compensating action exists; otherwise provide reconciliation/history and the appropriate next step.

Notifications are actionable, deduplicated and severity-adjustable. Critical user-impact alerts may interrupt according to preferences and role; repeated agent updates remain in activity feed. Quiet hours respect timezone except configured emergency policy. No manufactured urgency or pressure to approve autonomous actions.


# Home, project workspaces and repository intelligence

## Command Center home wireframe

Desktop uses a 12-column grid. Header states organization/scope, date/as_of and visible coverage. The primary top block is a 7-column Focus queue; the adjacent 5-column project/organization health panel explains coverage and trend. Below: active projects (7 columns), swarm activity and approval needs (5). Final row groups opportunities/discoveries and future signals, with “View all” instead of endless tiles.

| Home region | Content and action |
|---|---|
| Focus now | Top three ranked items: critical issue/security alert/decision blocked; reason, owner, evidence, next step |
| Health summary | Project health and executive scores with coverage, freshness and contributing verified findings |
| Active projects | Current objective, source status, outstanding risks, active/waiting work and last verified result |
| Security and critical issues | Integrated into Focus plus SOC shortcut; do not duplicate the same alert five times |
| Swarm activity | Running/queued/waiting counts, named blockers and reserved/actual resource use |
| Innovation opportunities | Top evidence-backed hypotheses, objective/value assumption and experiment status |
| Recent discoveries | Accepted findings/lessons with source and project; no fake live scrolling |
| Future predictions | Conditional scenarios/horizons and major changing assumptions |
| AI recommendations | Inline recommendation tied to each focus item, with rationale and alternative |

Prioritization uses criticality, deadline, dependency blocking, objective relevance and authorized scope. Users can pin/defer with reason/date; severe risks cannot be hidden by ordinary recommendation tuning, but risk acceptance follows an explicit decision workflow. “Nothing urgent” is a valid state; do not invent danger or inflate health.

Loading shows stable skeleton regions and stage labels. Empty, restricted, partial, stale, offline, rate-limited and unavailable states are distinct. Unknown values display “Not measured”/“Insufficient evidence,” never 0 or a green 100. Portfolio counts are access-filtered. Busy home does not resort while keyboard focus is inside a row; new items accumulate with a refresh indicator.

## Project workspace hierarchy

Project header: project name, repositories/services/context, environment, branch/release, data as_of, source coverage and connection states. Tabs: Intelligence, Source, Architecture, Dependencies, Findings, Work, Twins, Roadmap, Memory. Each tab preserves project context and selected entity through deep links. Settings/connections are accessible but not mixed with daily analysis.

Project Intelligence top row offers four compact health summaries (security/performance/architecture/innovation) and overall coverage. Center left is bounded architecture map with table toggle; center right shows prioritized technical debt/gaps and active work. Lower sections: revenue opportunities, missing features, recommendations and future scenarios. “See everything instantly” means overview and immediate paths to detail, not all files/metrics loaded at once.

| Required project information | Representation |
|---|---|
| Architecture map | Typed services/components and boundaries, pinned context and unresolved links |
| Dependency map | Direct/reverse dependencies, version/advisory/impact filters |
| Security score | Scoped score and verified findings/control coverage; not compliance certification |
| Performance score | Measured latency/error/resource evidence or Not measured |
| Innovation score | Validated opportunity/experiment rubric with uncertainty |
| Revenue opportunities | Business hypotheses with baseline/assumptions and experiment link |
| Technical debt | Explicit findings, effort ranges, impact, owner and accepted exceptions |
| Recommendations | Objective-linked action with evidence and prerequisites |
| Missing features | Requirement/coverage-conditioned gaps, not automatic keyword absences |
| Future predictions | Scenario cards and roadmap branches with horizons/uncertainty |

## Repository intelligence layout

Desktop has a resizable file/symbol tree, central code/diff viewer and evidence inspector. Tree supports filenames, symbols and packages with exact search. Breadcrumb includes repository/branch/commit. A language parser badge shows validated/static/heuristic/incomplete coverage. File selection reveals imports/calls/tests/decisions/owners. Source spans cite pinned digests rather than a moving branch link.

Code uses accessible syntax colors, selectable text, line navigation and semantic search with exact symbol results. Show author, committer and deployment actor separately. Candidate diff has file status including create/rename/delete, review comments, test receipts and conflict state. “Apply”/“Create PR”/“Deploy” are separate actions with exact targets. No hidden action inside a graph click.

Findings list defaults to severity plus evidence state, with filters for domain/status/context/owner. Detail shows symptom, source evidence, confidence, affected scope, remediation proposal and acceptance test. A finding marked “Resolved” requires current evidence; legacy heuristic finding is visibly labeled. Tables virtualize large collections with keyboard/readable accessible pagination alternative.

Work tab shows objectives, task DAG, candidate artifacts, reviews and actual effect receipts. Progress is earned from completed acceptance stages; use “4 of 7 scoped tasks verified” rather than implying 57% of an entire software project is complete. Memory tab links decisions, bug history, lessons, conversations and disagreements with current access checks.


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


# Digital twin, future, security, innovation and strategy centers

## Digital Twin Center

Layout: scenario/baseline selector at top; assumptions editor left; comparison canvas center; outcome/evidence inspector right; execution history below. Scenario types include feature release, scaling, security incident, infrastructure change, database change, traffic/failure and business process. Input values show units, source/baseline, range and whether measured or assumed.

Before running, show fidelity level (inventory-only, executable staging, calibrated or continuously validated), covered components, excluded dependencies, data handling, resource budget and expected duration. Run is disabled only with a named actionable prerequisite; low-fidelity preview can run with clear limits. Output separates cost/revenue/performance/security/scaling results, uncertainty and model assumptions. Before/after charts show baselines, distributions/ranges where supported and confidence methodology; no fake precise revenue number from illustrative parameters.

Comparison supports baseline/candidate/scenario and parameter sensitivity. Failed simulation preserves inputs/log/evidence and suggests retry/change within policy. “Create change proposal” transfers scenario/evidence into review; “Deploy” is a separate exact-target approval with current revision checks. Simulation success cannot bypass real tests and policy gates.

## Future Prediction Dashboard

Top segmented horizons: 1, 3, 5 and 10 years, with base/upside/downside or named user scenarios. Header shows issued date, assumptions, evaluation status and baseline. Five sections: opportunities/threats, technical evolution, market evolution, business expansion and predicted outcomes. Roadmap lane links version milestones to prerequisites and decision owners.

Temporal chart distinguishes observed history from forecast region with textual labels and uncertainty band. Long-range values may be qualitative scenarios when calibration cannot support numeric probability. Assumption change highlights affected forecasts; previous issued predictions remain retrievable with outcome evaluation. Users can turn a forecast into a research question or roadmap proposal. No “guaranteed future” copy.

## Security Command Center / SOC

Top strip: active incidents, verified critical exposure, control coverage and evidence freshness. Main view combines threat/attack-surface map and prioritized findings queue. Secondary panels cover vulnerabilities, credential exposure (redacted), dependencies/supply chain, misconfiguration/compliance risks and remediation work. Heat map uses severity and confidence as distinct dimensions. Show affected context/revision, owner and applicable evidence.

Finding detail: source, verification method, attack path where supported, impacted resources, proposed control/fix, test requirements, accepted exceptions and expiry. Credential values never display in ordinary finding cards; actual revocation/rotation tools require scope. Compliance view is control evidence/gaps and audit workflow, not universal certification. Security labels do not expose forbidden repositories through counts or attack edges.

Autonomous actions ledger shows planned/authorized/running/verifying/reconciled states, exact target and runbook, approver/policy, expected versus actual outcome and rollback limits. Emergency actions use configured preauthorization; a red alert does not unlock every destructive control. SOC live feed can pause visual updates while background monitoring continues.

## Developer Operations Center

Focus on delivery/operations: deployment pipeline, candidate/review/test evidence, SLOs, incidents, workers/provider status and resource/cost. Environment is prominent. Release detail binds source commit, artifact digest, migrations, canary and rollback strategy. “Succeeded build” is distinct from deployed and healthy. Provider outage/worker absence remains a real blocker; user can inspect available alternatives without silent fallback. Error logs are redacted and correlate to traces/evidence.

## Innovation Lab

Stage lanes: Discovered → Evidence → Proposed → Prototype → Experiment → Validated/Rejected/Deferred. Cards cover new features, products/startups, revenue ideas, market opportunities, patent concepts and future technologies. Each has objective, authorship/source rights, novelty hypothesis, evidence, assumptions, effort/cost, downside and next experiment. Patent concepts show qualified review needed; do not claim legal novelty from model generation.

Users compare alternatives, request research/prototype, assign owners, record go/no-go and inspect lessons. Rejected ideas stay searchable with rationale, not cluttering active lanes. “Tomorrow” is visual/strategic possibility with evidence, not pressure to fund an untested idea. Discovery feed is curated by relevance and validation rather than raw volume.

## Product Strategy and Research Centers

Strategy links objectives → customer/funnel evidence → opportunities → requirements → roadmap → experiments/outcomes. Prioritization exposes criteria/weights and uncertain effort/value. Customer interactions minimize personal data and respect authorized sources. Competitive position uses dated/source-qualified evidence, not invented competitor internals. Roadmap moves preserve dependency/risk checks and keyboard move alternatives.

Research center shows questions, source coverage, findings/disputes, methods, freshness, rights and review status. Reading/sourced/specification states are distinct. Answer citations open pinned evidence inspector. Promote memory and share globally are separate consented workflows. Research progress measures known scoped tasks; it cannot imply all knowledge has been studied.

## Executive War Room

Primary panel answers the three decisions requiring leadership attention, with short impact/rationale/evidence. Portfolio shows company/product health, security, innovation pipeline, growth/forecast and strategic risks. Revenue opportunities and competitive position link to tested assumptions and dated sources. Future roadmap shows milestones and dependencies rather than an unqualified optimistic timeline.

Scores include coverage/freshness and critical-risk flags. Drill-down travels from business impact to project/system/evidence; executives are not forced into code unless they choose it. “Approve strategy” does not mean “deploy all code.” Brief export includes context/date/assumptions and links to authorized records. No decorative war imagery is required; the “war room” is disciplined decision-making.


# Visual language, design tokens and interaction system

## Omni visual identity

Extend the existing charcoal/forest canvas, pale mint primary accent, teal system intelligence and violet future/innovation. Use sharp information hierarchy, quiet boundaries, readable typography and restrained geometry. Graphs sit on subtle grids only when useful for orientation. Surfaces use mostly opaque backgrounds; blur/glass effects must not compromise contrast or performance. Dark is default, light and high-contrast themes are complete functional themes.

Semantic colors mean status; category colors mean entity type. A violet AI model is not automatically a forecast or warning. Status appears through label and icon as well as color. Avoid neon gradients behind body text. Primary action is visually strongest once per decision region; destructive effects are not indistinguishable from ordinary accent buttons.

| Token family | Specification |
|---|---|
| Dark surfaces | canvas #0C1110, surface #121916, elevated #18211C, inset #0F1512 |
| Light surfaces | canvas #F5F8F6, surface #FFFFFF, elevated #EAF1EC, inset #EEF4F0 |
| Text | dark primary #E7ECE8, secondary #B5C3B9; light primary #15251B, secondary #445A4B |
| Primary action | dark mint #C9F58C with ink #172113; light forest #245A39 with white text |
| Semantic dark | success #B8E99A, warning #F1C17A, danger #FFA5A5, info #94D7CB, forecast #C8B7F0 |
| Borders | quiet dark #29342D for decorative division; interactive border #708879; light interactive #728476 |
| Focus | dark #D8FFAD, light #245A39; 2 px solid outline plus 2 px offset, visible against adjacent surfaces |
| Typography | System sans Segoe UI/Inter-compatible fallback; ui-monospace for code/IDs; no external font required |
| Scale | 12 caption, 14 secondary, 16 body, 20 section, 28 page, 36 portfolio display; line height 1.45–1.6 |
| Spacing | 4, 8, 12, 16, 24, 32, 48, 64 px; compact density reduces spacing, not text to illegibility |
| Radius | 4 small, 8 controls/cards, 12 inspector/dialog; no arbitrary pill for every surface |
| Elevation | layering primarily border/contrast; limited shadow on dialog/popover; no glowing status shadows |
| Motion | 120 ms micro-feedback, 180 ms panel, 240 ms scope transition; reduced-motion removes movement/pulses |
| Target sizes | 44 px preferred touch/button target; dense desktop may use WCAG-compliant ≥24 px or sufficient spacing |
| Layout | 12 desktop/8 tablet/4 mobile columns, 24/16/12 px gaps; shell dimensions from chapter 1 |

Tokens are machine-readable in contracts/design-tokens.json. Every theme variant must pass contrast validation; listed primary text/status values are checked against surface backgrounds. Low-contrast quiet borders are decorative only. Interactive controls use stronger borders/focus and shape/state cues.

## Component contract catalog

| Component | Required behavior and states |
|---|---|
| ScopeSwitcher | Org/project/environment, visible target, searchable accessible options; changing scope preserves/saves drafts safely |
| OmniCommand | Labeled combobox/search, keyboard list navigation, scope/intent preview, read versus effect distinction |
| FocusItem | Severity/why/owner/evidence/next action; pending, disputed, stale and resolved |
| ScoreCard | Value or unknown, trend, rubric, coverage/freshness and drill-down; no false green defaults |
| StatusBadge | Text/icon/color, separate execution/evidence/connection/forecast semantics |
| EvidenceCard | Pinned source span, timestamp/method, uncertainty/access and open-inspector action |
| Recommendation | Objective/rationale/alternatives/prerequisites/risk/cost; accept creates appropriate proposal |
| EntityInspector | Identity, relationships, decisions, sources and available authorized actions; responsive full-page variant |
| GraphCanvas | Bounded nodes/edges, search/zoom/time/filter, selection and equivalent table |
| TaskDAG | Dependency states/owner/acceptance, keyboard node navigation and linear list |
| AgentCard | Lifecycle/activity/health/grants summary with samples/unknown and context |
| DebatePanel | Alternatives/criteria/arguments/evidence/dissent/quorum; role slots and exact revision |
| DiffReview | File additions/deletions/renames, source revision, independent comments/tests and conflict |
| ActionReview | Exact target/digest/risk/expected outcome/cost/approval/rollback limits |
| SimulationCompare | Baseline/assumptions/fidelity, ranges, units and result evidence; no fabricated precision |
| Timeline | Observed versus scenario, valid/known time and version; slider plus direct date/version controls |
| DataTable | Sort/filter, pagination/virtualization, stable focus, explicit row actions and accessible column labels |
| ActivityStream | Cursor/lag, pause/resume visual updates, accessible bounded announcements and replay |
| Empty/Error/Partial | Named cause, recovery action and preserved user input; permission errors do not leak objects |
| Dialog/Sheet | Named heading, focus management, escape/close, return focus; policy-sensitive flow doesn't rely on accidental dismissal |
| Toast/Notification | Nonblocking outcome; persistent important evidence elsewhere; no transient-only critical error |

## Interaction and status grammar

Read actions use Open/View/Inspect/Compare. Planning uses Propose/Analyze/Plan/Simulate. Effectful actions use Apply/Create PR/Deploy/Revoke with explicit target. Avoid generic “Run AI” for every capability. Loading reports what is waiting and a cancellable operation when possible. Optimistic acceptance shows Submitted, not Completed. Display receipt time and source age separately.

Connection status: Available to connect, Consent pending, Connected read-only, Write-authorized, Expired, Revoked, Unavailable. Evidence status: Observed, Human asserted, Inferred, Hypothesis, Forecast, Disputed, Retracted. Execution: Queued, Running, Waiting provider, Waiting worker, Waiting approval, Reviewing, Succeeded with evidence, Failed, Canceled, Reconciling. These vocabularies are not interchangeable.

Keyboard: Cmd/Ctrl+K command; Escape close popover/sheet or leave selection; slash focuses local search only outside editable fields and with shortcut disable option. Tab follows document order. Graph arrows/enter apply only when graph widget focused; global shortcuts do not trap ordinary navigation. Expert shortcut help is searchable and remappable where possible. No destructive single-key command without policy review.

Batch interactions show selection count, common action, mixed-state exclusions and per-item evidence. Drag operations always have menu/keyboard alternatives. Tooltips never carry the only explanation or action; popovers support focus/hover dismissal. Saved views store filters/layout, not permissions. Unsaved edits get recoverable draft handling. Error copy explains cause and next step in plain language rather than internal framework names.


# Accessibility, desktop/mobile and role modes

## Accessibility target and verification

Target WCAG 2.2 AA across complete journeys. This is a requirement, not a certification. Use semantic HTML, accessible names, visible labels and robust focus; avoid adding ARIA where native controls suffice. Body text contrast ≥4.5:1, large text ≥3:1, meaningful nontext controls/states ≥3:1 against adjacent color. Focus is visible and unobscured. Status information cannot rely only on color, position, sound or animation.

All functionality has keyboard access and no unintended trap. Dialogs set accessible title/description, manage focus appropriately, contain modal interaction and return focus to trigger or logical next control. Command autocomplete follows a tested combobox/listbox pattern with clear expanded/selected state. Screen-reader announcements report completed stage/error/bounded update, not every event in a million-agent stream. Graphs/charts have summaries and authorized data tables; selection/actions available without canvas gestures.

Support 200% zoom, text spacing changes and reflow at 320 CSS px with exceptions only for genuinely two-dimensional diagrams/tables paired with navigable alternatives. Touch controls favor 44 px; dense desktop targets meet minimum-size/spacing requirements. Tooltips and contextual information are available on keyboard focus and can be dismissed. Password manager/paste and accessible authentication options are supported; no required memorization puzzle without accessible alternative.

Reduced-motion disables panning animation, pulsing agent activity, parallax and simulated data flow; no flashing alert visualization. Theme follows preference with explicit override and persistent settings. High-contrast/forced-colors retains borders, focus, selection and icons. Voice has text input/output and captions; media/research recordings require appropriate captions/transcripts/descriptions. Errors connect to fields and an error summary; budgets/units are labeled.

Validate automated checks plus human keyboard/screen-reader/magnification tests on real implemented flows. Required journeys: sign-in/connect project, command clarification, evidence inspection, graph/table navigation, candidate review, approval/revision conflict, emergency recovery, agent pause/retire and mobile inbox. Test representative VoiceOver, NVDA and TalkBack combinations, browser zoom, reduced-motion/forced-colors and touch. A token contrast script cannot prove complete accessibility.

## Desktop layouts

Wide 1440–1920: expanded rail, 12-column content and optional right inspector. Operational screens favor master/detail; maps fit center but default to meaningful bounds. Engineering diff can switch to focus mode hiding decorative/navigation density while context/target stays visible. Multi-monitor desktop may open scoped evidence windows; each retains active organization/environment and independent current authorization.

Laptop 1024–1439: collapsed rail optional, 8/12-column content, inspector sheet or separate route when center becomes too narrow. Do not shrink text until all panels fit. Tablet 768–1023: navigation drawer, 8 columns, cards/master-detail stack; graph inspector takes full secondary page. Pointer and touch may coexist. Desktop local bridge asks explicit path/device scope and shows what is local versus remote.

## Mobile layouts

Portrait 320–767: 4-column stack; top context/command, Focus list, compact health summary, projects/work and discoveries in ordered sections. Bottom nav Focus/Projects/Swarms/Inbox/More with safe-area spacing. Mobile project uses scrollable tab selector with labels; never hides key context or approval warnings beneath a sticky bar. Charts use small multiples/table; graph opens full-screen and defaults to selected neighborhood or list.

Agent management on mobile shows status, blocker, current tasks and explicit pause/drain. Deep code editing/multi-panel architecture is supported through read/review and optional desktop handoff, not forced into a tiny mirrored desktop. High-impact approval shows exact target/evidence/cost with scroll landmarks, current revision and policy-required reauthentication. Push opens the authorized incident/decision, not instant approve buttons detached from evidence.

Offline reads show Cached/as_of and avoid sensitive overcaching. Expired sessions redact protected views. Draft comments may save encrypted locally if policy permits; production approvals/effects do not silently queue for later replay. Reconnect rechecks grants/source revision and explains conflicts. Poor networks retain inputs, show download/operation status and offer retry with idempotency, not duplicate actions.

## Role modes as lenses

| Mode | Default home and emphasized tools | Maintained access/evidence rules |
|---|---|---|
| Executive | Leadership focus, company/product health, revenue/innovation, security, competitive/future risks and decisions | Coverage/uncertainty/approvals remain; no executive assumption of unrestricted data |
| Developer | Project work, source/diff/tests, task DAG, operations, blockers and PR/release candidates | Exact target/source revision, worker/provider status and independent evidence |
| Architect | System/dependency boundaries, timeline comparisons, decisions, twins and future migrations | Inferred/forecast edges visible; impact analysis coverage preserved |
| Agent management | Swarm clusters, agents/skills/modules, tasks/debates, grants, health and resource budgets | Trust distinct from authority; pause/retire/reorganize semantics enforced |

Beginners get descriptive labels and lower density in every mode. Experts opt into compact tables, pinned commands, advanced filters and raw receipts. Users may switch lenses without losing work or changing roles. Managers cannot hide safety-critical uncertainty by choosing executive mode. Mode controls are an accessible menu, not a puzzle of abstract symbols.

## Human systems and cognitive load

One primary decision per region, related actions beside evidence, stable layout, progressive disclosure and predictable Back. Show at most three default focus items and let users reveal more. Group notifications by issue/root work; avoid ten agents asking the same question. Surface disagreement as a manageable decision with alternatives, not dozens of raw transcripts. Avoid anthropomorphic promises of infinite memory/trust and unjustified agent emotions.

Usability gates: first-time user can connect a project and find its first evidence-backed recommendation without developer help; executive can explain top risk and why a score is uncertain; engineer can locate source/test evidence and distinguish proposal from deployment; operator can identify provider/worker/approval blocker; keyboard-only user can complete the same key journeys. Measure success/errors/time and interview comprehension, not only clicks or session duration. Targets are set before testing and revised from evidence, not invented achievements.


# Future expansion, implementation handoff and verification

## Extensible experience contracts

Each new domain/integration/module registers namespaced navigation, typed view models, entity/graph semantics, command intents, prerequisites, action risk, permission selectors, evidence requirements, component surfaces and localization keys. Host decides placement; plugins cannot create unchecked top-level clutter or bypass the command/effect system. UI extensions use sandboxed bridge APIs with approved data and no ambient credentials.

Future clients may add spatial/voice/immersive views, but ordinary accessible text/table/navigation remains authoritative. 3D visualizations are optional tools for actual spatial/scene understanding, not mandatory decoration. New capabilities appear as available only after corresponding backend/grant/worker gates pass; planned features stay clearly labeled. Marketplace installation may add skills/intents after review, not a fake all-powerful “enabled” badge.

## UI implementation order

| Stage | Deliverable | Evidence required |
|---|---|---|
| U1 | Semantic tokens/themes, shell/scope/navigation and common states | Contrast, reflow, keyboard/context persistence and authorized routes |
| U2 | Focus/home and project intelligence from real view models | No fabricated metrics, useful rank/evidence, partial/empty/stale states |
| U3 | Omni Command read/plan/clarify and action review | Intent/scope accuracy, prerequisites, no effect bypass and accessible dialog |
| U4 | Repository/diff/findings/work evidence | Correct pinned source/tests, revision conflicts and safe cancellation |
| U5 | Graph/architecture/swarm explorers with table equivalents | Bounded performance, no inference leak, temporal/selection consistency |
| U6 | Twin/future/innovation/research/strategy centers | Fidelity/uncertainty, source rights, hypothesis/outcome distinction |
| U7 | SOC/devops/incident/agent command centers | Actual receipts, emergency policy, grants versus trust, live lag accuracy |
| U8 | Executive/mobile/desktop lenses and local bridge | Real-device/user accessibility, context/approval and offline safety |
| U9 | Plugin surfaces/global expansion/localization | Compatibility, permission isolation, locale/time/unit and resilience tests |

Current live console is preserved as the implementation entry point. The wireframe atlas is a static design artifact using synthetic annotations; it does not replace production screens, connect providers or simulate real execution. No backend catalog item is marked complete because a wireframe exists. The unfinished-work folder stays the canonical implementation register.

## Screen inventory and wireframe contract

Seventeen screen families are supplied: Home, Project Intelligence, Repository Intelligence, Agent Control, Swarm Visualization, Architecture Explorer, Knowledge Graph, Digital Twin, Innovation Lab, Future Dashboard, Security SOC, Developer Operations, Product Strategy, Research, Executive War Room, Omni Command and Mobile Focus. Each static diagram labels context, major regions and primary action. Prose supplies detailed behaviors and secondary/error states; the diagrams are spatial specifications rather than high-fidelity screenshots of working features.

The shared component catalog, semantic state definitions, machine-readable tokens, screen catalog and command-intent catalog form the handoff. Wireframes have text labels, SVG title/description and readable region hierarchy. A wireframe visual check verifies artifact layout only, not user-flow usability or production WCAG conformance.

## Acceptance matrix

| Domain | Required implemented verification |
|---|---|
| Navigation | All screen families reachable; Back restores filters/selection; scope visible and reauthorized |
| Home | Correct ranked focus, no duplicate critical alert spam, unknown scores and source coverage |
| Command | Every supported capability discoverable, ambiguous intent clarified, correct target and bounded plan |
| Project/repository | Evidence/source version exact, changes/tests/findings linked, no fake completion |
| Graph/architecture | Table parity, typed/inferred/forecast distinctions, bounded rendering and current authorization |
| Swarms/agents | Company-to-task drill-down, dynamic membership, grants/health/trust separate, drain/reconcile states |
| Twin/future | Inputs/fidelity/uncertainty, observed versus projected results and no deploy shortcut |
| SOC/devops | Redacted credentials, verified exposure, incident/action receipts, environment/rollback limits |
| Innovation/strategy/research | Hypothesis/validation/source-right distinctions, alternatives/outcomes and useful next experiment |
| Executive | Business-impact drill-down, all health/portfolio panels, coverage and uncertainty |
| Accessibility | Complete WCAG 2.2 AA evaluation across key journeys, keyboard/screen reader/reflow/touch/reduced motion |
| Mobile/desktop | Real breakpoints/device safe areas, evidence-based approval, local bridge and offline restrictions |
| Performance | Reference datasets, virtualized tables, bounded maps, low-end devices and reconnect/update pressure |
| Privacy/security | Route/stream/filter/export/cache access checks, no hidden counts or revoked-source leaks |
| Plugin expansion | Reviewed navigation/intents, permission/runtime isolation and compatible upgrade |

Performance design targets: immediate local input feedback, navigation shell under 300 ms warm client state, interactive map frames near 60 fps on qualified desktop workload (100 visible nodes/300 edges initial), reduced visible graph budget on mobile, server retrieval SLOs disclosed from prior architecture. These are targets, not measured user performance. Complex views paginate or defer analytics instead of sacrificing correctness/accessibility to animation.

## Research and design decisions

Primary sources reviewed October 8–9, 2026: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WAI combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). Standards guide accessibility requirements and keyboard/focus behavior; OmniDev layouts, visual tokens and priorities are original product decisions. No user study or complete accessibility audit is claimed performed.

UX-ADR-01: One unified shell with grouped destinations; mode is a lens, not authority.

UX-ADR-02: Focus/evidence/action/outcome hierarchy; avoid a screen of equally urgent tiles.

UX-ADR-03: Preserve observed/inferred/hypothesis/forecast and connection/execution distinctions everywhere.

UX-ADR-04: Bounded map/table parity and accessible drill-down; no billion-node browser fantasy.

UX-ADR-05: Natural language creates typed intents; effect approval remains exact-target and policy-bound.

UX-ADR-06: Dark/light/high-contrast themes with measured tokens; restrained futuristic design.

UX-ADR-07: Mobile prioritizes monitoring/review/decisions with honest desktop handoff for dense creation work.

UX-ADR-08: Current app remains intact while design specifies full target scope; future labels cannot misrepresent implementation.

Follow-up qualification queue: representative beginner/executive/engineer/operator usability studies; screen-reader/device testing; implemented live-view contrast/focus checks; low-end graph/table workload; command interpretation/error recovery and actual backend/prerequisite integration. These are production implementation gates, not unfinished prose design.
