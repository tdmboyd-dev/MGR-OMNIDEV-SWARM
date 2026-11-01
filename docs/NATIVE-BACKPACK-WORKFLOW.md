# Backpack inside the existing native OmniDev workflow

Backpack supplies project context and source-linked outcome notes. OmniDev retains the one canonical job, claim, worker journal and execution receipt. Code Monster retains candidate/recipe authority; VampBite projects its campaign ledger; OmniSight displays permitted history. This is a host integration, with no additional scheduler or job database.

## Configure and call it

Use the existing qualified Windows native worker configuration. Keep its credentials and the workflow file outside Git. The trusted local workflow file must contain:

```json
{
  "workerConfigPath": "C:/private/existing-native-worker.json",
  "expectedJobId": "00000000-0000-4000-8000-000000000001",
  "backpack": {
    "toolkitRoot": "C:/reviewed/MGR-BACKPACK",
    "configPath": "C:/private/existing-backpack.json",
    "project": "registered-project-id",
    "sourcePath": "scripts/check-directory-integrity.mjs",
    "record": true
  }
}
```

Replace the example UUID with the exact existing authorized job. `toolkitRoot` is the reviewed Backpack source SDK with its locked dependencies installed; the standalone bundled MCP plugin is a separate interface. Register the exact project through Backpack's existing owner setup first. This wrapper cannot enroll roots, enable commands or renew grants.

From the OmniDev checkout run:

```powershell
node scripts/run-native-with-backpack.mjs --config C:/private/workflow.json
```

The wrapper reads the configured source anchor and at most 128 KiB of serialized context before dispatch. It refuses missing enrollment, excluded source and oversized context. The existing worker checks the expected job before claiming; a different queued job is refused. Project text stays advisory host data and never becomes sandbox policy. The default native executor does not interpret that text as instructions.

After execution the wrapper returns the real canonical result and context/source hashes. When recording is enabled it rechecks the source and writes one source-linked `omni-native-JOB_ID` memory note. That note points to the canonical OmniDev job; it is not a second receipt authority. Source drift or a note failure leaves the actual job outcome intact and reports the recording problem. An uncertain worker result is never automatically retried. Reconcile the original worker journal before another attempt.

Exit codes: 0 means this call executed the expected passing job and requested recording succeeded; 1 means the executed job failed; 2 means no new execution; 3 means execution passed but recording failed. A thrown configuration, authority or uncertain-result error is a failure, never a passing check. `record:false` preserves Backpack storage.

## Executed qualification on November 1, 2026

The nine focused context/fencing tests passed on this Windows host, including source drift, missing enrollment, excluded source, unexpected job, malformed result, no retry and recording disabled. A separate real AppContainer execution of the selected IKICKITZ directory-guard candidate passed its unchanged three-test oracle. Job `256b6a19-b89e-4088-83e8-c753511a09d2` read current Backpack context and saved a source-linked outcome through this adapter.

The related Imprint candidate `c87c76f846bbaa0b0698ddf21df8ef5aff5527ea` was independently exercised by the existing native worker, admitted to the existing Code Monster campaign ledger using a disposable local test signer, projected by VampBite and displayed through actual OmniSight HTTP. It remained verified-pending-owner. This is a selected real source repair with local service identities; it is not a whole-app audit, a live model/provider connection, a production signer, Docker qualification or full original-product acceptance. The original 174 parents, 441 clauses and 28 upgrades are unchanged.

Full verification includes `nativeBackpackContext`; use the repository's existing clean-committed-source verification runner. The native worker source download must be rebuilt after a worker source commit. This host adapter lives in OmniDev; it is not embedded into the portable worker and does not transfer host Backpack credentials into the AppContainer.
