# SRS — ZFLIGHT report

- **Req ID**: REQ-002
- **Module**: CROSS
- **Owner**: pm
- **Status**: Draft

## 1. Background & Problem Statement

The team needs a read-only query program over the standard flight table `SFLIGHT` on the
development system (NPL, client 001). `SFLIGHT` is the canonical SAP demo data model (94 flight
rows, 27,147 bookings, 18 airlines) and serves as the default dataset for ABAP development and
harness verification. A ready-to-run report removes the need to hand-write queries for every
check and doubles as a working demonstration of the SAP MCP proxy approval flow (R2 create
gated, human-approved, 2026-10-12).

## 2. Scope

**In scope**

- Report program `ZFLIGHT` in package `$TMP` (local object, no transport)
- Selection screen: airline / connection / flight date ranges plus a result row cap
- Ordered read of `SFLIGHT` and ALV grid output with standard toolbar functions

**Explicitly out of scope**

- Authorization checks (`AUTHORITY-CHECK`) — see open questions
- Transportable packaging (Z* package) and any target-system rollout
- CDS view / RAP service layer, booking-level (`SBOOK`) drilldown, totals/subtotals
- Any write access to SAP data (the report reads only)

## 3. Functional Requirements

| ID | Requirement |
|---|---|
| FR-1 | Selection screen offers ranges for airline (`CARRID`), connection (`CONNID`) and flight date (`FLDATE`). |
| FR-2 | A numeric parameter limits the returned row count; default 200. |
| FR-3 | The airline range defaults to `LH` (inclusive, single value) so the first run shows data. |
| FR-4 | Rows are selected in ascending order of airline, connection, then flight date. |
| FR-5 | Results display in a SALV ALV grid with full toolbar functions (sort, filter, layout, export). |
| FR-6 | Amount columns (`PRICE`, `PAYMENTSUM`) carry the `CURRENCY` column as ALV currency reference. |
| FR-7 | An empty result set produces a clear informational message instead of an empty screen. |
| FR-8 | The program never inserts, updates or deletes data. |

## 4. Acceptance Criteria

- Given the default selection (LH, cap 200), when the report runs in SE38/SA38, then Lufthansa
  flights appear in the ALV ordered by connection and date.
- Given an airline code with no flights (or dates outside 2017–2019), when the report runs,
  then the message `No flights found for the given selection.` is shown.
- Given a cleared airline range, when the report runs, then all airlines' flights up to the cap
  are listed.
- Given any run, when the result list is shown, then airfare and total columns display per-row
  currency scaling.

## 5. Impact Notes (per module)

- **CROSS**: no standard objects modified; one new local report (`$TMP`). No cross-module data
  is touched — `SFLIGHT` is a demo data model, not an application table.

## 6. Open Questions

| # | Question | Blocks Stage 1? |
|---|---|---|
| 1 | Should the report be promoted to a transportable Z* package (and with which transport layer)? | No — demo use in `$TMP` agreed for now |
| 2 | Add an `AUTHORITY-CHECK` before any wider rollout? | No — acceptable as developer-system demo |

---

Stage 1 exit requires PM approval and Technical Lead sign-off before Stage 2 begins
(see `docs/phase-definitions.md`).
