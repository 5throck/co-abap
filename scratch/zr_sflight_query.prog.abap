*&---------------------------------------------------------------------*
*& Report ZR_SFLIGHT_QUERY
*&---------------------------------------------------------------------*
*& Query the SFLIGHT demo table and show the result rows in a
*& full-screen ALV built with CL_SALV_TABLE.
*& Pattern B (new object), classic Open SQL, no inline declarations.
*&---------------------------------------------------------------------*
REPORT zr_sflight_query.

TABLES: sflight.

*&---------------------------------------------------------------------*
*& Global data
*&---------------------------------------------------------------------*
DATA: gt_sflight TYPE STANDARD TABLE OF sflight WITH DEFAULT KEY,
      go_alv     TYPE REF TO cl_salv_table,
      gx_salv    TYPE REF TO cx_salv_msg,
      gv_error   TYPE string.

*&---------------------------------------------------------------------*
*& Selection screen
*&---------------------------------------------------------------------*
SELECT-OPTIONS: s_carrid FOR sflight-carrid,
                s_connid FOR sflight-connid,
                s_fldate FOR sflight-fldate.

*&---------------------------------------------------------------------*
*& Main processing
*&---------------------------------------------------------------------*
START-OF-SELECTION.

* Classic Open SQL; ordered by primary key (MANDT, CARRID, CONNID, FLDATE).
  SELECT * FROM sflight
           INTO TABLE gt_sflight
           WHERE carrid IN s_carrid
             AND connid IN s_connid
             AND fldate IN s_fldate
           ORDER BY PRIMARY KEY.

  IF sy-subrc <> 0.
*   No rows matched the selection: inform and end normally (no dump).
    MESSAGE 'No flights found for the given selection.' TYPE 'I' DISPLAY LIKE 'S'.
    RETURN.
  ENDIF.

END-OF-SELECTION.

  TRY.
      cl_salv_table=>factory(
        IMPORTING
          r_salv_table = go_alv
        CHANGING
          t_table      = gt_sflight ).

*   Standard ALV functions (sort, filter, export, ...) and column widths.
      go_alv->get_functions( )->set_all( abap_true ).
      go_alv->get_columns( )->set_optimize( abap_true ).

      go_alv->display( ).

    CATCH cx_salv_msg INTO gx_salv.
*   Route the ALV error to a status message; never dump.
      gv_error = gx_salv->get_text( ).
      MESSAGE gv_error TYPE 'S' DISPLAY LIKE 'E'.
  ENDTRY.
