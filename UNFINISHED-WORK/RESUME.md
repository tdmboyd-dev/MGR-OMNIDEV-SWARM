> **Current checkpoint — October 29, 2026:** [The planning/Imprint repair report](mgr-planning-imprint-wave-20261029.md) records the latest tested source. OmniDev passed 58/58 profiles; canonical states are 122 open and 52 implemented_unverified. Eleven local clauses are reproduced; no original parent is independently certified. Start from the existing root HANDOFF and MGR-TRILOGY-HANDOFF. Older checkpoint entries below are history. The owner requests concrete unfinished features, not aggregate shorthand.

> **Current checkpoint — October 29, 2026:** The [full verification and repair report](mgr-full-verification-wave-20261029.md) supersedes older state claims below. The clean source run passed 54/54 profiles. Canonical records now contain 123 open and 51 implemented_unverified parents, 136 source-linked and 38 unlinked, seven separately verified local contracts, and zero independently certified parents. All 174 original IDs and 441 acceptance clauses remain unchanged. Start from root HANDOFF.md, the current implementation index, and the exact criterion register; keep older details as historical context.

# Resume instructions

1. Read README.md, current-state.md, decisions.md and implementation-order.md in this folder.
2. Inspect the current repository and published version; do not assume the baseline commit is still current.
3. Select a prerequisite-ready task, assign an owner and set its JSON/Markdown status to in_progress.
4. Record decisions, implementation changes and material findings under its stable ID. Add newly discovered work here.
5. Verify the relevant real behavior. Separate fixture/stub tests from live providers, hosted journeys and isolated execution.
6. Save evidence links and commit identifiers. Mark verified only when every completion criterion passes. Otherwise use implemented_unverified or blocked with an exact reason and recovery action.
7. Update current-state.md, related task dependencies and requirements-map.md. Preserve historical evidence.

## Completion record to add to each finished item

- What changed and why.
- Source commit and affected files.
- Meaningful tests and observed results.
- Live provider/target read-back where applicable.
- Remaining limits, risks and rollback/recovery behavior.
- Verification date and responsible reviewer.

## Later GitHub copy

Include this entire folder with the source, migrations, worker and evidence. Do not copy tokens, local caches, installed dependencies or private environment values. Wait for the user's requested destination/visibility. After upload, read back the exact commit and this folder; do not replace Sites publishing with GitHub hosting without an explicit instruction.
