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
