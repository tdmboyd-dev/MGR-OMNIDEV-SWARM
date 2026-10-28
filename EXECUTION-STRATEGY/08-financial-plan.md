# Financial plan and scalable economics

## Model scope and ownership

The attached executable five-year model is an illustrative operating forecast, not actual accounts, valuation or promised investment return. Editable assumptions live in model/assumptions.json; one calculation engine in model/financial-model.mjs builds 60 monthly periods for each Downside/Base/Upside scenario and annual summaries. The report separates recurring platform revenue, consumption, marketplace net commission, services, COGS, operating costs and cash funding need.

USD nominal prices; no inflation unless an input changes. Four mutually exclusive paid account classes: Pro/Team/Business workspaces and Enterprise organizations. Team/Business seat bundles are already included in platform price; model does not count individual agents or seats again as separate subscription customers. Enterprise ACV is $60k starting assumption within the proposed range, not a signed contract. Platform/government revenue is excluded until demand is validated; research/service income is not recurring ARR.

Customer numbers are targets used to solve necessary gross additions after assumed churn. They are not independently sourced market forecasts. Model records implied acquisition counts so targets cannot hide churn. No conversion/CAC story is inferred merely from revenue targets. Annual summaries include customer stock, average active paid accounts, gross additions/churn, revenue and full cash cost. Replace targets with actual pipeline/cohort data as soon as available.

## Cost build

| Driver | Calculation / assumed range | Interpretation |
|---|---|---|
| Staff | Average annual FTE × fully loaded annual compensation; base starts $200k/FTE, varying by year/scenario | Planning blended employer/contract cost, not quoted Memphis or national salary |
| Direct support | Support FTE compensation allocated to COGS; remaining staff to OpEx | No payroll double count; support quality scales with actual workload |
| Model cost | Qualified jobs × weighted input/output token cost per job, modeled as blended dollars/job | Includes reviewer/planner usage in defined job; benchmark actual routes and retries |
| Worker cost | Jobs × isolated execution cost/job | Licensed/GPU/high-trust specialty jobs require additional separate cost before launch |
| Variable storage/network | Active paid accounts × monthly blended storage/egress allocation | Repos/history/graphs can skew; large-account quotas and actual usage replace average |
| Cloud control plane | Base monthly fixed amount plus scenario growth | Queue/journal/index/telemetry/backup/security infrastructure independent of per-job worker cost |
| Free acquisition workload | Monthly free-cost budget | Hard product/abuse limits; no infinite unpaid inference subsidy |
| Payment costs | Modeled percentage of earned platform/usage/services receipts | Assumption only; actual card/enterprise invoices/provider contract rates differ |
| Growth | Annual budget by scenario | CAC/payback calculated from real attributable retained cohorts, not made-up conversions |
| G&A/security/legal | Fixed budget plus setup; payroll excluded if already in FTE | Contracts, external review, insurance/tools/accounting and operational support assumptions |

Direct support, cloud/model/worker/storage/free usage/payment costs form service COGS in this management view. Engineering/product/sales/admin payroll, marketing and G&A form OpEx. Classification needs actual accounting review, but total cost must reconcile whichever presentation is used. Model avoids claiming pure software margins while excluding human service delivery and hosted inference.

Initial blended job hypothesis: $0.60 model and $0.25 runtime, with per-account monthly jobs 8 Pro / 35 Team / 100 Business / 350 Enterprise. This is a bounded qualified job including typical review overhead, not a universal cost of an arbitrary autonomous task. Base reduces unit cost only as a labeled efficiency assumption, not a guaranteed provider price decline. Long context/retries/expensive models/GPU can exceed these values; real caps/reservations and job-class pricing required.

Consumption revenue is additional overage retail, modeled separately from included allowance. Direct costs cover all modeled jobs, including included work, so included usage is never free in the model. Additional paid usage depends on customer uptake assumptions and cost ceilings. Marketplace commission is net revenue at assumed take rate, not gross merchandise value; if accounting requires gross presentation, both revenue and payout costs must change consistently.

## Cash, runway and funding need

Operating cash approximates revenue recognized as collected monthly less COGS/OpEx. The model explicitly excludes receivable/payable timing, taxes, debt, capital expenditures, deferred revenue and foreign-exchange movements; this is not a complete three-statement or liquidity forecast. Enterprise annual/prepaid billing can materially alter cash versus revenue and requires a real collection/deferred-revenue schedule before financing decisions. Negative modeled cash flags funding insufficiency; it does not assume a future round closes automatically.

Cash funding requirement = initial cash buffer minus the minimum cumulative operating cash balance, floored at zero, with displayed reserve/contingency assumptions. Founder must add actual hiring, unpaid obligations, collections and financing dates in board cash forecasts. Round timing and valuation are separate decisions; model does not manufacture capital to make cash look positive. Runway approximation uses current cash/monthly net burn only where burn is positive and stable; near break-even needs scenario review rather than infinity rhetoric.

The lean/recommended MVP cash illustrations in chapter 1 are a six-month project budget. Five-year model assumes additional staffing and customer expansion across whole operating years; the two figures are not interchangeable. Launch expansion is gated by cash/retention/unit economics even if scenario customer targets are missed.

## Revenue and margin ambition

Recurring ARR is ending active paid account subscription value ×12, plus separately contracted recurring platform fees if later included. It excludes one-time services and marketplace GMV; variable overage is reported separately as consumption run rate, not silently treated as contracted ARR. Gross margin = (recognized revenue−COGS)/recognized revenue. Contribution per job/account includes variable costs; early gross margin can be poor/negative because support/control-plane costs precede scale.

Target mature gross margin ≥65% and usage contribution margin ≥40% are company objectives to validate, not industry averages or achieved numbers. Track model/worker cost per accepted useful outcome, not per token alone. Accepted output at higher job cost can be more economical than cheap rejected work. Cap customer workload, separate exceptional runtime/license costs and make usage routes transparent.

Valuation sensitivity only: $1b enterprise value at assumed 5×/10×/15× recurring revenue corresponds to $200m/$100m/$66.7m ARR respectively. These multiples are hypothetical arithmetic, not current market comps or investment advice. Equity value additionally depends on debt/cash/terms; no five-year customer scenario guarantees any multiple or billion-dollar valuation. A viable profitable independent company is valuable even if this ambition never materializes.

## Operating economic gates

Before scaling spend: measure paid retention, eligible task acceptance, actual source/model/worker cost, support hours, incident harm, paid overage adoption and attributable acquisition cost. Add price/rate/mix sensitivity, twice normal token cost, lower retention and missed sales timing. Freeze expensive unbounded promotions until cost/cap/billing correction is proven. Reforecast monthly from actuals and preserve prior versions for board variance review.

## Decisions from the illustrative scenarios

Base ends Year 5 at approximately $39.9m recurring ARR and requires about $5.3m additional funding beyond the assumed $1m opening cash to maintain the $250k reserve. Operating cash becomes positive annually in Year 5, but earlier deficits still require financing or lower costs. Upside reaches approximately $136.2m recurring ARR and requires about $4.0m additional funding under aggressive acquisition assumptions. Neither scenario is a demand forecast or valuation guarantee.

Downside ends Year 5 near $4.2m ARR while losing cash every year under the modeled hiring schedule, with about $7.5m additional reserve-preserving funding need. This is deliberately an unmitigated stress case: do not follow that hiring schedule when sales fail. Freeze new roles/channel spend before the modeled cash shortfall, keep the narrow profitable task classes, renegotiate/limit expensive consumption, sell scoped customer-funded service separately, and revise targets/costs. If repeated paid retention is not established by the pilot review, defer marketplace/enterprise/global expansion and reconsider the buyer/problem.

Customer stocks/additions are continuous expected values in the forecast, not fractional real accounts. Actual reporting uses integer customer cohorts and exact reconciled monetary ledgers. The reference model is an editable management calculation, not production billing code.

## Prompt 8 model correction: workload-linked overage

The previous v1 calculation added consumption revenue as a fraction of subscription revenue but did not add incremental overage jobs to supplier costs. This overstated forecast margin. Version 2 preserves the old report and inputs in `model/prior-v1-unlinked-overage/` for audit history and adds an explicit internally authored USD 1.50 retail assumption per equivalent bounded overage job. This is not an offered tariff or provider quote. Overage jobs = modeled consumption revenue / assumed retail per job. Total jobs = expected included utilization + overage jobs. Both model and isolated-runtime unit costs apply to total jobs. The expected included workload is not a contractual allowance cap; published retail allowances require a separate metered entitlement mapping.

Subscription demand targets and earned revenues remain unchanged; increased workload increases COGS and cash funding needs. Additional reserve-preserving funding beyond the assumed $1m starting cash changes from $3,792,947 to **$5,290,966** in Base, from $6,864,281 to **$7,488,533** in Downside, and from $2,966,109 to **$4,026,014** in Upside. Base annual operating cash turns positive in Year 5 rather than Year 4, although cash stays negative without financing during earlier periods. The reserve need uses the lowest monthly cash point, not only year-end balances.

This correction does not validate price, demand, conversion, cost distribution or supplier terms. Consumption still derives from a target fraction rather than an observed utilization cohort; a decision-grade model must estimate demand by customer/task class, failure/retry rate and pricing, then reconcile collections, receivables, taxes and prepaid liabilities. Added checks cover zero overage, price-driven workload sensitivity, invalid price rejection and charging all included/overage jobs.
