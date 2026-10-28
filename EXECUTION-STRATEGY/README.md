# OmniDev Swarm — execution and company strategy

Prompt 6. Read [FULL-EXECUTION-STRATEGY.md](FULL-EXECUTION-STRATEGY.md).

- [Company thesis and MVP](01-company-thesis-and-mvp.md)
- [Ten-phase master roadmap](02-ten-phase-master-roadmap.md)
- [Execution and technical horizons](03-first-year-execution-and-technical-horizons.md)
- [Product tiers and pricing](04-product-tiers-and-pricing.md)
- [Market, competition and moats](05-market-competition-and-moats.md)
- [Growth and launch](06-growth-and-launch.md)
- [Staffing, funding and board](07-team-funding-and-board.md)
- [Financial plan](08-financial-plan.md)
- [Risks and ten-year blueprint](09-risks-and-ten-year-blueprint.md)
- [Scenario financial results](model/MODEL-RESULTS.md)
- [Editable model inputs](model/assumptions.json)
- [Financial calculation engine](model/financial-model.mjs)
- [Primary references](source-references.md)
- [Verification](validation-report.md)

Run `node EXECUTION-STRATEGY/model/financial-model.mjs` to recalculate three scenarios from editable inputs. Run `node EXECUTION-STRATEGY/validate.mjs` for plan/model consistency checks. Financial outputs are hypothetical, not actual accounts or promised valuation. Ten phases are gate-driven plans; [UNFINISHED-WORK](../UNFINISHED-WORK/README.md) retains actual implementation status.

## Prompt 8 financial correction

The current model includes supplier costs for incremental consumption jobs. [Financial correction and limits](08-financial-plan.md) and [superseded v1 archive](model/prior-v1-unlinked-overage/README.md) preserve decision history. Use current model results; earlier margin/funding conclusions are superseded.
