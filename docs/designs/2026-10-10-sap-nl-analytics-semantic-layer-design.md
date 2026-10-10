# Design: Natural-language analytics over SAP via a governed semantic layer

- **Spec ID**: 2026-10-10-sap-nl-analytics-semantic-layer
- **Date**: 2026-10-10
- **Status**: proposed (reference only; see [ADR-0004](../adr/0004-sap-nl-analytics-semantic-layer-reference.md) and [ADR-0003](../adr/0003-cds-first-data-access.md))
- **Scope**: architecture reference for LLM-driven analytics on SAP ERP / S/4HANA / BW / Datasphere; no code or SAP objects in this change
- **Relationship to ABAP dev rules**: this design covers read-only analytics only. It does not change ABAP development rules; existing Z/Y programs keep working unchanged. Z/Y data without a governed CDS wrapper is simply out of analytics scope.

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
| D. Query generation and validation | Parse, schema check, authorization check, execution plan, result check | Two paths (see [Query paths](#query-paths-layer-d)): primary structured query intent compiled from templates; secondary free-form SQL against allowlisted views only |
| E. Read-only data access | Approved CDS views, analytic views, restricted execution interface (SELECT-only) | CDS DCL / user-context authorization at runtime; no shared technical super-user; see [Runtime authorization](#runtime-authorization) |

### Retrieval unit: metric bundles, not columns

Retrieval returns a **metric definition bundle**: view, amount field plus its currency field, mandatory filters (exclude cancellations, net returns), date basis field, and required organization keys. Retrieving loose columns drops companion fields such as currency keys or cancellation flags.

### Vector search plus explicit graph

| Purpose | Mechanism |
|---------|-----------|
| Map natural-language terms ("revenue", "customer", "margin") to concepts | Vector search + synonym dictionary |
| Map concepts to views and fields | Explicit, human-approved mapping table |
| Join paths, cardinality, lineage | Graph, seeded automatically from CDS associations and `@ObjectModel` annotations, then curated |

Vector results only nominate candidates. Final joins must follow graph-approved paths.

### Runtime authorization

| Rule | Control |
|------|---------|
| Identity | Queries execute under the requesting user's SAP identity (principal propagation via SSO). |
| Technical user | Allowed only for metadata catalog reads (view catalog, join graph seeding). Never for data reads. |
| Roles | Analytics roles map to explicit authorization objects. No wildcard (`*`) values. |
| Org keys | Refuse the query when the user lacks a role covering a required org key (company code, sales org, plant, operating concern). No partial results. |
| New CDS views | Follow `docs/co-abap.context.md` DA-5: `#CHECK` with DCL; no `#NOT_REQUIRED`. |
| Closing-period break-glass | Exceeding the org-key or row threshold during period close is allowed only through a named break-glass role (no wildcard values), with an approval time-boxed to the close window. Every use is written to an audit log (user, reason, approver, query ID, timestamp). Use is rate-limited per user and per period. Expired approvals are refused without fallback. |
| Privileged CDS objects | Views annotated `#PRIVILEGED_ONLY` are excluded from analytics entirely (no template, free-form SQL, or break-glass path can reach them). This is stricter than DA-5, which only requires `#CHECK` with DCL. |

### Query paths (layer D)

| Path | Role | Generation | Controls |
|------|------|------------|----------|
| Structured intent | **Primary** | The LLM emits a structured intent (measures, dimensions, filters, period) chosen only from the allowlisted catalog; layer D compiles it from approved templates per source | Template compiler resolves joins from graph-approved paths only; [query limits](#query-limits-layer-d) apply |
| Free-form SQL | **Secondary** (questions the catalog templates cannot express) | The LLM writes SQL text | All of the following, otherwise rejected: (1) target only allowlisted views of the routed source (CDS/analytic views on S/4, released BW query views/InfoProvider or CompositeProvider SQL views, Datasphere analytic models or exposed SQL views); **never raw tables**; (2) mandatory parse into an AST and schema allowlist check of every referenced object, field, function, and operator; (3) single `SELECT` statement only (no DML, DDL, procedure calls, multiple statements, or comments carrying hints); (4) same [query limits](#query-limits-layer-d) and cost gate as the primary path; (5) every free-form query logged in the audit log with a `free_form` flag and flagged in the answer ("generated SQL, not a certified template") |

The structured path is tried first; the free-form path is used only when intent compilation fails, and its result is never presented as a certified metric.

### Query limits (layer D)

| Control | Default |
|---------|---------|
| Mandatory filters | Period and org-key filter required; queries without them are rejected |
| Row cap | 10,000 detail rows (initial default, calibrated at onboarding); larger requests must be aggregated |
| Statement timeout | 30 s (initial default, calibrated at onboarding) |
| Cost gate | Pre-execution estimate, not a fixed cost constant (HANA has no single portable cost number). Each source uses its own estimator (see [Cost threshold calibration](#cost-threshold-calibration)) and rejects when the estimate exceeds the threshold for that source, path, and table class, or when the query lacks a filter on the partition/period key of ACDOCA-class tables. Thresholds are recorded per system in the semantic model |
| Memory limit | HANA statement memory limit and/or workload class assigned to the analytics user, configured by Basis, so a runaway statement is cancelled by the database rather than the application |
| Rate limit | Per user |
| Rejections | Every rejected query is logged (see [Result validation](#result-validation)) |

The 10,000-row cap and 30 s timeout are unvalidated starting values. Calibrate the row cap, timeout, and cost threshold from golden-question runs and system sizing during onboarding.

#### Cost threshold calibration

Decided 2026-10-10 ([meeting synthesis](../../memory/meeting-2026-10-10-semantic-layer-open-questions.md)).

| Item | Rule |
|------|------|
| Granularity | One threshold per source, per query path (structured / free-form), and per table class (e.g. ACDOCA-class line items, document headers, master data) |
| Structured path | p99 of estimated rows across calibration runs x 2, capped by a sizing ceiling derived from system sizing |
| Free-form path | min(p95 x 1.25, structured threshold) |
| Calibration runs | ~300 parameterized runs per query class, including a period-close week; use the upper bound of a bootstrap confidence interval of the percentile, not the point estimate |
| Provisional status | A source's threshold stays "provisional" until it has at least 50 golden questions (see [Golden question set](#golden-question-set)) |

| Source | Estimator |
|--------|-----------|
| S/4HANA | HANA `EXPLAIN PLAN` plus a deterministic rule: reject when the period/partition predicate is missing on ACDOCA-class tables |
| BW / BW/4HANA | BW statistics proxies (RSDDSTAT) plus a rule limiting free characteristics in the drill-down, and an OLAP cell/row cap; use `EXPLAIN PLAN` when the query is exposed as a HANA SQL view |
| Datasphere | `EXPLAIN` on the exposed SQL view; reject or downgrade queries that access remote tables (federated access) instead of replicated/persisted data |

- **No estimator available**: the source is labelled "no cost gate" and fails closed: 1,000 rows, 10 s timeout, structured path only, free-form rejected.
- **Break-glass for closing periods**: an audited, rate-limited path lets an authorized role exceed the threshold during period close; every use is logged with reason and approver.
- **Backstop**: the workload class and HANA statement memory limit (Basis) remain in force regardless of the estimator result.

## Untrusted input

- Questions, retrieved field values, and result rows are **data, never instructions**. Embedded prompts are not followed.
- Primary path: the LLM chooses only from an **allowlisted catalog** of metrics, dimensions, and filters, emitting a structured intent.
- Secondary path: LLM-generated SQL text is untrusted. It executes only after parsing, a schema allowlist check of every referenced object, field, function, and operator, and a SELECT-only check (see [Query paths](#query-paths-layer-d)); it never targets raw tables.
- No LLM output is ever executed as ABAP or DDL.

## Read-only scope

- The NL path is **SELECT-only**.
- No write, DDL, function-module, or AMDP write entry point is exposed to the LLM or the NL service.
- Writes happen only in the batch job that fills the Z result tables, outside the NL path.

## Personal data

Personal fields include names, addresses, bank data, tax IDs, employee IDs, and HR `PA*` tables.

| Rule | Control |
|------|---------|
| Default | Excluded from the semantic model |
| Release | Only by a named business owner and a DPO decision, recorded in the metric dictionary |
| Before the LLM | Mask or aggregate personal values before they reach the LLM |
| External LLM provider | Declare per deployment whether result rows leave the SAP boundary. If yes, record the transfer basis (DPA, processing region). |

## The five hard problems in SAP

| Problem | Wrong-result example | SAP-specific trap | Required control |
|---------|---------------------|-------------------|------------------|
| Business meaning | Revenue treated as billed or ordered amount | Sales order (VBAP), delivery, billing (VBRP), and FI revenue (ACDOCA revenue accounts) all called "sales"; intercompany inclusion | Each metric names its document stage; other stages are blocked |
| Table relationships | Order items joined to journal entries, amounts duplicated | Billing → FI link is 1:N via the reference document (BKPF-AWTYP `VBRK` / AWKEY, ACDOCA AWREF/AWITEM), not a clean foreign key; pricing-condition joins inflate amounts; duplicate ACDOCA ledgers (RLDNR) | Aggregate before crossing 1:N edges; ledger fixed to the leading ledger (`0L` by default; read from ledger configuration, see [onboarding checklist](#customizing-onboarding-checklist)) |
| Time basis | Posting date confused with document date | BUDAT vs. BLDAT vs. FKDAT; fiscal-year variant periods (FISCYEARPER); special periods 13-16 | Resolve "quarter" via company code fiscal-year variant; special-period policy declared |
| Organizational scope | Company code or plant omitted | Company code, sales org, plant, operating concern mixed; missing key sums across legal entities | Org keys are mandatory filters; DCL and user authorization enforced at execution |
| Aggregation basis | Currency, unit, cancellation or clearing errors | Transaction (WSL) vs. company-code (HSL) vs. global (KSL) currency, as configured; sales vs. base unit; reversals (STBLG is a BKPF field; on ACDOCA use the XREVERSING/XREVERSED flags or join BKPF) and clearing | Block amount sums without a currency field; cancellation policy (exclude or net); reconcile results to FI balances |

The last two cannot be solved by SQL syntax validation. They need semantic validation rules plus a result-validation step.

## Customer Z/Y objects

The standard VDM does not cover customer Z/Y tables and programs. They enter the semantic layer only through governed wrappers (Z wrapper CDS naming follows DA-8 and authorization follows DA-5 in `docs/co-abap.context.md`; not re-defined here):

| Object | Situation | Handling |
|--------|-----------|----------|
| Z/Y table | Any | Wrap in `ZI_` CDS (DA-8): business field names, `@Semantics.amount.currencyCode` / unit annotations, keys, associations to standard VDM (`I_Customer`, `I_CompanyCode`, ...), **mandatory DCL** (DA-5). Unwrapped tables are out of scope. |
| Z/Y program | Simple logic (joins, filters, aggregation) | Re-implement as `Z` CDS; optionally switch the report to consume it (single definition) |
| Z/Y program | Complex multi-step logic | Persist results via batch into a Z result table, wrap it in CDS; the LLM reads stored results only |
| Z/Y program | Must stay in ABAP, real-time needed | Extract into a class, expose via CDS table function (AMDP) or RAP/OData as a fixed tool; never a SQL-generation target |

Onboarding steps: inventory (`schema-inspector`, `sap-investigator`), classify each object and assign a business owner, data-quality check by `dba` (duplicate keys, missing currency fields, append-only growth), then onboard in the order the metric dictionary and golden questions need them.

## Profitability analysis branch

Margin definitions depend on the CO-PA type and must be modeled separately:

- **Account-based / Margin Analysis** (S/4HANA default): margin from ACDOCA cost and revenue accounts; cost-of-goods-sold split per cost component where configured.
- **Costing-based CO-PA**: value fields (CE1xxxx); not reconcilable line-by-line with FI; state the basis in every answer.

## Metric definition example

| Metric | Definition | Declared basis |
|--------|------------|----------------|
| Net revenue | Revenue minus cancellations and returns. Source: billing VBRP net value, or FI revenue accounts in ACDOCA (choose one per metric, never both) | Date basis FKDAT (billing) or BUDAT (FI); currency HSL or KSL |
| Gross margin | Net revenue minus COGS | Cost basis declared: standard or actual cost |
| Margin % | Gross margin / net revenue | Same scope, period, and currency as both inputs |

The CO-PA type determines the margin source (see [Profitability analysis branch](#profitability-analysis-branch)).

## Metric governance

Decided 2026-10-10 ([meeting synthesis](../../memory/meeting-2026-10-10-semantic-layer-open-questions.md)).

### Ownership: two-key approval

Every metric needs two keys before it is served: a named **business owner** (with a named deputy) and a named **technical steward** per source system (data/DBA side) that implements it.

| Metric family | Business owner | Co-sign |
|---------------|----------------|---------|
| FI money metrics (FI revenue, balances, P&L lines) | Controller | — |
| Margin, COGS | Controlling | — |
| Billed revenue | Sales Controlling | FI, when reconciled to FI |
| Intercompany | Group Controlling | — |

Each row names a person and a deputy in the semantic model, not only a role.

### One definition, many implementations

- One definition per metric. S/4, BW, and Datasphere implementations register under that definition, each with its system of record (see [Multi-source landscapes](#multi-source-landscapes-erp--s4hana--bw--datasphere)).
- Routing of a metric/period pair to a source is co-signed by that source's data owner.
- The Controller rules disputes about closed periods.

### Metric IDs carry document stage and CO-PA type

| Metric ID | Meaning |
|-----------|---------|
| `order_value` | Sales order value (not revenue) |
| `billed_net_revenue` | Billing net value after cancellations and returns |
| `fi_revenue` | Revenue posted to FI revenue accounts (ACDOCA) |
| `gross_margin_acct` | Gross margin from account-based CO-PA / margin analysis |
| `gross_margin_costing` | Gross margin from costing-based CO-PA value fields |

- A bare "revenue" maps to one corporate default, shown in every answer. **Pending Finance decision** (billed net revenue vs FI revenue); see [Open questions](#open-questions).
- A return/cancellation matrix per billing document type is signed by the owner before build.

### Change control

- Every change carries a version ID and a before/after diff of the definition.
- The golden set is re-run and affected expected values are re-signed by the owner.
- Each approved change is recorded as a decision record (DEC).
- Month-end freeze: no metric changes during the close window.
- Metrics without a current owner are not served.
- Each metric has a review date; approval expires after 12 months without review.

## Result validation

A successful query does not mean a correct answer. Required checks:

- Golden question set with expected results (see [Golden question set](#golden-question-set)). **Release gate**: no semantic-model change ships without a passing run, signed by the metric owner.
- Reconciliation: totals tie out to FI balances for the same scope and period.
- Reconciliation against existing Z report outputs, which users treat as the business truth; differences need an explained cause before go-live.
- Audit log for every NL query: user, question hash plus redacted question, resolved metric definitions, intent, views touched, row count. No personal fields and no result values (row count only). Retention 90 days, then ILM. Read access limited to the audit role.
- Every answer states which metric definition, source system, and data as-of time it used.

### Golden question set

Decided 2026-10-10 ([meeting synthesis](../../memory/meeting-2026-10-10-semantic-layer-open-questions.md)).

**Size.** Sized by a coverage matrix with a floor: every hard problem x source x CO-PA type has at least one case.

| Wave | Size | Split |
|------|------|-------|
| First wave | ~60 | 30 structured, 10 free-form, 20 rejection |
| Target | ~120 | FI 30, SD 25, CO 25, MM 20, cross-module 20 |

A source needs at least 50 cases before its cost threshold leaves "provisional".

**Mandatory content.**

- Flagship: "revenue up, margin down by customer this quarter"
- FI reconciliation to G/L (zero tolerance, company-code currency)
- Billing-to-FI bridge
- Three existing Z reports per module
- Cancellations and returns, special periods, non-leading ledger, intercompany, multi-currency
- Lag warning on a lagging source, cross-source composed answer
- Refusal cases (authorization, missing filters, out-of-scope objects)
- Cross-org leakage: a user authorized for one company code / sales org asks an unscoped question; expected result is only data for the authorized org (or a refusal), verified on each source (S/4 CDS DCL, BW analysis authorizations, Datasphere data access controls)

**Expected-result schema.** Each case records: question, resolved metric ID and version, source, period and org scope, expected result (keys, counts, amounts, currency) or expected rejection reason, tolerance, signing owner, and last-verified date.

| Tolerance | Value |
|-----------|-------|
| Counts and keys | Exact |
| Amounts | 0.01 in document currency |
| Cross-source comparison | 0.0001% relative |

**Run cadence.** On every semantic-model change, nightly on non-production, and before each release.

**Release gate.** 100% of rejection cases pass; the certified structured set passes; zero cross-org leakage; no unexplained reconciliation difference. The free-form pass rate is reported separately and does not certify a metric.

**Ownership.** The metric owner signs each expected value; each case carries a last-verified date.

## Multi-source landscapes (ERP / S/4HANA / BW / Datasphere)

Target landscape (decided 2026-10-10): S/4HANA, BW (BW/4HANA), and Datasphere are all in scope.

| Source | Access path | Runtime authorization |
|--------|-------------|-----------------------|
| S/4HANA | Released VDM CDS views (interface, cube, query) and governed `Z*` CDS | CDS DCL (DA-5) plus PFCG authorization objects |
| BW / BW/4HANA | BW queries on InfoProviders and CompositeProviders (via released query views / OData / generated SQL views) | BW analysis authorizations (RSECADMIN) for the requesting user |
| Datasphere | Analytic models and exposed SQL views in approved spaces | Datasphere data access controls and space membership |

- **System of record per metric**: the same metric in S/4 CDS, BW, and Datasphere can differ because of load timing and transformation logic. Each metric in the dictionary names exactly one source (optionally per period range, e.g. closed periods from BW, open period from S/4).
- **Source routing (layers B/C)**: intent parsing resolves metric and period; the semantic model then routes each metric/period pair to its system of record. The routing decision is part of the resolved metric bundle and is shown with the answer.
- **Latency disclosure**: BW and Datasphere lag by the load cycle. Every answer states the source's data as-of time (last successful load), and warns explicitly when an open period such as "this quarter" is answered from a lagging source.
- **No cross-source SQL joins**: no query, template, or free-form SQL joins S/4, BW, and Datasphere objects. When a question spans sources, each source is queried separately under its own authorization and limits, and the results are composed at the result layer (aggregate first, then merge on shared conformed keys such as customer, company code, and period), with each part's source and as-of time disclosed.
- **Authorization per source**: refusal rules in [Runtime authorization](#runtime-authorization) apply per source; if any required source refuses, the composed answer is refused rather than returned partially.

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
- [ ] Calibrate query limits (row cap, timeout, cost threshold) from golden-question runs
- [ ] HANA statement memory limit / workload class set for the analytics user (Basis)

## Mapping to this project's agents

| Need | Agent |
|------|-------|
| Business rules per module (revenue, margin, cancellation) | `fi-analyst`, `sd-analyst`, `co-analyst`, `mm-analyst` |
| CDS catalog, association and dependency graph | `schema-inspector` (`GetCDSDependencies`) |
| CDS exposure via OData / RAP | `interface-expert` (`GetCDSExposure`) |
| Semantic-layer CDS design and performance | `dba`, `architect` |
| Authorization and DCL review | `security-monitor` (DA-5 review via GetSource on DDLS/DCLS) |

## Open questions

1. ~~Target landscape: S/4HANA only, or S/4HANA plus BW/Datasphere?~~ **Decided 2026-10-10**: S/4HANA, BW, and Datasphere are all in scope (see [Multi-source landscapes](#multi-source-landscapes-erp--s4hana--bw--datasphere)).
2. ~~Free-form SQL with validation, or structured query intent only?~~ **Decided 2026-10-10**: structured query intent is the primary path; validated free-form SQL is supported as a secondary path (see [Query paths](#query-paths-layer-d)).
3. ~~Who owns and approves metric definitions in the term dictionary?~~ **Decided 2026-10-10 (meeting synthesis)**: two-key approval with change control (see [Metric governance](#metric-governance)).
4. ~~Golden question set: initial size and owners per module.~~ **Decided 2026-10-10 (meeting synthesis)**: ~60 first wave growing to ~120 by module (see [Golden question set](#golden-question-set)).
5. ~~Query-limit calibration: which golden-question percentile and safety factor set the cost threshold, and does the target analytics layer expose an `EXPLAIN PLAN` equivalent?~~ **Decided 2026-10-10 (meeting synthesis)**: per source/path/table class thresholds with per-source estimators (see [Cost threshold calibration](#cost-threshold-calibration)).
6. Corporate default for bare "revenue": billed net revenue or FI revenue? Owner: Finance (see [Metric governance](#metric-governance)).

Decisions 3-5 follow the [meeting synthesis](../../memory/meeting-2026-10-10-semantic-layer-open-questions.md).

> **Dissent on record**: red-team objected to setting thresholds and golden-set sizes before named owners and a target system exist, and set withdrawal conditions (one source end to end first; free-form SQL off by default behind role and kill switches). These conditions were not adopted; see the [meeting record](../../memory/meeting-2026-10-10-semantic-layer-open-questions.md).

## Constraints

- Building the semantic model requires catalog queries against a live SAP system (the `abap` MCP server). Run that work from the local CLI environment.
