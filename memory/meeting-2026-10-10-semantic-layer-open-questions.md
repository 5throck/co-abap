# Meeting — Semantic-layer design: open questions 3-5

- **Date**: 2026-10-10
- **Facilitator**: PM
- **Format**: one round of independent written positions by dispatched specialist agents (no role-play); PM synthesis
- **Participants**: fi-analyst (sonnet), co-analyst (sonnet), sd-analyst (sonnet), test-runner (haiku), dba (sonnet), **red-team dissent seat** (sonnet)
- **Input decisions (user, 2026-10-10)**: target landscape = S/4HANA + BW + Datasphere; query mode = structured intent primary, free-form SQL secondary
- **Design doc**: `docs/designs/2026-10-10-sap-nl-analytics-semantic-layer-design.md`
- **Outcome status**: PROPOSAL — synthesis approved by the user on 2026-10-10 and applied to the design doc (PR #191); bare-"revenue" default left to Finance; red-team withdrawal conditions not adopted

## Agenda

- Q3. Who owns and approves metric definitions?
- Q4. Golden question set: initial size and owners
- Q5. Cost threshold: percentile, safety factor, estimate availability per source

## Positions (summarized; full reports in session record)

### Q3 — Metric ownership

| Participant | Position |
|-------------|----------|
| fi-analyst | Business metric owner per module (FI: Controller / Head of Accounting). Controller is the single approver of money metrics. RACI: analyst drafts, metric owner accountable, architect/schema-inspector map, auditor/DPO/security-monitor consulted. Every change: version, diff, golden re-run, DEC record. Month-end freeze. Controller rules S/4-vs-BW disputes on closed periods; source data owner co-signs routing. |
| co-analyst | Two-key sign-off: business owner (Controlling for margin/COGS/cost basis; Finance for revenue) + technical steward (semantic-model team). Account-based and costing-based margin are separate metric IDs with declared cost basis. One definition per metric; BW/Datasphere copies register as implementations and ship only on owner sign-off. Named person + deputy. |
| sd-analyst | Two-key: SD revenue owner (Sales Controlling / billing process owner) + FI/Controlling co-sign when FI reconciliation is needed + technical steward. Document stage in the metric name (order value / billed net revenue / FI revenue); bare "revenue" maps to one declared corporate default (Finance confirms). Return/cancellation matrix per billing document type. Intercompany excluded by default, separate metric owned by Group Controlling. |
| test-runner | Metric-bundle change → new version ID, before/after value diff, re-signed expected results, DEC record. No one edits an expected value to pass a run without that record. |
| dba | Technical catalog ownership with the data/DBA side, one named owner per source system; view change triggers golden re-run and cost recalibration before release. |
| red-team | Named person + deputy per metric before it enters the dictionary; unowned metrics are not served; review date with auto-expiry (dormant after 12 months). |

### Q4 — Golden question set

| Participant | Initial size | Notes |
|-------------|--------------|-------|
| fi-analyst | ~120 (FI 30, SD 25, CO 25, MM 20, cross-module/source 20) | FI: 5 per hard problem + 5 refusal; split across S/4, BW, Datasphere; FI ties to G/L with zero tolerance; 3 Z reports per module reconciled |
| co-analyst | CO 15-20 + 3-5 negative | Must-haves: margin by product/customer/period, COGS by cost basis, account- vs costing-based, margin vs FI, plan vs actual, order settlement, closed-period BW vs open-period S/4, special periods, HSL vs KSL |
| sd-analyst | SD ~25; first wave 40-60 total | Flagship "revenue up, margin down by customer this quarter"; billed vs FI reconciliation; cancellations/credit memos; intercompany exclusion; open orders vs billed; multi-currency; lag warning; negative and cross-source cases; expected values frozen from closed periods |
| test-runner | ~60 (30 structured, 10 free-form, 20 rejection) | Expected-result schema (metric ID+version, source, period, org keys, currency, value, row count, refusal code); tolerances (exact counts, 0.01 amounts, 0.0001% cross-source); runs on each model change, nightly, pre-release; gate = 100% rejection + certified structured pass, zero cross-org leakage, no unexplained reconciliation diff; free-form reported separately |
| dba | ≥50 per source for calibration (≥30 on largest fact tables), target 100 per source | Below 30 → max × 2 and source marked "provisional"; never pool sources |
| red-team | Size by a coverage matrix, not headcount | Each hard problem × each source × each CO-PA type ≥ 1 case; owner and last-verified date per case; expired cases flagged; free-form adversarial cases |

### Q5 — Cost threshold

| Participant | Position |
|-------------|----------|
| dba | Structured path: p99 of estimated rows × 2, capped by a sizing-based hard ceiling. Free-form: min(p95 × 1.25, structured threshold). Express estimate as ratio of threshold. S/4: EXPLAIN PLAN plus a deterministic period/partition-key predicate rule. BW: no SQL EXPLAIN — use BW statistics (RSDDSTAT), free-characteristic rule, OLAP result cap, workload class; prefer EXPLAIN when exposed as a HANA SQL view. Datasphere: EXPLAIN PLAN on HANA Cloud and reject/downgrade remote (federated) table access without a replicated copy. No estimate → fail closed: 1,000 rows, 10 s, low-priority workload class, structured path only; free-form rejected. Workload class and memory limit remain the real backstop. |
| fi-analyst | p95 × 2 as a start; per source and per table class (ACDOCA vs SD aggregates); BW/Datasphere fallback needs Basis confirmation. |
| co-analyst | Calibrate CO-PA line items separately, using period-closed runs. |
| sd-analyst | Calibrate in a period-close week (VBRP/ACDOCA peak at period end). |
| test-runner | Parameterize templates over periods and org keys to get ~300 runs per query class; threshold = upper bound of bootstrap CI of the percentile × safety factor; recalibrate on material volume growth. |
| red-team | Percentile on golden runs encodes their bias and blocks legitimate year-end queries; needs per-source/per-class thresholds, an audited rate-limited break-glass path for closing periods, and sources without an estimator labelled "no cost gate" with stricter limits, never a silent pass. |

## Synthesis — Proposals (approved and applied)

| # | Proposal | Basis |
|---|----------|-------|
| Q3-1 | **Two-key approval** per metric: named business owner + named deputy (FI money metrics: Controller; margin/COGS: Controlling; billed revenue: Sales Controlling with FI co-sign when reconciled to FI; intercompany: Group Controlling) and a named technical steward per source system (data/DBA side). | fi, co, sd, dba, red-team |
| Q3-2 | **One definition per metric**; S/4, BW, Datasphere implementations register under it with a system of record; routing co-signed by the source data owner; Controller rules closed-period disputes. | fi, co |
| Q3-3 | **Document stage and CO-PA type in the metric ID** (order value / billed net revenue / FI revenue; `gross_margin_acct` / `gross_margin_costing`); bare "revenue" maps to one corporate default confirmed by Finance and shown in every answer; return/cancellation matrix per billing document type signed before build. | sd, co |
| Q3-4 | **Change control**: version ID, before/after diff, golden re-run, re-signed expected values, DEC record; month-end freeze; unowned metrics not served; review date with 12-month expiry. | fi, test-runner, red-team |
| Q4-1 | **Size by coverage matrix with a floor**: every hard problem × source × CO-PA type has ≥ 1 case; first wave ~60 (test-runner structure: 30 structured, 10 free-form, 20 rejection) growing to ~120 by module (fi split); ≥ 50 per source before a source's cost threshold leaves "provisional". | test-runner, fi, sd, dba, red-team |
| Q4-2 | **Mandatory content**: flagship "revenue up, margin down by customer this quarter"; FI reconciliation to G/L (zero tolerance, company-code currency); billing-to-FI bridge; 3 Z reports per module; cancellations, special periods, non-leading ledger, intercompany, multi-currency, lag warning, cross-source composed, refusal cases. | co, sd, fi |
| Q4-3 | **Expected-result schema, tolerances and release gate** per test-runner; owner signs each expected value; each case has a last-verified date; free-form pass rate reported separately. | test-runner, red-team |
| Q5-1 | **Per source, per path, per table class thresholds**: structured p99 × 2 with a sizing ceiling; free-form min(p95 × 1.25, structured). Calibrate on ~300 parameterized runs per query class including a period-close week. | dba, test-runner, fi, sd, co |
| Q5-2 | **Estimator per source**: S/4 EXPLAIN PLAN + deterministic period/partition predicate rule; BW statistics proxies + OLAP cap; Datasphere EXPLAIN + remote-table check. Sources without an estimator are labelled "no cost gate" and fail closed (1,000 rows, 10 s, structured only, free-form rejected). | dba, red-team |
| Q5-3 | **Audited, rate-limited break-glass path for closing periods**; workload class and statement memory limit remain the backstop. | red-team, dba |

## Open conflicts for the user

- **Golden set size**: ~60 (test-runner) vs 40-60 (sd) vs ~120 (fi). Synthesis proposes 60 first wave → 120 target; the user may fix one number.
- **Percentile**: p95 × 2 (fi) vs p99 × 2 structured (dba). Synthesis follows dba (p95 would block ~5% of certified questions by construction).
- **Corporate default for bare "revenue"**: billed net revenue vs FI revenue — needs a Finance decision (sd).

## Preserved dissent (verbatim)

**red-team**: "I object to approving thresholds and golden-set sizes before a named metric owner and a target system exist. Numbers set without owners are decoration. Ship one source with named owners first, and keep free-form SQL off until its audit evidence is in."

Red-team challenges to the user's decisions and withdrawal conditions:
- Decision 1 (three sources): risk of three non-equivalent authorization models (PFCG/DCL, RSECADMIN, Datasphere spaces) and an untested composed-answer refusal rule. Withdraws if the first release ships one source end to end and the other two are gated behind their own sign-off.
- Decision 2 (free-form SQL): widens the allowlist attack surface to three SQL dialects and bypasses certified-metric controls. Withdraws if free-form is off by default, enabled per user role with an admin switch and kill switch, read-only on certified views, with per-source dialect parsers, and its results are never mixed into certified metrics.

## Risks raised

- Circular validation when expected values come from the metric definers or from wrong legacy Z reports (test-runner).
- S/4 vs BW vs Datasphere numbers diverging for open or just-closed periods without an agreed bridge (fi, sd).
- Margin answers with wrong cost basis or CO-PA type looking authoritative (co).
- HANA estimates weak for multi-join/skewed filters; cost gate must be a pre-filter, not the main protection (dba).
