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
