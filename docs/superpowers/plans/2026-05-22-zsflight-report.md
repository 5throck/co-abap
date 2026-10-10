# ZSFLIGHT_REPORT Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the ABAP report program `ZSFLIGHT_REPORT`, which filters the SFLIGHT table by Selection Screen conditions (airline, flight number, departure date) and displays the result in an ALV Grid.

**Architecture:** A single REPORT program. Execution order: Selection Screen → SELECT → empty-result guard → CL_SALV_TABLE factory/display. TRY/CATCH wraps both factory and display.

**Tech Stack:** ABAP (Classic Report), CL_SALV_TABLE OO API, SAP NetWeaver AS ABAP (vhcalnplci:50000), vsp MCP (WriteSource / SyntaxCheck / Activate)

**Spec:** `docs/superpowers/specs/2026-05-22-zsflight-report-design.md`

---

### Task 1: Write and Save the Program Source

**Object:**
- Create: ABAP Program `ZSFLIGHT_REPORT` (package `$TMP`)

- [ ] **Step 1: Write the program source with WriteSource**

Call `mcp__abap__WriteSource`:
- object_type: `PROG`
- object_name: `ZSFLIGHT_REPORT`
- package: `$TMP`

Source content:

```abap
REPORT zsflight_report.

*----------------------------------------------------------------------*
* Types
*----------------------------------------------------------------------*
TYPES: BEGIN OF ty_sflight,
         carrid     TYPE sflight-carrid,
         connid     TYPE sflight-connid,
         fldate     TYPE sflight-fldate,
         planetype  TYPE sflight-planetype,
         price      TYPE sflight-price,
         currency   TYPE sflight-currency,
         seatsmax   TYPE sflight-seatsmax,
         seatsocc   TYPE sflight-seatsocc,
         paymentsum TYPE sflight-paymentsum,
       END OF ty_sflight.

*----------------------------------------------------------------------*
* Data
*----------------------------------------------------------------------*
DATA: gt_sflight TYPE TABLE OF ty_sflight,
      go_alv     TYPE REF TO cl_salv_table,
      lo_cols    TYPE REF TO cl_salv_columns_table,
      lx_msg     TYPE REF TO cx_salv_msg.

*----------------------------------------------------------------------*
* Selection Screen
*----------------------------------------------------------------------*
SELECT-OPTIONS: so_carr FOR sflight-carrid,
                so_conn FOR sflight-connid,
                so_date FOR sflight-fldate.

*----------------------------------------------------------------------*
* Main
*----------------------------------------------------------------------*
START-OF-SELECTION.

  SELECT carrid connid fldate planetype price currency
         seatsmax seatsocc paymentsum
    FROM sflight
    INTO TABLE gt_sflight
    WHERE carrid IN so_carr
      AND connid IN so_conn
      AND fldate IN so_date.

  IF gt_sflight IS INITIAL.
    MESSAGE i001(00) WITH 'No data found.'.
    RETURN.
  ENDIF.

  TRY.
      cl_salv_table=>factory(
        IMPORTING r_salv_table = go_alv
        CHANGING  t_table      = gt_sflight ).

      " Column header settings
      lo_cols = go_alv->get_columns( ).
      lo_cols->get_column( 'CARRID'     )->set_short_text( 'Airline'    ).
      lo_cols->get_column( 'CONNID'     )->set_short_text( 'Flight No.' ).
      lo_cols->get_column( 'FLDATE'     )->set_short_text( 'Dep. date'  ).
      lo_cols->get_column( 'PLANETYPE'  )->set_short_text( 'Plane type').
      lo_cols->get_column( 'PRICE'      )->set_short_text( 'Fare'       ).
      lo_cols->get_column( 'CURRENCY'   )->set_short_text( 'Currency'   ).
      lo_cols->get_column( 'SEATSMAX'   )->set_short_text( 'Max seats'  ).
      lo_cols->get_column( 'SEATSOCC'   )->set_short_text( 'Booked seats').
      lo_cols->get_column( 'PAYMENTSUM' )->set_short_text( 'Revenue'    ).

      go_alv->display( ).

    CATCH cx_salv_msg INTO lx_msg.
      MESSAGE lx_msg->get_text( ) TYPE 'E'.
  ENDTRY.
```

- [ ] **Step 2: Run SyntaxCheck**

Call `mcp__abap__SyntaxCheck`:
- object_type: `PROG`
- object_name: `ZSFLIGHT_REPORT`

Expected result: 0 errors. If there are warnings, review them and decide whether they can be ignored.

- [ ] **Step 3: Run Activate**

Call `mcp__abap__Activate`:
- object_type: `PROG`
- object_name: `ZSFLIGHT_REPORT`

Expected result: activation succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add ZSFLIGHT_REPORT ALV report program

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Functional Verification

- [ ] **Step 1: Full retrieval test**

Call `mcp__abap__RunReport`:
- program_name: `ZSFLIGHT_REPORT`
- No parameters (full retrieval)

Expected result: all SFLIGHT data is returned (50 or more rows).

- [ ] **Step 2: Airline filter test**

Call `mcp__abap__RunReport`:
- SO_CARR: `LH`

Expected result: only rows with CARRID = 'LH' are returned.

- [ ] **Step 3: Date range filter test**

Call `mcp__abap__RunReport`:
- SO_DATE: `20180101` to `20181231`

Expected result: only flights departing in 2018 are returned.

- [ ] **Step 4: Empty result test**

Call `mcp__abap__RunReport`:
- SO_CARR: `XX` (non-existent airline)

Expected result: the message `'No data found.'` is output, with no errors.

- [ ] **Step 5: Run ATCCheck**

Call `mcp__abap__RunATCCheck`:
- object_type: `PROG`
- object_name: `ZSFLIGHT_REPORT`

Expected result: 0 Critical/Error findings. (Warnings of Priority 2 or lower are allowed.)

---

## Completion Criteria

- [ ] SyntaxCheck: 0 errors
- [ ] Activate succeeds
- [ ] Data is displayed on full retrieval
- [ ] Condition filters work correctly
- [ ] Empty-result message is output correctly
- [ ] ATCCheck: 0 Critical findings
