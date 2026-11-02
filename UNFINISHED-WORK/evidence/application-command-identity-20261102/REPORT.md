# Exact application command identity repair

Runtime: fe1c0f466317163f335d7859497b5eca505190f8. Existing owning job/worker/compiler are reused; no new scheduler, grant store, model connection or application-execution profile was added.

## Before and after

Two initial checks failed: assigned `npm run omni:verify` differed from the actual fixed Docker argv, and the shared command could be mutated. The exact existing offline install and declared typecheck/build/test shell argv is now immutable and shared by original job assignment and actual container launch. The fixed-map protected compiler includes its owning module. Worker allowlisting now compares exact argument elements rather than joined text; alias/boundary/extra/non-string substitutions fail before launch.

For identical inputs, the complete Docker argument array is unchanged from source702ad30. Its JSON SHA256 is59453c3155c5292e76a740a9ca6647d81738832a9078a15f10b21c0da3ec9ca0. Existing image pin/no pull, offline installation, source read-only mount, network denial and resource settings remain.

## Verification and retained failures

Initial full run:94/95passed,1failed,0blocked. The compiler found an incomplete temporary security-scan copy under ignored outputs because the existing tsconfig includes all TypeScript descendants. That copy was moved outside the repository. The SAME unchanged source passed a targeted2/2 preparation/typecheck run; no compiler exclusion, source change or rewritten failed report was used. All95 distinct profiles now have passing source-bound receipts across these two runs. All97 output hashes/byte lengths and source-stability receipts were independently rechecked before saving.

The full run includes7 new command controls,2 versioned-runtime controls and existing real SQLite/runtime/application checks. These nested scopes overlap and are not added into a unique-test total. ONE receiving27/27 passed against this source; its report is owned by MGR-ONE. Changed owning source security scan returned0findings. No original parent/criterion was promoted from these local regressions.

## Host qualification and remaining engineering

New launcher SHA256:46834e3b12622af72c91c62e2a61a4b34a1c5079d95dd02fe29b7e06ab67d8e7. `runner.mjs` is in the original Windows launcher fingerprint. The prior29-check native receipt cannot qualify this changed source. No Windows AppContainer workload or actual Docker container was launched, no inference ran and no permanent owner setup was changed. Normal automatic engineering remains disabled. Actual local Docker version observation timed out; no daemon readiness is inferred.

Permanent original authorizer/job/candidate caller, protected local Trilogy transport, exact commit-pinned original import, registered real-application signed command and independent worker/signer, matching selected-host qualification, then normal save/restart/replay/cancellation/update/rollback remain unfinished. Existing original174parents/441clauses/28upgrades and broad Tevin/tool/production scope remain unchanged. These are current named gaps, not reasons to rebuild the delivered dispatch-time source check or another brain/grant system.
