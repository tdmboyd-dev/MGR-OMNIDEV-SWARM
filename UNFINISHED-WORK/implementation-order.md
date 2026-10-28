# Recommended implementation order

| Stage | Work | Exit gate |
|---|---|---|
| 1. Prove access and execution | AUTH-01/02, RUN-01, SEC-03, QA-01 | Real account model request, repository consent and isolated worker evidence |
| 2. Prove a development loop | RUN-02/03, DEV-01/02, QA-02, UX-01/02 | Real behavioral fix → isolated tests → review → draft PR → safe recovery |
| 3. Make the platform operational | DATA-01/03, SEC-02, OPS-01/03/04 | Scoped permissions, recoverable storage, healthy supervised runtime and tested staging release |
| 4. Build real healing and twins | OPS-02, TWIN-01, GRAPH-01/02, GAP-01 | Induced staging incident repaired with health gates and rollback evidence |
| 5. Expand the ecosystem | INT-01, CONN tasks, DOM tasks, DATA-02 | Individually verified adapters and specialist workflows |
| 6. Add executive and business intelligence | BIZ-01/02, TWIN-02, FUT-01, EXEC-01, LEGAL-01 | Evidence-based metrics, hypotheses and validated recommendations |
| 7. Prepare broader release | UX-03, QA-03, REL-01 | Complete docs, operating evidence and product journeys |

REL-02 is reserved for the user's later GitHub-copy instruction. It can occur before all platform features are complete, provided this folder is included and current scope remains explicit.

No exact delivery dates or staffing estimates have been validated. Stages may overlap where dependencies allow. Provider approval and owner consent cannot be treated as successful merely because code exists.
