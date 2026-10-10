# Meeting — CDS-first rule and SAP NL-analytics semantic layer: further improvements

- **Date**: 2026-10-10
- **Facilitator**: PM
- **Format**: inline, 2 rounds, role-played by PM (no sub-agent dispatch)
- **Participants**: architect, dba, code-writer, co-analyst / fi-analyst, security-monitor, test-runner, **red-team (dissent seat)**
- **Scope**: `agents/code-writer.md` rule 8, `agents/architect.md` rule 6, `docs/clean-abap-checklist.md` CDS item, `docs/designs/2026-10-10-sap-nl-analytics-semantic-layer-design.md` (PR #190); the relax-CDS-first-for-existing-Z/Y-programs proposal was adopted (DA-2, `docs/co-abap.context.md`)
- **Outcome status**: APPLIED — approved by the user on 2026-10-10 and applied in PR #190; rules now live in `docs/co-abap.context.md` DA-1..DA-8

## Agenda

1. Is the "relax for existing Z/Y programs" proposal sufficient?
2. Gaps in the ABAP development rules
3. Gaps in the semantic-layer design
4. Verification and enforcement

## Round 1 — Positions

- **architect**: Agrees with the new-vs-maintenance split. Adds that the decision needs an explicit trigger. "Existing program" must be defined: same object, or any change touching an existing data read? Proposes a decision table: bug fix / small enhancement → follow existing pattern; new report or new data read inside an old program → CDS-first applies to the new read only. Also wants a release-state check: S/4 version and C1 release differ per system, so "released standard CDS" must be verified against the target system, never assumed from documentation.
- **dba**: The real risk is not CDS vs. Open SQL but bad SQL. Proposes making the SQL quality baseline (no SELECT in LOOP, no `SELECT *`, index-supported WHERE, FOR ALL ENTRIES empty-table guard, DB-side aggregation) a **must** independent of CDS. Also warns that stacked CDS views (5+ levels, calculated fields in WHERE) can be slower than tuned Open SQL; CDS-first must not mean CDS-always. Wants a performance check (`TraceExecution` / SQL trace) when a new CDS replaces existing logic.
- **code-writer**: Needs concrete guidance, not only an order. Requests: (a) naming convention for wrapper CDS (`ZI_`, `ZR_`, `ZC_`) aligned with VDM, (b) a list of common released views per module to search first, (c) clarification of ECC vs. S/4: on ECC there is no VDM and limited CDS support, so rule 8 must branch by system release.
- **co-analyst / fi-analyst**: Semantic layer must cover account-based vs. costing-based CO-PA explicitly; margin definitions differ completely. Also notes that Z reports are the de facto business truth; the design's reconciliation step must compare against the existing Z report outputs, not only FI balances.
- **security-monitor**: Z tables often lack authorization checks in the programs that read them. Wrapping a Z table in CDS without DCL exposes data that was previously protected only by transaction access. Proposes: no Z wrapper CDS reaches the analytics layer without DCL; and an audit log of every NL query (user, question, generated query, views touched).
- **test-runner**: When an old program's Open SQL is migrated to CDS, there is no regression evidence today. Proposes a mandatory before/after result comparison (same selection, row count and totals equal) for any CDS conversion.
- **red-team (dissent seat)**: Challenges the premise. "We have just merged a CDS-first rule and are already carving exceptions; with ECC, maintenance, Z tables, and performance carve-outs, the rule becomes advisory. Either make it a narrow, enforceable rule or don't call it a rule. Also: the NL-analytics design is a separate product with no confirmed sponsor or target system; documenting it in an ABAP harness repo risks scope creep. It should stay `proposed` and not drive changes to agent rules until open questions 1–4 are answered."

## Round 2 — Responses

- **architect → red-team**: Accepts the narrowing point. Proposes rule 8 apply to a precise trigger ("new data read in new or changed code on S/4HANA"), with everything else following existing patterns. Narrow but enforceable.
- **dba → red-team**: Agrees; the enforceable part is the SQL quality baseline, which applies everywhere. CDS-first is the design preference, SQL quality is the gate.
- **code-writer**: Supports a release branch: S/4HANA → CDS-first; ECC/NetWeaver without VDM → Open SQL with quality baseline, CDS optional.
- **security-monitor → red-team**: Agrees the NL design should not change ABAP rules now, except one item that matters regardless: any new Z wrapper CDS must ship with DCL.
- **red-team (final dissent, verbatim)**: "I accept the narrowed trigger. I still object to treating the NL-analytics design as a basis for any harness change before a target system and owner exist. Keep it as a reference document only."

## Proposals (approved and applied)

| # | Proposal | Owner | Priority |
|---|----------|-------|----------|
| P1 | Narrow rule 8 trigger: applies to **new data reads on S/4HANA**; maintenance of existing Z/Y code follows the existing pattern with no rationale required; ECC/non-VDM systems use Open SQL + quality baseline | code-writer / architect | High |
| P2 | Split the checklist: CDS-first → `should` (new reads only); new **SQL quality baseline** item → `must` for all code (no SELECT in LOOP, no `SELECT *`, index-supported WHERE, FOR ALL ENTRIES empty guard, DB-side aggregation) | dba | High |
| P3 | Verify released CDS against the target system (`SearchObject` / C1 release state), never from documentation alone | architect / schema-inspector | High |
| P4 | Any new Z wrapper CDS ships with DCL; no wrapper reaches analytics without DCL | security-monitor | High |
| P5 | CDS conversion of existing logic requires before/after result comparison (row count, totals) and a performance trace | test-runner / dba | Medium |
| P6 | Add wrapper CDS naming convention (`ZI_`/`ZR_`/`ZC_`) and a per-module "search these released views first" list to `skills/abap-dev` | code-writer / module analysts | Medium |
| P7 | Design doc (PR #190): add Z/Y object handling section, CO-PA type branch, reconciliation against existing Z report output, NL query audit log; keep status `proposed`, state it does not change ABAP dev rules | PM / co-analyst / security-monitor | Medium |
| P8 | Warn against deep CDS stacks (guideline: review if >4 levels or calculated fields in WHERE) | dba | Low |

## Preserved dissent

- **red-team**: "I still object to treating the NL-analytics design as a basis for any harness change before a target system and owner exist. Keep it as a reference document only." — Reflected in P7 (status stays `proposed`, explicitly decoupled), but the objection stands for any future change motivated by the design.

## Action items (completed in PR #190)

- PR A (ABAP rules): P1, P2, P3, P4, P5, P8 → `agents/code-writer.md`, `agents/architect.md`, `docs/clean-abap-checklist.md`
- PR A or follow-up: P6 → `skills/abap-dev/SKILL.md`
- PR #190 follow-up commit: P7
