# AgentOS — OmniDev Swarm agent operating system

Prompt 4 complete target design. Read [FULL-AGENTOS-ARCHITECTURE.md](FULL-AGENTOS-ARCHITECTURE.md).

- [System and agent contract](01-system-and-agent-contract.md)
- [Lifecycle and fractal swarms](02-lifecycle-and-fractal-swarms.md)
- [Tasks, scheduling and execution](03-tasks-scheduling-and-execution.md)
- [Communication and debate](04-communication-and-debate.md)
- [Evolution, economy and marketplace](05-evolution-economy-and-marketplace.md)
- [Emergency response and command center](06-incidents-and-command-center.md)
- [Scale, resilience and company simulation](07-scale-resilience-and-company-simulation.md)
- [APIs, decisions and migration](08-apis-decisions-and-migration.md)
- [Research and requirement coverage](research-and-coverage.md)
- [Verification report](validation-report.md)
- [Agent schema](contracts/agent.schema.json)
- [Task schema](contracts/task.schema.json)
- [Communication schema](contracts/message.schema.json)
- [Lifecycle contract](contracts/lifecycle.json)
- [Relational reference schema](contracts/agentos-schema.sql)

Run `node AGENTOS-ARCHITECTURE/validate.mjs` from the repository root. This validates design contracts/reference rules, not live provider/worker/scale behavior. Implementation is tracked in [UNFINISHED-WORK](../UNFINISHED-WORK/README.md). Dependencies: [production architecture](../PRODUCTION-ARCHITECTURE/README.md), [knowledge architecture](../KNOWLEDGE-ARCHITECTURE/README.md).
