# 174-task individual acceptance system — wave 2026-10-29

The canonical backlog contains **174 parent tasks** and **441 acceptance criterion statements**. The review branch now has a complete one-to-one register at `UNFINISHED-WORK/mgr-174-acceptance-evidence-register.json`.

Each criterion is `UNVERIFIED` until proof is attached: exact unchanged acceptance text, pinned Git SHA, executable test command, nonempty evidence receipt, named reviewer and verification timestamp. Provider-bound criteria also need provider-side receipts before an authorized reviewer promotes them. The validator `scripts/validate-acceptance-register.mjs` refuses missing records, changed criterion wording, absent proof and falsely completed parent tasks; it does **not** authenticate the reviewer or execute the recorded command. Those are separate gates.

Executed on connected Windows review worktree, actual command `node scripts/validate-acceptance-register.mjs UNFINISHED-WORK/backlog.json UNFINISHED-WORK/mgr-174-acceptance-evidence-register.json` returned `valid:true`, `totalParents:174`, `totalCriteria:441`, `verifiedCriteria:0`, `readyForCertification:0`, `errors:[]`.

`node --test tests/validate-acceptance-register.test.mjs`: **5 pass, 0 fail**.

Broader integration branch: `corepack pnpm exec tsc --noEmit` exit 0; after `node tests/prepare.mjs`, `node tests/runtime.mjs` **79 pass, 0 fail**. Fixture mocks apply; no real hosted provider, Docker, or production acceptance certification.

The status `173 open, 1 implemented_unverified` remains, and 0 parents have been newly certified by this artifact. Do not conflate **100% evidence-slot creation** with full completion.

Recommended worker workflow per parent: capture SHA -> execute each criterion in qualified runtime -> capture command, full exit/output hash and provider identity -> independent verifier checks original criterion and identity -> append acceptance event -> mark `CERTIFIED` only after all criteria verified and owner release checks -> reconcile scorecard/handoff -> commit + remote readback.
