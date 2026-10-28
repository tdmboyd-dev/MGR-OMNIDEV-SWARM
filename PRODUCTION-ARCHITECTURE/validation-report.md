# Architecture verification

192 automated documentation and contract checks passed.

Scope: JSON parsing, compatible JSON Schema keyword compilation, event/run positive and negative fixtures, local OpenAPI references and path parameters, documentation links, score/capacity arithmetic, SQL RLS declarations.

- AJV 6 checks the draft-7-compatible keywords used here; this is not complete JSON Schema 2020-12 or OpenAPI conformance certification.
- SQL and GraphQL are reference designs; no PostgreSQL execution or GraphQL parser validation was performed.
- No production service, provider authorization, microVM, load, recovery, or self-healing certification is implied.
