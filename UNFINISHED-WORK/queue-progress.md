# Queue start and progress — 2026-10-09

Root cause: account mode intentionally stopped at enqueue and required opening settings and pressing Generate again. New account jobs now connect to the local engine and generate immediately with saved account settings. Missing settings open selection; an unavailable engine shows a diagnostic. Existing queued jobs offer Start job plus a separate Brain settings button. No unattended spend on page load or automatic retry is added.

Progress shows real client milestones with timestamps: connect, snapshot load/file count, provider wait, received output, static validation, review or failure. A queued/currently-local job card distinguishes waiting for engine from local execution. Runtime-test labels say pending generation for queued jobs and no runner attached for generated candidates. Model reasoning/scanning internals are not instrumented; no fabricated scan percentages or findings are shown. Imported snapshots still have bounded coverage.

The page and local engine must remain open. Local execution is not yet a durable unattended daemon; browser navigation/reload can lose UI progress and output handoff. Concurrent starts are blocked while the current local run is active. Failed staging retains output for explicit retry. Docker worker qualification and automatic runtime test dispatch are still open.

Kimi API adapter uses Moonshot's fixed documented OpenAI-compatible endpoint. Model ID is owner supplied. Fixture credential routing is tested; live Kimi authorization requires an owner key. Source: https://moonshotai.github.io/kosong/kosong/chat_provider/kimi.html .
