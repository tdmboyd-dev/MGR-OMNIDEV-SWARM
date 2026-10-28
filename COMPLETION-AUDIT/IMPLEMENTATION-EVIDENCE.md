# Runtime hardening evidence

Code: lib/jobs.ts, worker/runner.mjs; tests: tests/runtime.mjs, tests/worker-cleanup.mjs.

- Atomic conditional INSERT checks active quota inside the write statement; accompanying activity is conditional on actual admission.
- Worker assignment binds source/candidate/test-manifest digests and a nonce with expiry; report checks it and compare-and-swaps the stored result. Accepted reports cannot overwrite. Reassignment is denied after acceptance.
- Successful report requires a pinned-image identifier and verified-absent cleanup receipt. These are authenticated worker claims, not independent attestation; isolationVerified remains false.
- Actual runner requires OMNI_WORKER_IMAGE pinned by SHA-256 digest, awaits removal and independently invokes inspect for explicit absence. Uncertain cleanup fails and stops the runner for host inspection.

31 acceptance, 72 runtime/account and six cleanup/wiring subprocess checks passed. Provider/GitHub HTTP stubbed; no actual Docker host/VM isolation or deployed browser journey verified. Type checking passed. Existing AUD-02/25/26 acceptance remains open for complete scope and deployment qualification. No generalized arbitrary-code execution or production self-healing is introduced.
