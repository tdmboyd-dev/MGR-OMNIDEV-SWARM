# Trilogy worker verification — 2026-10-29

The final focused run passed **31/31 cases**, with zero failures, cancellations or skips, on Node v24.22.1 (linux/x64). Command: `node --test tests/trilogy-worker.test.mjs`.

This is a working-source fixture result. The coordinator must attach the later clean committed full-project receipt before claiming that exact committed checkpoint passed. `verification.json` binds every current source and test file plus retained output to its SHA-256. It does not promote any historical parent or acceptance clause.

## Reproduced problems and repairs

The initial 24-case run passed 18 and failed six: an approved changed file could be omitted from the tested snapshot; private-key replacement or loosened permissions during execution were not rejected; truthy non-boolean results, malformed/non-string output and noncanonical timestamps could be accepted. The original failing output and guard bytes remain here.

After expanding to 31 cases, the corrected Git fixture passed 29 and reproduced two further gaps: an updated file could acquire an executable bit, and a newly created executable file could fit a byte-only plan. The guard now preserves existing regular-file modes and requires new files to use regular non-executable mode. The first attempt at those two cases failed during Git fixture setup; that output is retained separately and is not counted as product-defect proof.

The final 31-case run covers those eight refusal gaps along with candidate ancestry, extra unapproved changes, before/after hashes, source/ref drift, altered commands, expired grants/assignments, verifier revocation/rotation, unsafe key locations/types, failed execution, cleanup uncertainty and control-credential exclusion. A real disposable Git baseline fails its requested behavior test; the candidate passes, and the exact output is checked against an Ed25519 signature.

## What the runner tests establish

Five cases exercise the existing canonical worker runner through a **simulated Docker CLI**. The assigned Node test command and subprocess ordering are real. They verify run → remove → inspect ordering, signing only after cleanup readback, no dispatch for an invalid candidate, no successful receipt when cleanup is unverified, refusal of invalid UTF-8 and refusal of empty successful output.

These cases do **not** qualify a real Docker daemon, physical container isolation, an always-on worker host, production verifier identity or production owner approval. All keys are disposable local fixture keys. The Linux run had zero skips; the POSIX-only fixtures explicitly skip or narrow their claims on Windows.

## Retained files

- `after.log`: final 31/31 passing output.
- `before-six-guard-defects.log`: initial 18/24 passing output and six reproduced guard defects.
- `before-mode-checks.log`: corrected 29/31 passing output and two reproduced mode defects.
- `initial-mode-fixture-error.log`: earlier Git fixture setup failures, preserved separately.
- `guard-before-six-fixes.mjs.txt` and `guard-before-mode-fixes.mjs.txt`: exact pre-repair guard bytes, archived as text and not imported.
- `verification.json`: source/output hashes, counts, runtime and qualifications.
