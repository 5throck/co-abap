REPORT zflight.

TABLES sflight.

SELECT-OPTIONS: s_carr FOR sflight-carrid,
                s_conn FOR sflight-connid,
                s_date FOR sflight-fldate.

PARAMETERS p_max TYPE i DEFAULT 200.

INITIALIZATION.
  s_carr-sign   = 'I'.
  s_carr-option = 'EQ'.
  s_carr-low    = 'LH'.
  APPEND s_carr.

START-OF-SELECTION.
  SELECT carrid, connid, fldate, price, currency, planetype,
         seatsmax, seatsocc, seatsmax_b, seatsocc_b,
         seatsmax_f, seatsocc_f, paymentsum
    FROM sflight
    WHERE carrid IN @s_carr
      AND connid IN @s_conn
      AND fldate IN @s_date
    ORDER BY carrid, connid, fldate
    INTO TABLE @DATA(lt_flights)
    UP TO @p_max ROWS.

  IF sy-subrc <> 0.
    WRITE / |No flights found for the given selection.|.
    RETURN.
  ENDIF.

  cl_salv_table=>factory(
    IMPORTING
      r_salv_table = DATA(lo_alv)
    CHANGING
      t_table      = lt_flights ).

  lo_alv->get_functions( )->set_all( abap_true ).
  lo_alv->get_columns( )->set_optimize( abap_true ).

  TRY.
      lo_alv->get_columns( )->get_column( 'PRICE'      )->set_currency_column( 'CURRENCY' ).
      lo_alv->get_columns( )->get_column( 'PAYMENTSUM' )->set_currency_column( 'CURRENCY' ).
    CATCH cx_salv_not_found ##NO_HANDLER.
  ENDTRY.

  lo_alv->display( ).
