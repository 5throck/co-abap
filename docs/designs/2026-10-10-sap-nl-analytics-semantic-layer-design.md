# Design: Natural-language analytics over SAP via a governed semantic layer

- **Spec ID**: 2026-10-10-sap-nl-analytics-semantic-layer
- **Date**: 2026-10-10
- **Status**: proposed
- **Scope**: architecture reference for LLM-driven analytics on SAP ERP / S/4HANA / BW / Datasphere; no code or SAP objects in this change

## Problem

Letting an LLM explore raw SAP tables (VBAK, VBRP, BSEG, ACDOCA, ...) produces answers that execute successfully but are wrong in business terms: revenue confused with order value, duplicated amounts from 1:N joins, posting date mixed with document date, missing company-code filters, and currency or cancellation errors. SQL syntax validation cannot catch these.

Example question: *"Find customers whose revenue grew this quarter while their margin declined."*

## Decision

Query **only a verified business semantic model**, never the raw schema.

- S/4HANA: the Virtual Data Model (VDM) exposes tables through CDS views with business meaning (interface `I_*`, cube, and query views). Use released views first, consistent with the CDS-first rule in `agents/code-writer.md` (rule 8).
- Datasphere: facts, dimensions, measures, hierarchies, and associations composed into analytic models.
- Company-specific definitions (net revenue, margin) live in one custom layer (`Z*` CDS or a Datasphere analytic model) on top of standard views. That layer is the single source of truth for the term dictionary.

The LLM never receives the whole database. It receives only the concepts, views, columns, and relationships retrieved for the question. Only queries that pass policy checks execute.

## Architecture

| Layer | Responsibility | Key components |
|-------|----------------|----------------|
| A. User interface | Question, result table, chart, follow-up questions | Shows source, as-of time, and applied defaults with every answer |
| B. Intent parsing | Analysis type, period, organization, measures, ambiguity detection | Asks back or applies a declared default (e.g., fiscal vs. calendar quarter, comparison basis, billing vs. FI revenue, standard vs. actual cost) |
| C. Metadata and semantic model | Term dictionary, CDS/view catalog, join graph, sample queries | Vector search for terms, explicit graph for joins (see below) |
| D. Query generation and validation | Parse, schema check, authorization check, execution plan, result check | Prefer a structured query intent (measures, dimensions, filters, period) compiled from templates over free-form SQL |
| E. Read-only data access | Approved CDS views, analytic views, restricted execution interface | CDS DCL / user-context authorization at runtime; no shared technical super-user |

### Retrieval unit: metric bundles, not columns

Retrieval returns a **metric definition bundle**: view, amount field plus its currency field, mandatory filters (exclude cancellations, net returns), date basis field, and required organization keys. Retrieving loose columns drops companion fields such as currency keys or cancellation flags.

### Vector search plus explicit graph

| Purpose | Mechanism |
|---------|-----------|
| Map natural-language terms ("revenue", "customer", "margin") to concepts | Vector search + synonym dictionary |
| Map concepts to views and fields | Explicit, human-approved mapping table |
| Join paths, cardinality, lineage | Graph, seeded automatically from CDS associations and `@ObjectModel` annotations, then curated |

Vector results only nominate candidates. Final joins must follow graph-approved paths.

## The five hard problems in SAP

| Problem | Wrong-result example | SAP-specific trap | Required control |
|---------|---------------------|-------------------|------------------|
| Business meaning | Revenue treated as billed or ordered amount | Sales order (VBAP), delivery, billing (VBRP), and FI revenue (ACDOCA revenue accounts) all called "sales"; intercompany inclusion | Each metric names its document stage; other stages are blocked |
| Table relationships | Order items joined to journal entries, amounts duplicated | Billing item → multiple FI lines (1:N); pricing-condition joins inflate amounts; duplicate ACDOCA ledgers (RLDNR) | Aggregate before crossing 1:N edges; ledger fixed to `0L` by default |
| Time basis | Posting date confused with document date | BUDAT vs. BLDAT vs. FKDAT; fiscal-year variant periods (FISCYEARPER); special periods 13-16 | Resolve "quarter" via company code fiscal-year variant; special-period policy declared |
| Organizational scope | Company code or plant omitted | Company code, sales org, plant, operating concern mixed; missing key sums across legal entities | Org keys are mandatory filters; DCL and user authorization enforced at execution |
| Aggregation basis | Currency, unit, cancellation or clearing errors | Transaction vs. company-code vs. group currency (HSL/KSL); sales vs. base unit; reversals (STBLG) and clearing | Block amount sums without a currency field; cancellation policy (exclude or net); reconcile results to FI balances |

The last two cannot be solved by SQL syntax validation. They need semantic validation rules plus a result-validation step.

## Result validation

A successful query does not mean a correct answer. Required checks:

- Golden question set with expected results, run on every semantic-model change.
- Reconciliation: totals tie out to FI balances for the same scope and period.
- Every answer states which metric definition, source system, and data as-of time it used.

## Multi-source landscapes (ERP / S/4HANA / BW / Datasphere)

- **System of record per metric**: the same metric in S/4 CDS and BW/Datasphere can differ because of load timing and transformation logic. Fix one source per metric.
- **Latency disclosure**: BW/Datasphere lag by the load cycle. Tell the user when an open period such as "this quarter" is queried.
- **No cross-source joins initially**: do not let the LLM join S/4 and BW data. Start with a single integrated layer, such as Datasphere.

## Customizing onboarding checklist

CDS views and analytic models settle much in advance, but not every business rule. Before go-live, confirm each item below for the target system and record the result in the semantic model:

- [ ] Fiscal-year variant(s) per company code
- [ ] Currency types in use (company code, group, others)
- [ ] Ledger configuration (leading and non-leading ledgers)
- [ ] Revenue G/L account ranges
- [ ] Cancellation and return handling per sales and billing document type
- [ ] Z fields and Z tables used in revenue or cost logic
- [ ] Profitability analysis type (costing-based or account-based / margin analysis)
- [ ] Authorization objects and DCL roles mapped to analytics users

## Mapping to this project's agents

| Need | Agent |
|------|-------|
| Business rules per module (revenue, margin, cancellation) | `fi-analyst`, `sd-analyst`, `co-analyst`, `mm-analyst` |
| CDS catalog, association and dependency graph | `schema-inspector` (`GetCDSDependencies`) |
| CDS exposure via OData / RAP | `interface-expert` (`GetCDSExposure`) |
| Semantic-layer CDS design and performance | `dba`, `architect` |
| Authorization and DCL review | `security-monitor` |

## Open questions

1. Target landscape: S/4HANA only, or S/4HANA plus BW/Datasphere?
2. Free-form SQL with validation, or structured query intent only (recommended for phase 1)?
3. Who owns and approves metric definitions in the term dictionary?
4. Golden question set: initial size and owners per module.

## Constraints

- Building the semantic model requires catalog queries against a live SAP system (the `abap` MCP server). Run that work from the local CLI environment.
