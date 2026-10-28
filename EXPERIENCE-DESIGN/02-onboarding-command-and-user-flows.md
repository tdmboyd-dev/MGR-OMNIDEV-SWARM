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
