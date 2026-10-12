# Unit Test Plan — ZFLIGHT report

- **Req ID**: REQ-002
- **Status**: Draft — filled during Stage 4 by `test-runner`

## 1. Test Objects

| Object | Type | Package | Test Class |
|--------|------|---------|------------|
| `ZFLIGHT` | PROG | `$TMP` | none — report without class-based tests; verified by manual acceptance runs |

## 2. Test Cases

Manual acceptance runs (SE38/SA38), mapped from [01_srs.md](01_srs.md) acceptance criteria:

| # | Scenario | Expected Result | Result |
|---|----------|-----------------|--------|
| T1 | Run with default selection (airline `LH`, cap 200) | Lufthansa flights listed in ALV, ordered by connection then date | Pending — first user run |
| T2 | Run with an airline code that has no flights (or dates outside 2017–2019) | Message `No flights found for the given selection.` | Pending |
| T3 | Clear the airline range and run | Flights of all airlines up to the cap | Pending |
| T4 | Check `Airfare` / `Total` columns in the result | Amounts scaled per row currency (`CURRENCY` reference) | Pending |

## 3. Mandatory QA Chain Results

Run in order; each step must pass before the next (gates DG-ABAP-01 / DG-ABAP-02).

- [x] `SyntaxCheck` — no errors after the final write (create-with-activation, 0 messages)
- [ ] `RunUnitTests` — all tests passing — N/A (no test include)
- [ ] `GetCodeCoverage` — >= 70% coverage on all new objects — N/A (no test include)
- [ ] `RunATCCheck` — zero Priority 1 findings — **not yet executed**

[QUALITY GATE STATUS: PENDING]

<!-- Mark [QUALITY GATE STATUS: PASSED] only after all four steps pass. -->
