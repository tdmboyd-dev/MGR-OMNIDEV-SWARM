# DATA-03: complete bounded workspace backup and restore

## Problem and existing contract

The owner requested continuation toward full Trilogy completion. DATA-03 already names larger backup restoration as unfinished work. The existing validator accepted up to 10,000 records and 10,000 jobs, but restore refused more than 498 combined rows. Export also built the complete archive as one SQL JSON value, which can hit D1's single-value limit before the documented archive limit.

The original version-1 archive, digest, project-reference checks, empty-target rule and canceled restored jobs remain the public contract. No new database or duplicate backup store is introduced.

## Implemented behavior

- Export reads both collections in one SELECT, returning one JSON value per saved row. It takes one extra row per collection to detect overflow and refuses truncation.
- Archives are bounded by 10,000 records, 10,000 jobs and 10,000,000 UTF-8 bytes. Each encoded saved row, including its array delimiters, is limited to 1,800,000 bytes.
- Restore snapshots its caller's JSON before any await, validates those same values, and groups rows into parameterized JSON chunks. A normal chunk targets 256,000 bytes or 250 rows; one larger valid row is its own bounded chunk.
- Every chunk executes inside one D1 batch transaction. Admission refuses existing workspace records/jobs. A final SQL constraint check aborts the transaction if any row was silently skipped. A failed later chunk rolls back all earlier writes and the admission lock.
- Jobs restore as canceled with no leases. Runtime settings, secrets, sessions and provider authority are never imported; existing target settings are preserved.
- UI wording states the actual archive limits. The full verification registry includes `backupCapacity`; it requires fresh compiled source preparation.
- The API measures its request envelope in UTF-8 bytes and reserves 65,536 bytes above the archive limit for the action wrapper. A valid near-limit archive therefore survives the actual validate/restore HTTP handlers.
- Directly persisted strings reject lone UTF-16 surrogate code units before any write, preventing SQLite JSON extraction from silently changing malformed Unicode. Valid Unicode, including supplementary characters, remains supported.

## Research that informed the implementation

Checked October 30, 2026 against official Cloudflare documentation:

1. [D1 limits](https://developers.cloudflare.com/d1/platform/limits/): bound values/rows are limited to 2 MB, SQL statements to 100 KB and parameters to 100 per statement. The new chunk bound leaves room below the value limit and uses two parameters per insert. A batch is still subject to the platform's execution time and memory limits.
2. [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch): a failing statement aborts or rolls back the whole batch. All restoration statements remain in that single boundary; no partial multi-request restore is claimed.
3. [D1 JSON queries](https://developers.cloudflare.com/d1/sql-api/query-json/): `json_each` expands bound JSON into rows and `json_extract` recovers selected fields. SQL structure and column choices are fixed application code.

## Acceptance and proof

The initial 9-case reproduction produced 1 pass and 8 failures before the repair. The same 9 cases passed after it; two additional cases verify a large single record and mutation during async validation. Independent review then reproduced two edge failures: an otherwise valid near-10-MB archive exceeded the old request-envelope limit, and malformed Unicode changed during restore. Both are repaired. All 13 focused cases pass against real SQLite and the actual application functions, including the API handlers. Existing intelligence-integrity checks passed 10/10, and the platform suite passed its 80 checks using the permitted native subprocess runner. The first complete 76-profile run passed at `aeb61cc02066e1db383c0dc270f7a11432ad04ce`; the later edge repairs require a separate source-bound full run and are not covered by that earlier receipt.

The focused cases cover 20,000 saved rows, exact text including Unicode/control characters, a late transactional failure, silently skipped rows, simultaneous restores, preserved target settings, overflow refusal, byte limits, malformed references, denied cross-origin requests and retained canceled jobs. Source-pinned full verification and GitHub readback are recorded separately when executed; these focused results alone do not certify the original DATA-03 parent.

## Remaining qualification

Real hosted D1 timing/limits, protected deployed backups, vault recovery, chosen recovery-time/recovery-point objectives and credential reauthorization require their own executed proof. Archives above the bounded contract require an explicit migration design. No production recovery objective, continuously running backup service or full-parent acceptance is claimed by this change.
