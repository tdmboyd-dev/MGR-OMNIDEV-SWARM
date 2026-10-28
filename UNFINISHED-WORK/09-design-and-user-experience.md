# Design And User Experience

All items below are open. See [README.md](README.md) for status definitions and resume rules.

## UX-01 — Audit the existing interface and journeys

**Priority:** P0 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Dark command center and runtime/account flows are implemented; visual/browser QA has not been performed.

**Work required:**

- [ ] Review information hierarchy, navigation, labels, empty/loading/error states and interrupted work.
- [ ] Verify GitHub registration → install → sign-in → repository selection → import return journey.
- [ ] Check provider availability language, review/PR actions and clear separation of definitions, proposals and execution.
- [ ] Remove obsolete copy and review unused UI state/imports after account-first changes.

**Finished when:**

- [ ] Critical tasks can be completed with clear success/failure/recovery states.
- [ ] Screens never imply unverified connectivity, test evidence or autonomy.

**Depends on:** No prerequisite task recorded.

**Starting files:** `../app/page.tsx`, `../components/runtime-workspace.tsx`, `../app/globals.css`

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## UX-02 — Complete accessibility and responsive verification

**Priority:** P0 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Responsive styles and component primitives exist; no measured accessibility audit is complete.

**Work required:**

- [ ] Test keyboard flow, focus return, dialogs, select controls, semantic labels and screen-reader feedback.
- [ ] Check contrast, readable type, reduced motion, zoom to 200%, mobile/tablet and narrow layouts.
- [ ] Review graph accessibility, text alternatives and status announcements.

**Finished when:**

- [ ] Representative viewport and assistive-technology journeys pass with recorded findings.
- [ ] All critical actions work without a mouse.

**Depends on:** UX-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.

## UX-03 — Design the missing advanced working surfaces

**Priority:** P1 · **Type:** engineering · **Owner:** Unassigned

**Current state:** Current graph, twin, memory and future views show the implemented foundation, not full-system tools.

**Work required:**

- [ ] Design swarm lineage/tool approvals, worker health, connection sync, incident diagnosis and deployment plans.
- [ ] Design semantic graph search, timeline/history, twin comparisons, executive evidence and innovation experiments.
- [ ] Add prototypes tied to real backend states; avoid presenting decorative demo values as live systems.

**Finished when:**

- [ ] Each new surface has task-based acceptance criteria and maps to implemented data/actions.
- [ ] Usability review covers real target users and failure paths.

**Depends on:** UX-01, GRAPH-01, OPS-02, TWIN-01

**Completion evidence:** None yet. Add commit, tests, artifact/provider read-back and remaining limitations before closing.
