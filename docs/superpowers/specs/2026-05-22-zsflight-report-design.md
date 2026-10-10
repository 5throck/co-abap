# ZSFLIGHT_REPORT — Design Spec

**Date**: 2026-05-22  
**Status**: Approved  
**Author**: Mark Park (via Claude Code)

---

## Overview

A classic SAP ABAP report program that reads the `SFLIGHT` table and displays the result in an ALV Grid.  
It filters by airline, flight number, and flight date, and presents nine key columns through the `CL_SALV_TABLE` OO API.

---

## Program Info

| Item | Value |
|------|----|
| Program name | `ZSFLIGHT_REPORT` |
| Type | REPORT |
| Package | `$TMP` |
| Target table | `SFLIGHT` |

---

## Selection Screen

| Parameter | Type | Target field | Description |
|----------|------|-----------|------|
| `SO_CARR` | SELECT-OPTIONS | `SFLIGHT-CARRID` | Airline code |
| `SO_CONN` | SELECT-OPTIONS | `SFLIGHT-CONNID` | Flight number |
| `SO_DATE` | SELECT-OPTIONS | `SFLIGHT-FLDATE` | Departure date range |

---

## Data Flow

```
[Selection Screen input]
        ↓
[SELECT FROM SFLIGHT WHERE conditions applied]
        ↓
[Load Internal Table (ty_sflight)]
        ↓
[CL_SALV_TABLE->factory()]
        ↓
[Set column headers (get_columns)]
        ↓
[ALV->display()]
```

---

## Type Definition

```abap
TYPES: BEGIN OF ty_sflight,
         carrid    TYPE sflight-carrid,
         connid    TYPE sflight-connid,
         fldate    TYPE sflight-fldate,
         planetype TYPE sflight-planetype,
         price     TYPE sflight-price,
         currency  TYPE sflight-currency,
         seatsmax  TYPE sflight-seatsmax,
         seatsocc  TYPE sflight-seatsocc,
         paymentsum TYPE sflight-paymentsum,
       END OF ty_sflight.
```

---

## ALV Columns (9)

| Field | Column header |
|------|-----------|
| CARRID | Airline |
| CONNID | Flight No. |
| FLDATE | Departure date |
| PLANETYPE | Plane type |
| PRICE | Fare |
| CURRENCY | Currency |
| SEATSMAX | Max seats |
| SEATSOCC | Booked seats |
| PAYMENTSUM | Total revenue |

---

## Error Handling

1. **Empty result handling** — If the internal table is empty after the SELECT, immediately output `MESSAGE i001(00) WITH 'No data found.'` and then `RETURN`. This must happen before calling `CL_SALV_TABLE->factory()`.

2. **ALV exception handling** — The `TRY...CATCH cx_salv_msg` block must wrap both the `factory()` call and the `display()` call. Both methods can raise `cx_salv_msg`.

---

## Implementation Approach

- **Approach**: Classic REPORT (Approach A)
- **ALV API**: `CL_SALV_TABLE` (OO style, the modern ABAP standard)
- Selection Screen variables use `LIKE` reference types
- Data retrieval is handled by a single `SELECT` statement

---

## Out of Scope

- Transport request (local object $TMP)
- Total/subtotal rows
- Drill-down navigation
- Excel download customization (the standard ALV functionality is sufficient)
