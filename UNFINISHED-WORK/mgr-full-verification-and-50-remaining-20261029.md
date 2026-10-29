# OmniDev — Full verification and formerly unlinked task discovery
Updated 2026-10-29. Branch: mgr/code-monster-omnisight-20261028.

## Historical IDs (174 preserved)
- Original code-linked parents: 108, with committed Git-object source hashes and baseline tests.
- Newly discovered *candidate* code matches: 16 additional parents, involving 15 distinct present GitHub source files. Their exact links are in canonical UNFINISHED-WORK/backlog.json with source_link_confidence=CANDIDATE_FILE_VERIFIED_NOT_BEHAVIOR. Presence does not prove they perform the task's original acceptance behavior.
- Linked in total: 124/174 (71.26%). Still without recorded source links: 50/174 (28.74%). Those 50 include 40 integration/connector requirements; do not infer they are absent from missing link alone.
- Current canonical statuses remain 126 open + 48 implemented_unverified; no parents automatically closed or marked green.

## Verification classes — explicitly distinct
1. DISCOVERED: possible file/symbol association. No assertion of behavior.
2. SOURCE-PINNED: committed object and SHA recorded, not code correctness.
3. LOCAL-TESTED: required assertions execute on pinned source and retain bounded output evidence; mocks disclosed.
4. INTEGRATION-TESTED: actual authorized connected target, recorded outcomes and failure cases.
5. INDEPENDENT-ATTESTED: registered independent execution identity, signed source + criterion + command + output, verified by trust registry.
6. OWNER-ACCEPTED: all original criteria proved, authorized approval, no skipped critical gates; only then close parent.

## Executed checks in this wave
- GitHub source presence lookup for 15 unique code file paths: 15/15 present, relevant to 16 original unlinked tasks. Pure file presence, no claimed code correctness.
- New cryptographic candidate proof verifier source and tests at scripts/verify-acceptance-receipt.mjs and tests/verify-acceptance-receipt.test.mjs. Negative cases passed 3/3, but valid Ed25519 receipt acceptance FAILED. Do not use that prototype to authorize release. Additional verifier repair/test is REQUIRED and a trusted signer must be registered independently.
- Existing 174-parent/441-criterion acceptance gate stays authoritative, including original wording and any prior individual evidence.

## To complete genuinely
For each original criterion: inspect actual matching source, run appropriate behavior/failure tests, repair observed defects, verify exact commit and independent runner signature (where required), reproduce real external integrations where required, attach provider receipts and owner approval, update original acceptance register and canonical backlog in one reviewed change, then promote only that parent. All other states stay explicit.

## Remaining 50 discovery
- 40 integration/connector: use source-level connector capability inventory and provider capability contracts; only identify as built when actual adapter code exists.
- 10 other: digital twins/futures (3), business/innovation (3), UX (1), security/verification (1), release (2). Examine relevant source packages and runtime workflows; keep future ideas distinct from contracted shipped features.
