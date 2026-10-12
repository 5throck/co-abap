# ZFLIGHT User Manual

Flight report that queries the standard flight table `SFLIGHT` and shows the result in an ALV grid.

- **Program**: `ZFLIGHT` (report) · **Package**: `$TMP` (local object on the development system)
- **System**: NPL, client 001 · **Reads**: `SFLIGHT` only (no data is changed)
- **Requirement folder**: [REQ-002-zflight-report](../index.md) · Technical design: [02_technical_design.md](02_technical_design.md)
- **Korean version**: [07_user_manual_ko.md](07_user_manual_ko.md)

## 1. Running the report

1. Log on to the development system (client 001).
2. Enter transaction `SE38` (ABAP Editor) or `SA38` (ABAP Report Execution).
3. Type the program name `ZFLIGHT` and choose **Execute** (F8).

The selection screen appears before the list.

## 2. Selection screen

| Field | Meaning | Default | Examples |
|---|---|---|---|
| Airline (`S_CARR`) | Airline code range | `LH` (inclusive, single value) | `AA` for American Airlines; multiple values via the range editor (arrow button) |
| Flight connection (`S_CONN`) | Flight number range | empty (= all) | `0400` to `0402` for Frankfurt–New York Lufthansa connections |
| Flight date (`S_DATE`) | Flight date range | empty (= all) | `01.01.2017` to `31.12.2019` |
| Maximum rows (`P_MAX`) | Upper limit for the result set | 200 | lower it for quick checks |

Notes:

- Leave a field empty to ignore that condition (the airline default `LH` must be removed manually for an all-airlines run).
- Demo flight dates are between 2017 and 2019 — queries outside this window return nothing.
- Airline codes are uppercase (`LH`, not `lh`).

## 3. Result list (ALV grid)

One row per flight (airline + connection + date). Columns:

| Column | Description |
|---|---|
| Airline | Carrier code (e.g. `LH` = Lufthansa) |
| Flight Connection | Flight connection number |
| Flight Date | Flight date |
| Airfare | Price per booking in the airline currency |
| Currency | Currency key of the airfare |
| Plane Type | Aircraft type (e.g. `747-400`) |
| Max. Capacity / Occupied | Economy seats, maximum and occupied |
| Max./Occupied (bus.) | Business class seats |
| Max./Occupied (1st) | First class seats |
| Total | Sum of booked amounts (`PAYMENTSUM`) |

The ALV toolbar provides sorting, filtering, column layout changes and export (e.g. to spreadsheet). Amount columns follow the currency of each row.

## 4. Messages

| Message | Meaning | What to do |
|---|---|---|
| `No flights found for the given selection.` | The selection returned no rows | Widen the ranges, check that the airline code is uppercase, or remove the default `LH` |

## 5. Technical facts

- The report reads at most `P_MAX` rows per run, ordered by airline, connection, then date.
- The program only reads data; it never inserts, updates or deletes.
- Because it lives in `$TMP`, it exists only on this system and is lost if the client is re-generated or cleaned. A transportable copy must be created in a Z* package (see SRS open questions).
