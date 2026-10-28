# Isolated execution worker

This runner downloads a candidate snapshot and executes a fixed Node snapshot-test command in a disposable Docker container. It never executes project code directly on the host. No-network, read-only filesystem, non-root user, dropped capabilities, CPU/memory/process limits, timeout, fixed command, and bounded output are enforced.

Requirements: a supported Docker host, Node 22+, and the `node:22-alpine` image pulled explicitly before use. The runner never pulls an image during a job. Container isolation is not a substitute for a dedicated worker host.

Set `OMNI_SITE_URL`, `OMNI_WORKER_TOKEN`, and `OMNI_SITE_SERVICE_TOKEN` through a secret manager or ephemeral environment, not a repository. The worker token authenticates the app endpoint; the Site service token authorizes access through the private Sites gateway. Obtain owner-private service access through Sites. Do not make the Site public to connect a worker.

Run `node worker/runner.mjs --once` for one polling cycle or omit `--once` for a persistent worker. This release supports the generated snapshot integrity test only; arbitrary commands, dependency installation, network access, and deployment actions are intentionally outside the runner's contract.

A real Docker host was not available in the authoring environment. Validation covers path/command rejection and container arguments; an actual isolated run remains an activation gate.

## Evidence-bound assignments and cleanup

Set OMNI_WORKER_IMAGE to an explicitly pre-pulled image reference ending in @sha256:<64 lowercase hex digits>. Actual execution rejects a mutable tag. No job pulls images. Assignment receipts expire and bind source/candidate/test command; successful report must include pinned image and verified cleanup receipt. Reports remain authenticated worker claims, not independent attestation.

The runner awaits removal and checks Docker inspect for explicit absence. Inconclusive cleanup stops the process for host inspection; do not automatically restart it until the host is verified. Local cleanup regression tests use a simulated Docker CLI, not real container isolation.

## Node application verification profile

Select **Node application: typecheck, build and tests** when creating a job. Include package.json, package-lock.json, all relevant application source and tests. The runner requires a declared test script and rejects the known "no test specified" placeholder, then executes declared typecheck, build and test scripts in that order. This is recipe validation; it does not establish that the project tests assert meaningful application behavior. Existing snapshot-only jobs retain their original profile.

Application execution uses the same pinned image policy with 1 GB memory, 128 processes, two CPUs, a 180-second timeout and a 512 MB temporary workspace. Prepare the approved image with a read-only `/opt/omni-npm-cache` containing the exact lockfile dependencies, accessible to UID 65534. No credentials should be included in the image or source bundle. Offline npm ci suppresses install lifecycle scripts; explicit build/test scripts still execute inside the container. Cache misses and missing native build requirements fail visibly. Network-dependent integration services are not provisioned by this profile.

Authenticated reports describe the candidate bundle tested, never omitted repository files. Docker-host attachment and real-container qualification remain required. The earlier snapshot-only release restriction is superseded by this profile; arbitrary owner-provided shell commands are still rejected.

## OmniDev worker fleet

Use Docker Engine Community on a dedicated Linux host. The engine is open source; computing hardware and hosted machines are separate costs. Docker Desktop has different commercial eligibility rules. See https://docs.docker.com/engine/install/ and https://docs.docker.com/subscription-billing/desktop-license/ . Podman's Docker-compatible CLI is an alternative to study, not a qualified interchangeable engine in this release.

Run `node worker/doctor.mjs` before starting. It checks daemon reachability, image availability and host memory/CPU/process-limit support. Rootless Docker needs user namespaces and subordinate UID/GID mappings; this authoring environment denies the required UID-map operation, so installing an executable here would not create a qualified container host.

Set `OMNI_WORKER_SLOTS` from 1 to 10. Admission reserves 30% of host CPU and memory and allocates up to two CPUs and 1 GB per slot. A 32-CPU, 16-GB host can admit ten slots under this model. This is a concurrency configuration, not a measured tenfold throughput claim. Use one worker process per host; each job is claimed once by a digest-bound expiring assignment. Additional hosts share the queue and claim different work. The platform still admits at most ten active generation jobs at once; pending reviews can feed the execution pool.

The fleet drains a bounded queue, records per-job outcomes, and stops admitting work if cleanup becomes uncertain. Cache misses, absent manifests, daemon failure and denied capacity never become passing reports. No Docker socket is exposed to application containers. Local Unix/Windows named-pipe daemon configuration is supported; remote untrusted Docker TCP endpoints are rejected.

## Source audit continuation (2026-10-28)

Source imports now reject Windows drive/alternate-stream/device aliases, control characters, trailing dot/space aliases and case-insensitive duplicate paths. Named Docker contexts are unqualified and refused; select the default local daemon. Docker host overrides must use a local Unix socket or local Windows named pipe. Doctor uses the same environment restrictions as execution, preventing a successful check of a different remote context from implying local readiness. Actual container execution remains unqualified on this machine because Docker is unavailable.
