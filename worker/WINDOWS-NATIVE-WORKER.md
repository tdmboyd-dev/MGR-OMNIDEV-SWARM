# Windows native snapshot worker

This optional executor uses Windows AppContainer plus a Job Object. It does not require Docker, Windows virtualization or restarting the computer. The existing Docker application worker remains a separate executor with separate qualification. Native support is limited to exact owner-approved source/candidate/command digests and the fixed snapshot oracle below; it is not a general arbitrary-repository or application test sandbox.

## Qualify this exact host

Requirements: Windows, supported Node, PowerShell 7 and the complete worker package. No service, scheduled task or administrator install is created. Set OMNI_PWSH_PATH to an absolute reviewed PowerShell 7 executable if pwsh.exe is not on PATH. Select a new private OMNI_NATIVE_QUALIFICATION_ROOT directory, then run:

```text
node worker/qualify-windows.mjs
```

This runs actual OS-denial, environment, output, process-tree, memory, supervisor-death and cleanup probes on owned fixtures. It creates/deletes unique attempt profiles and changes ACLs only on their new temporary trees. The private-file canary is synthetic. Network checks use host positive controls and attempt denied access from the contained process. A failed probe remains failed; never invent a successful receipt. The qualification receipt binds the Node executable and launcher material, including runner and fleet helpers. Runtime/launcher changes require requalification.

The boundary grants no AppContainer capabilities and verifies the actual token and Job Object membership before resuming candidate code. It uses a 384 MiB configured job-memory limit, a measured 512 MiB acceptance ceiling, 20% CPU cap, 16 active-process ceiling, 15-second snapshot deadline and 20,000 output-byte cap. Scratch/profile writes have a monitored 8 MiB guard with possible polling overshoot; this is not an OS hard disk quota. It provides no remote attestation or Docker equivalence.

## Provision an explicitly approved snapshot

Keep service credentials and policy files private. Server configuration uses distinct OMNI_WINDOWS_WORKER_TOKEN and OMNI_WORKER_TOKEN credentials; identical values refuse startup access. Set OMNI_WINDOWS_WORKER_POLICY_JSON to the reviewed policy object with version 1, enabled true, scope approved-mgr-snapshot, the qualification hostId/runtimeSha256/launcherSha256/qualificationDigest, and 1–32 unique SHA256 values in each of allowedSourceDigests, allowedCandidateDigests and allowedTestManifestDigests. Digests are lowercase SHA256 of UTF8 JSON.stringify for the exact ordered source array, candidate array and fixed command array. Do not guess these values or allow every repository.

Enqueue through the existing authorized runtime flow with workerKind windows-appcontainer and testProfile snapshot. The immutable baseline must contain tests/omni-snapshot.test.mjs. Candidates cannot change or remove that owner-approved oracle. The native command is exactly:

```text
node --preserve-symlinks --preserve-symlinks-main --test --test-isolation=none tests/omni-snapshot.test.mjs
```

The ordinary Node test-process split is disabled inside this already isolated OS process. The native executor does not qualify node-application, signed Trilogy worker grants, arbitrary commands or automatic model dispatch. Native credentials cannot call generation, review, audit or recovery actions or claim Docker jobs. Docker actions cannot dispatch a native job by ID.

Create a private worker configuration containing siteUrl (exact HTTPS origin, or 127.0.0.1 HTTP for a local lab), nativeWorkerToken, nativePolicyPath (file containing the same reviewed policy), nativeReceiptRoot, nativeWorkerRoot and fixed tenantId/actorId for local receipt correlation. Protect it using the owner's normal private Windows credential/configuration flow. The existing service credential authenticates the worker; correlation strings are not independent hosted tenant authentication. Then run one explicit queue cycle:

```text
node worker/windows-worker.mjs --config /absolute/private-config.json --once
```

This reuses the existing job queue. It does not create another scheduler or start a background daemon. The owner still applies or rolls back a snapshot through the existing owner path. Native apply and source publication require an accepted passing native receipt, not just static checks. Receipt metadata is an authenticated host claim; isolationVerified stays false rather than pretending independent attestation.

## Unknown outcomes and recovery

Native assignment is durably marked outcome-unknown before execution. An expired assignment is not silently executed again. The worker writes an active execution journal and pending report before delivery; accepted reports are compared through the authenticated read-only status route. Lost acknowledgments reconcile without a second execution. An unmatched active journal or conflicting/expired report stops for explicit reconciliation. Canceling a server job does not prove the remote OS process stopped; cleanup must still be observed.

Any uncertain profile/process/workspace cleanup quarantines the host. Do not delete quarantine or receipt journals to make the queue move. Inspect the exact owned attempt and determine its outcome first. No unrelated browser, AI, Docker or system process should be stopped during recovery.

## Reproduce the actual local workflow

Run node tests/prepare.mjs. Point OMNI_NATIVE_QUALIFICATION_RECEIPT at the freshly matching qualification receipt, then run node scripts/verify-native-workflow.mjs. The verifier uses a disposable private SQLite database, actual current owner/job/worker routes over localhost, exact approved source and oracle, the real AppContainer and the actual once-worker receipt path. It checks pre-proof apply denial, accepted execution/cleanup, stored-receipt reconciliation without replay, owner snapshot apply and rollback. It removes its temporary configuration and credentials. It uses no model, external repository, production signer or Docker. This lab verification is separate from hosted/API-MCP/current-Tevin integration and full original product acceptance.
