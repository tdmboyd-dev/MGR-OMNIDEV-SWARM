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
