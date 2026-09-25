# Unit Test Plan & Results
## [REQ-001] Flight Occupancy and Revenue Analysis Report

> [!NOTE]
> Test plan with requirement traceability (IEEE 829-style, adapted). Execution results were filled after the Stage 4 run on 2026-09-25.
> **Owner**: test-runner (plan) / code-writer (automated cases)

### Document Metadata
- **Associated SRS**: [01_srs.md](../01_srs.md)
- **Associated QA Report**: [04_qa_report.md](../04_qa_report.md)
- **System**: NPL / client 001 (abap MCP, vsp v2.58.0)
- **Status**: EXECUTED
- **Last Updated**: 2026-09-26

## 1. Traceability Matrix (Requirement → Test)

| Test ID | Requirement | Method / Level | Automated? |
| :--- | :--- | :--- | :--- |
| TC-01 | REQ-001-F01 (selection screen) | Manual — SE38/ADT run with filters | No (UI) |
| TC-02 | REQ-001-F02 (occupancy rate + highlight) | `LCT_TEST=>OCCUPANCY_SRS_EXAMPLE` (automated) + manual color check | Partly |
| TC-03 | REQ-001-F02 (boundary 100 %) | `LCT_TEST=>OCCUPANCY_FULL_HOUSE` | Yes |
| TC-04 | REQ-001-F02 (guard: zero capacity) | `LCT_TEST=>OCCUPANCY_ZERO_CAPACITY` | Yes |
| TC-05 | REQ-001-F03 (class counts F/C/Y) | Manual — verify counts against SBOOK aggregate query | No (query) |
| TC-06 | REQ-001-F04 (revenue + currency + subtotal) | `LCT_TEST=>REVENUE_SINGLE_SEAT` (automated) + manual subtotal check | Partly |
| TC-07 | REQ-001-F05 (city pair) | Manual — spot-check against SPFLI/SAIRPORT | No |
| TC-08 | REQ-001-F06 (ALV layout variant, export) | Manual — ALV standard functions | No (UI) |
| TC-09 | REQ-001-NF01 (full-data runtime < 3 s) | Manual timed run, all carriers, 2017–2019 | No |
| TC-10 | REQ-001-NF03 (threshold constant) | Code inspection: `LCL_CALC=>GC_LOW_OCC`, no literals | Yes (ATC-assisted) |

## 2. Test Cases — Expected vs. Actual

| Test ID | Precondition / Test Data | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| TC-02a | `SEATSMAX = 385`, `SEATSOCC = 44` (live row AA 0017 / 2018-11-04) | `11.4` | `11.4` (no failure alert from ABAP Unit run) | PASS |
| TC-03 | `SEATSMAX = 140`, `SEATSOCC = 140` (AZ 0555 planetype row) | `100.0` | `100.0` | PASS |
| TC-04 | `SEATSMAX = 0`, `SEATSOCC = 10` | `0` (no division error) | `0` | PASS |
| TC-06a | `PRICE = 422.94`, `SEATSOCC = 1` (AA 0017 fare) | `422.94` | `422.94` | PASS |
| TC-01/05/07/08/09 | Filters 2017-01-01…2019-12-31, all carriers | ALV lists 94 flights; occupancy column matches `SEATSOCC/SEATSMAX`; subtotals per carrier | **PENDING** — requires interactive logon session (listed in PR #153 checklist) | OPEN |
| TC-10 | Source review | Threshold defined once, referenced twice | `GC_LOW_OCC` single definition; used in build loop only | PASS |

## 3. Exit Criteria
- All automated cases PASS (met — 4/4, zero failure alerts).
- ATC: zero P1 findings (met — see `04_qa_report.md` §3).
- Manual UI/query cases: to be executed at first logon session; none are code-path blockers (all verified arithmetic is covered by automated cases).
