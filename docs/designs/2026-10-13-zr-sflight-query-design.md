# ZR_SFLIGHT_QUERY — classic ABAP report with full-screen ALV over SFLIGHT

- **Spec ID**: 2026-10-13-zr-sflight-query
- **Date**: 2026-10-13
- **Status**: implemented (Design Gate Row 0, architect)
- **Scope**: SAP system object `PROG ZR_SFLIGHT_QUERY` (new, package `$TMP`); repository design doc only (this file)

## 1. Context and goal

The project needs a demonstrably correct, simple classic ABAP report that queries the flight demo table SFLIGHT and presents the result rows in a full-screen ALV, so the team has a reference implementation of the selection-screen → Open SQL → CL_SALV_TABLE display chain on this on-prem system. The report is a new local object (`$TMP`, no transport request) named ZR_SFLIGHT_QUERY. The name ZSFLIGHT_REPORT is already taken in `$TMP` on the target system and is left untouched. This design covers requirements, design decisions, the program interface, risk, the serial execution plan, and the handoffs to code-writer and test-runner.

## 2. Requirements (ADR-0098 §2.8 — one instruction per sentence, active voice)

1. Create the report program ZR_SFLIGHT_QUERY in package $TMP.
2. Define SELECT-OPTIONS on the selection screen for CARRID, CONNID, and FLDATE.
3. Select rows from table SFLIGHT with a WHERE clause that applies the three selection ranges.
4. Order the result set by the primary key columns MANDT, CARRID, CONNID, FLDATE.
5. Display the result set in a full-screen ALV built with CL_SALV_TABLE.
6. Enable the standard ALV functions on the grid.
7. Optimize all ALV column widths.
8. Print an informational message and terminate normally when the selection returns no rows.
9. Pass the syntax check and complete an ATC run before handover.
10. Do not modify the existing program ZSFLIGHT_REPORT.

## 3. Acceptance criteria

| ID | Criterion | Verified by |
|----|-----------|-------------|
| AC-01 | Selection screen offers SELECT-OPTIONS for CARRID, CONNID, FLDATE | Manual execution; code review |
| AC-02 | Data selected from SFLIGHT with `WHERE ... IN seltab` conditions, ordered by primary key | Code review of SELECT statement; manual execution |
| AC-03 | Full-screen ALV via CL_SALV_TABLE with standard functions enabled and optimized columns | Manual execution (grid shows toolbar, sortable/filterable columns) |
| AC-04 | Empty result set produces an informational message and a clean exit, no dump | Manual execution with a selection that matches nothing (e.g. nonexistent carrier) |
| AC-05 | Syntax check PASSED; ATC run completed by test-runner | test-runner QA report |

## 4. Design decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | **Pattern B (New/Rewrite)** | Pattern rule evaluated in order; first match wins. The task creates a new object (ZR_SFLIGHT_QUERY does not exist), so Pattern B applies. Patterns A (modify existing) and C (extend) are not applicable. |
| D2 | **Object name ZR_SFLIGHT_QUERY** | PM investigation (TADIR, `OBJECT='PROG'`, `OBJ_NAME LIKE 'Z%'`) shows ZSFLIGHT_REPORT already exists in `$TMP`; touching it is out of scope (requirement R10). ZR_SFLIGHT_QUERY is free and follows the local-report naming convention (ZR_ prefix). |
| D3 | **Classic (old-style) Open SQL** | The system is on-prem with DDIC objects dated 2016. Classic Open SQL (space-separated lists, `INTO TABLE`, no inline declarations) is release-safe and keeps the report readable for a demo scope. Inline declarations (`DATA(...)`, `@DATA(...)`) are avoided to stay compatible. |
| D4 | **Data access level 3 (direct Open SQL on SFLIGHT)** | ABAP Cloud clean-core discipline requires released CDS views, but this system has no /DMO/ reference tables and no released VDM CDS view for SFLIGHT. SFLIGHT is a demo/training data model, not a productive business table. Direct Open SQL on the DDIC table is therefore acceptable; recorded here as the rationale required by the data-access policy. |
| D5 | **Package $TMP, local object** | Demo scope; no transport request is needed and none must be created. The object will not be transported. |
| D6 | **CL_SALV_TABLE factory (`CL_SALV_TABLE=>FACTORY`) with full-screen container-less display** | Simplest full-screen ALV path: no custom container, no screen painter, no dynpro. `->GET_FUNCTIONS( )->SET_ALL( )` enables standard functions; `->GET_COLUMNS( )->SET_OPTIMIZE( )` optimizes widths. |
| D7 | **Empty-result handling in the program, not in ALV** | `IF lines( lt_sflight ) = 0.` → `MESSAGE ... TYPE 'I'` (or `MESSAGE s001`-style informational), then exit the event block normally. No exception, no dump (AC-04). |

## 5. Program interface specification (for code-writer)

### 5.1 Selection screen

| Element | Type | Reference | Text |
|---------|------|-----------|------|
| `SELECT-OPTIONS s_carrid` | `s_carrid FOR sflight-carrid` | SFLIGHT-CARRID | Carrier |
| `SELECT-OPTIONS s_connid` | `s_connid FOR sflight-connid` | SFLIGHT-CONNID | Flight connection |
| `SELECT-OPTIONS s_fldate` | `s_fldate FOR sflight-fldate` | SFLIGHT-FLDATE | Flight date |

Selection texts: maintain as text symbols where feasible; deferred maintenance/translation is a recorded known limitation for this demo scope (see §7).

### 5.2 Data flow

1. `SELECT * FROM sflight INTO TABLE lt_sflight WHERE carrid IN s_carrid AND connid IN s_connid AND fldate IN s_fldate ORDER BY PRIMARY KEY.` (classic style; typed internal table of `sflight`.)
2. Empty check: `IF lines( lt_sflight ) = 0` → informational message, exit (AC-04).
3. `cl_salv_table=>factory( IMPORTING r_salv_table = lo_alv CHANGING t_table = lt_sflight )`.
4. `lo_alv->get_functions( )->set_all( ).` and `lo_alv->get_columns( )->set_optimize( ).`
5. `lo_alv->display( ).` — full-screen (no container).

### 5.3 Error and edge behavior

- Empty selection: `MESSAGE` with `TYPE 'I'`, program ends normally. Dumping via `MESSAGE ... TYPE 'E'` in `START-OF-SELECTION` must not be used (AC-04).
- Factory exceptions (`cx_salv_msg`): catch and route to an error message; must not be left uncaught.
- No `sy-subrc` branch is needed beyond the empty-table check when using `SELECT ... INTO TABLE` followed by the `lines( )` test.

## 6. Risk classification

**Low.** New local object in `$TMP`, no transport, no modification of an existing object (ZSFLIGHT_REPORT is explicitly protected), no DDL, read-only data access, no authorization-sensitive content beyond standard table read of demo data.

## 7. Accessibility (ADR-0065 — mandatory for user-facing output)

The output surface is a full-screen CL_SALV_TABLE ALV inside SAP GUI. It inherits the SAP GUI standard accessibility stack (keyboard navigation of the grid, screen-reader support via SAP GUI accessibility mode, ALV standard functions) without extra code. The selection screen uses standard SELECT-OPTIONS; selection texts and their translations are not maintained in `$TMP` demo scope — this is recorded as a **known limitation**, to be closed when the object is moved to a transportable package. No further accessibility work is in scope.

## 8. Preview Verification note (ADR-0070)

This deliverable is an ABAP GUI classic report, not a web, app, or document UI. ADR-0070 web/app preview verification is **explicitly exempted** for this object. Verification is instead performed by ATC run plus manual execution of the report in the SAP GUI (AC-01 through AC-04) and the test-runner QA report (AC-05).

## 9. Object change list

| # | Object | Type | Change | Package | Transport |
|---|--------|------|--------|---------|-----------|
| 1 | ZR_SFLIGHT_QUERY | PROG | create | $TMP | none (local) |

No other SAP objects are created, changed, or deleted. ZSFLIGHT_REPORT must not be touched.

## 10. Execution plan (Pattern B, serial)

| Step | Action | Tool | Owner | Exit condition |
|------|--------|------|-------|----------------|
| 0 | Design Gate: this design doc registered | `bun scripts/spec-register.ts` | architect | registry entry exists |
| 1 | Create PROG ZR_SFLIGHT_QUERY in $TMP with the interface of §5 | SAP MCP `SAP(action="create", target="PROG ZR_SFLIGHT_QUERY")` | code-writer | object exists, source matches §5 |
| 2 | Syntax check | SAP MCP `SAP(action="lint", target="PROG ZR_SFLIGHT_QUERY")` or activation check | code-writer | zero errors |
| 3 | Unit tests / ATC run on ZR_SFLIGHT_QUERY | SAP MCP `SAP(action="test")` / ATC | test-runner | ATC completed; QA report written |
| 4 | Memory log entry for the session | file write `memory/` | code-writer/test-runner via PM | log recorded |
| 5 | `/sync` pipeline for the repository artifacts | `sync` skill | PM | PR opened/merged per sync policy |

Note: no unit-test class is in scope for the report itself (display-only program, see §11 handoff to test-runner); step 3 is therefore the ATC run and QA report.

## 11. Handoffs

### 11.1 To code-writer (ABAP Developer)

- Create PROG **ZR_SFLIGHT_QUERY** in package **$TMP** (local, no transport request).
- Implement exactly the interface in §5: three SELECT-OPTIONS (s_carrid, s_connid, s_fldate), one SELECT with `WHERE ... IN` and `ORDER BY PRIMARY KEY`, CL_SALV_TABLE factory full-screen display with `SET_ALL( )` functions and `SET_OPTIMIZE( )`, informational message on empty result, catch `cx_salv_msg`.
- Classic Open SQL per D3; no inline declarations.
- Do not touch ZSFLIGHT_REPORT. Do not write repository files beyond the local `.abap` copy in `scratch/`.
- Deliver the implementation report per the code-writer output contract.

### 11.2 To test-runner (QA)

- Run ATC against ZR_SFLIGHT_QUERY after code-writer finishes and records a passed syntax check (AC-05).
- No unit tests in scope: the program is a display-only classic report with no testable business logic class and no test class in the deliverable; verification is ATC + manual execution evidence (grid shows data, toolbar present, columns optimized, empty-selection path shows the informational message without a dump).
- Record results in the QA report template and flag any ATC finding for architect review.

### 11.3 To DBA (SQL changes)

- **No new DDL is required.** No tables, views, indexes, or CDS entities are created or changed.
- Data access level 3 (direct Open SQL on DDIC table SFLIGHT) applies, with rationale D4: demo/training data model, no released VDM CDS view for SFLIGHT in this system, on-prem scope.
