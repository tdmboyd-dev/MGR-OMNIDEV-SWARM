# Runtime project selection repair and targeted discovery — October 29, 2026

## What changed

The Agent runtime and Self healing tabs could use the first project while the owner was looking at **All projects** or a removed selection. The main planning screens had already stopped doing that, but this runtime component still had its own fallback.

New work now requires one explicitly selected, existing project. Switching projects clears the previous integration/audit view. Responses that arrive after a selection change cannot start additional work for the old selection or appear as the new project's plan. Already-dispatched server requests remain saved; this fix does not claim to cancel work that has already reached a provider.

The same repair stops a failed repository audit from silently continuing into job creation. It checks that a returned audit belongs to the chosen project and refuses deleted integration partners.

## Verification

The **same 18 callback-interaction cases** produced **3 passes / 15 failures before** and **18 passes / 0 failures after**. The tests execute the actual compiled RuntimeWorkspace component with controlled hooks, element events and deferred network replies. They exercise the generated requests and state changes. They do not merely search source text for expected strings.

Successful current-project native launch, integration execution and complete audit progression remain covered. Negative cases include All projects, empty/deleted targets, removed partners, old callbacks, delayed replies, switching away and back, failed/mismatched audits, and unmounting during a request.

Exact commands, source/test hashes, raw failure/pass logs and the two corrected test-development issues are recorded in `evidence/runtime-project-scope-20261029/verification.json`. These are working-source receipts pending the coordinator's clean commit and full regression. The Chromium executable is absent, so no browser, focus, screen-reader, live provider or release qualification is claimed.

Original clauses addressed in a bounded way: **UX-01/AC-01, UX-03/AC-01, DEV-01/AC-02**. No original parent or clause is automatically promoted.

## What the 38 unlinked records actually mean

| Recorded group | Count | Current interpretation |
|---|---:|---|
| Connector catalog registrations | 34 | Generic server binding infrastructure exists; no application/worker entrypoint invokes these integrations. Provider discovery, incremental readback and revocation still need implementation and qualification. |
| BIZ-01 | 1 | Shared memory, findings and planning exist; objective-linked business observations and prioritization are incomplete. |
| BIZ-02 | 1 | Newer structured future-planning code is a real partial implementation lead, detailed below. |
| LEGAL-01 | 1 | Specialist review contracts exist; jurisdiction/control evidence collection and qualified interpretation remain incomplete. |
| REL-03 | 1 | The prior Vercel readback was denied; that establishes an access limitation, not absence of running resources. |

The 34 connector IDs are CONN-02–04, CONN-08–12 and CONN-14–39. The complete ID/title list and inspected entrypoints are in the adjacent JSON. This work changes no canonical source-link total or historical status.

## Newer BIZ-02 implementation found

The older unlinked report was based on the c448 source checkpoint. Later planning work introduced useful behavior in `lib/workspace-planning.ts`, `components/planning-workspace.tsx`, `app/api/workspace/route.ts`, `app/page.tsx` and `lib/intelligence.ts`.

The V10 horizon now requires a competing-solution comparison, independent problem observations, a predeclared experiment threshold, explicit stop conditions and retained outcome observations. Its evidence cites the current project and its language keeps demand, revenue and novelty unknown. The saved proposal and later evaluation keep their distinct source context.

That is **partial implementation**, so rebuilding the same planning/evaluation system would waste work. It is also not the complete innovation feature: actual dated competitor evidence, typed experiments, measured independent results, privacy/retention controls and evaluated recommendation usefulness remain unfinished. Add those capabilities to the existing lifecycle.

Original BIZ-02 acceptance wording remains unchanged:

1. “Proposals include sources, competing solutions, validation plans and experimental results.”
2. “The system does not claim that nobody has built something without evidence.”

No full acceptance is claimed from this source discovery. The next canonical update should record the existing files as a qualified partial lead and retain the missing capability list.
