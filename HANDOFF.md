# MGR OMNIDEV SWARM — LIVE HANDOFF

Updated 2026-10-29. **This is the immediate restart entrypoint.**

1. Read `AGENTS.md`, `MGR-TRILOGY-HANDOFF.md`, `UNFINISHED-WORK/README.md`, `UNFINISHED-WORK/backlog.json` and `UNFINISHED-WORK/mgr-trilogy-upgrades.json` before editing.
2. Run `git status --short`, record current Git SHA, inspect current tests, and **preserve user edits**. Always use an isolated review branch, not an unreviewed production merge.
3. Existing worker source: `worker/runner.mjs` / `worker/fleet.mjs` / `worker/doctor.mjs`. It already loops persistently and supports requested 1–10 slots, but CPU/RAM admit the actual count. **Do not build another independent worker engine.** The redundant 2026-10-29 prototype was removed.
4. Connected Windows host measured `workerCapacity({requested:10}) -> {slots:2,cpuSlots:2,memorySlots:11}`; Docker CLI unavailable as of 2026-10-29. Real qualified worker slots = zero. Requires Docker host setup, pinned image and protected tokens. Do not weaken safety to force 10.
5. Historical backlog: **174 original IDs all recorded `open`**, 11 carry `partial-tested-local`, 60 list source refs, 14 evidence refs, 163 unspecified implementation status; **not** 174 demonstrated missing features. Separate 28 MGR upgrades. Read `UNFINISHED-WORK/mgr-historical-truth-20261029.json` and `UNFINISHED-WORK/mgr-acceptance-queue-20261029.json` and re-test each acceptance before status changes. Never bulk close.
6. Worker changes in this review branch: portability seam in `worker/runner.mjs`, `tests/mgr-portable-cleanup.test.mjs`, `tests/mgr-ten-slot-fleet.test.mjs`, `tests/worker-cleanup.mjs`. Earlier POSIX fake-Docker test failed on Windows; corrected Windows path ran 4 assertions successfully. Docker isolation not certified.
7. Code Monster review branch `mgr/receipt-admission-20261029`: current working admission, DAG, DevMapGod conservative classifier/batch proposal. **Still no mandatory signed campaign gate or durable ten-agent executor.**
8. OmniSight review branch `mgr/ten-lane-handoff-20261029`: local owner-token census and DevMapGod endpoint/panel with source-scope filtering, not production multi-tenant.
9. DevMapGod is a **mode across three products**, not a fourth repository. External research: Sourcegraph Batch Changes/Agentic Batch Changes and GitHub parallel agents already exist; see Code Monster `docs/DEVMAPGOD-PRIOR-ART-20261029.md`.
10. Workflow: AUDIT -> BUILD -> NEGATIVE TEST -> VERIFY -> SOURCE SHA RECEIPT -> UPDATE BACKLOG/HANDOFF -> COMMIT REVIEW BRANCH -> REMOTE READ-BACK. No model/hosted spend or production deployment without appropriate owner budget/authority. A ChatGPT conversation is not an always-on worker daemon.

**Actual status:** partial implementation and successful focused tests, NOT finished trilogy. Biggest P0: qualified persistent host with trusted credentials, real three-agent commit/verification path, 174 evidence-backed acceptance decisions, CI and cross-product certification.
