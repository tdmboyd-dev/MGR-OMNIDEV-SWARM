# Native Windows worker: local operator handoff

## What ran for real

The qualified worker executes Node24.21.0 in an actual Windows AppContainer, with an actual process token, zero capabilities and a Job Object associated at process creation. Original MGR-OMNIDEV-SWARM26e230d source was transparently transpiled to standalone JavaScript. Its secret-path case regression failed inside the worker; the real configured Codex CLI generated a two-flag repair, and that candidate passed the unchanged tests in the same boundary. Actual owner/native HTTP credentials, production route logic, private persistent SQLite, report admission, failed-baseline apply denial, successful snapshot application and hard API-process restart/readback all worked. No provider or worker stand-in supplied these outcomes.

This is a narrow actual local workflow, not Cloudflare D1 or a deployed owner gateway. It changes the laboratory snapshot only. No default Git branch, external repository, paid provider, production database or new host is modified. Model execution evidence is linked separately; the app correctly retains its owner-submitted-output/non-attestation wording.

## Start and run

Run from the authorized MGR-OMNIDEV-SWARM checkout:

```powershell
node scripts/local-worker-api.mjs ../../wave3/omni-native-lab.private.json
node worker/windows-worker.mjs --config ../../wave3/omni-native-lab.private.json --once
```

The current local address is configured in the private file. The adapter binds127.0.0.1 only and rejects wrong Host/Origin, absent credentials and forged owner identity. Owner operations are limited to source import, explicit account-generated native snapshot admissions, candidate submission, cancel and laboratory snapshot apply/rollback. It does not invoke a model or expose provider configuration. The native worker token cannot dispatch model reviews, audit operations, recovery or Docker work. The once-entry runs one queue cycle; no service, scheduling or background autonomy is installed.

The already-created private configuration is owner/SYSTEM protected and contains distinct owner/native tokens, fixed tenant/actor, database path, site origin, policy path and receipt directory. It is not exported. For a new installation, provision new random credentials through the owner's secure local setup, a fresh named laboratory SQLite path, and a matching fixed identity. Never reuse somebody else's configuration. The adapter rejects unrelated existing databases and mismatched saved identity.

## Enrollment and immutable tests

Before native assignment, the owner must configure policy version1, enabled:true, scope:approved-mgr-snapshot, hostId, runtimeSha256, launcherSha256, qualificationDigest, allowedSourceDigests, allowedCandidateDigests and allowedTestManifestDigests. The three allowlists contain1–32unique exactSHA256values. Actual qualification must match the exact runtime and aggregate launcher; a label alone grants nothing.

The fixed native command is:

```text
node --preserve-symlinks --preserve-symlinks-main --test --test-isolation=none tests/omni-snapshot.test.mjs
```

These flags are bound into the assignment's test-manifest digest. Disabling Node's internal test-process split does not remove Windows AppContainer/Job Object isolation. Native Node's ordinary split/IPC test mode timed out in actual trials; its failure was retained rather than reported as passing. Model output cannot change the existing owner-approved test file: the app checks it before candidate persistence and again before assignment. Candidate/source/command allowlists also prevent the native path from running arbitrary new repositories.

## Actual isolation limits

- The Job Object is attached during process creation, before resume. Neither breakaway flag is enabled. Parent death closes the job and terminates its process tree. Actual before-resume and after-launch supervisor-death checks passed.
- No AppContainer capabilities are granted. Parent inspection confirms the AppContainer token, exact package SID and zero capability count. Private-file read/write, source-write and network/DNS/localhost denial were tested with positive host controls. Runtime/source are read-only; scratch and the package's intrinsic private profile storage are writable and monitored. No global package ACL grant was made.
- Configured job memory is384MiB. Actual allocation failure and measured peak below512MiB passed. Windows accounting can exceed the nominal configured figure; this is not a promise of an exact RSS ceiling. CPU hard cap is20%; active-process limit16; test wall time15seconds; output budget20000bytes.
- The8MiB write guard polls every25ms, covers scratch and package profile storage, and records overshoot. It is a supervised guard, not a kernel-enforced disk quota. The approved-source/candidate allowlists deliberately keep this acceptance narrow.
- Successful native receipts require process/profile/workspace cleanup. Uncertain cleanup writes quarantine and stops host reuse. Reports remain authenticated host claims; no independent remote attestation, Docker equivalence or broad customer-production security certification is claimed.

## Receipt recovery

The once-entry hashes and atomically writes an admitted-execution journal before execution and a pending report before delivery. It reconciles pending reports through the authenticated read-only status route. It compares assignment/source/candidate/command/runtime/qualification/profile, verdict, output and cleanup. It never reruns a pending report to recover an acknowledgment. Unresolved admitted execution, changed receipts, unknown status or a stale process lock stops for review. Crash after execution but before report-spool persistence is conservatively journaled; complete crash recovery of that exact window has not been independently fault-tested here.

A recovery exercise restored a genuine already-accepted receipt to pending, then queried the actual server. It reconciled with zero new claims and zero new reportPOSTs. This was an explicit stored-state recovery exercise, not a claimed real dropped network acknowledgment.

## Evidence

Central workspace wave3 contains native-worker/qualification/qualification-receipt.json (23actual checks), omni-native-live-flow-state.json (22actual workflow checks and raw receipts), omni-native-actual-http-execute.log, omni-native-actual-http-restart-readback.log, omni-native-once-worker.log, omni-native-once-receipt-recovery.log and omni-native-once-job.json. live-candidate/model-result.json preserves the real CLI response identity/usage; independent-review.json binds the allowed patch and unchanged oracle. Source, command and receipt hashes are recorded. Private configuration and tokens stay outside exports.

Tevin's engineering MCP tool is not added by this lane. The proven path is an owner-authorized local adapter and native worker. Existing API catalog and ONE owner approval/runtime remain the authority; adding a general engineering tool requires its own scoped integration proof.
