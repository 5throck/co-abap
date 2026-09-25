REPORT zflight_occ_revenue.

TABLES: sflight, sbook.

SELECT-OPTIONS: s_carrid FOR sflight-carrid,
                s_connid FOR sflight-connid,
                s_fldate FOR sflight-fldate OBLIGATORY,
                s_class  FOR sbook-class.

CLASS lcl_calc DEFINITION FINAL.
  PUBLIC SECTION.
    TYPES ty_percent TYPE p LENGTH 4 DECIMALS 1.
    CONSTANTS gc_low_occ TYPE ty_percent VALUE '70.0'.
    CLASS-METHODS occupancy_rate
      IMPORTING iv_seatsmax       TYPE i
                iv_seatsocc       TYPE i
      RETURNING VALUE(rv_percent) TYPE ty_percent.
    CLASS-METHODS revenue
      IMPORTING iv_price          TYPE sflight-price
                iv_seatsocc       TYPE i
      RETURNING VALUE(rv_revenue) TYPE sflight-price.
ENDCLASS.

CLASS lcl_calc IMPLEMENTATION.
  METHOD occupancy_rate.
    IF iv_seatsmax > 0.
      rv_percent = iv_seatsocc * CONV f( 100 ) / iv_seatsmax.
    ENDIF.
  ENDMETHOD.

  METHOD revenue.
    rv_revenue = iv_price * iv_seatsocc.
  ENDMETHOD.
ENDCLASS.

CLASS lct_test DEFINITION FINAL FOR TESTING
  RISK LEVEL HARMLESS DURATION SHORT.
  PRIVATE SECTION.
    DATA mv_exp TYPE lcl_calc=>ty_percent.
    METHODS occupancy_srs_example FOR TESTING.
    METHODS occupancy_full_house FOR TESTING.
    METHODS occupancy_zero_capacity FOR TESTING.
    METHODS revenue_single_seat FOR TESTING.
ENDCLASS.

CLASS lct_test IMPLEMENTATION.
  METHOD occupancy_srs_example.
    mv_exp = '11.4'.
    cl_abap_unit_assert=>assert_equals(
      exp = mv_exp
      act = lcl_calc=>occupancy_rate( iv_seatsmax = 385
                                      iv_seatsocc = 44 ) ).
  ENDMETHOD.

  METHOD occupancy_full_house.
    mv_exp = '100.0'.
    cl_abap_unit_assert=>assert_equals(
      exp = mv_exp
      act = lcl_calc=>occupancy_rate( iv_seatsmax = 140
                                      iv_seatsocc = 140 ) ).
  ENDMETHOD.

  METHOD occupancy_zero_capacity.
    CLEAR mv_exp.
    cl_abap_unit_assert=>assert_equals(
      exp = mv_exp
      act = lcl_calc=>occupancy_rate( iv_seatsmax = 0
                                      iv_seatsocc = 10 ) ).
  ENDMETHOD.

  METHOD revenue_single_seat.
    DATA lv_act TYPE sflight-price.
    lv_act = lcl_calc=>revenue( iv_price    = '422.94'
                                iv_seatsocc = 1 ).
    cl_abap_unit_assert=>assert_equals( exp = '422.94' act = lv_act ).
  ENDMETHOD.
ENDCLASS.

CLASS lcl_report DEFINITION FINAL.
  PUBLIC SECTION.
    METHODS run.
  PRIVATE SECTION.
    TYPES: BEGIN OF gty_out,
             carrid    TYPE sflight-carrid,
             carrname  TYPE scarr-carrname,
             connid    TYPE sflight-connid,
             fldate    TYPE sflight-fldate,
             cityfrom  TYPE spfli-cityfrom,
             cityto    TYPE spfli-cityto,
             planetype TYPE sflight-planetype,
             seatsmax  TYPE i,
             seatsocc  TYPE i,
             occupancy TYPE p LENGTH 4 DECIMALS 1,
             cnt_f     TYPE i,
             cnt_c     TYPE i,
             cnt_y     TYPE i,
             price     TYPE sflight-price,
             currency  TYPE sflight-currency,
             revenue   TYPE sflight-price,
             row_color TYPE lvc_t_scol,
           END OF gty_out,
           gty_out_t TYPE STANDARD TABLE OF gty_out WITH DEFAULT KEY.
    METHODS build
      RETURNING VALUE(rt_out) TYPE gty_out_t.
    METHODS display
      IMPORTING it_out TYPE gty_out_t.
ENDCLASS.

CLASS lcl_report IMPLEMENTATION.
  METHOD run.
    display( build( ) ).
  ENDMETHOD.

  METHOD build.
    SELECT f~carrid, c~carrname, f~connid, f~fldate,
           p~cityfrom, p~cityto, f~planetype,
           f~seatsmax, f~seatsocc, f~price, f~currency
      FROM sflight AS f
      INNER JOIN spfli AS p
        ON p~carrid = f~carrid
       AND p~connid = f~connid
      INNER JOIN scarr AS c
        ON c~carrid = f~carrid
      WHERE f~carrid IN @s_carrid
        AND f~connid IN @s_connid
        AND f~fldate IN @s_fldate
      ORDER BY f~carrid, f~connid, f~fldate
      INTO CORRESPONDING FIELDS OF TABLE @rt_out.

    IF rt_out IS INITIAL.
      RETURN.
    ENDIF.

    SELECT carrid, connid, fldate, class, COUNT( * ) AS cnt
      FROM sbook
      WHERE carrid IN @s_carrid
        AND connid IN @s_connid
        AND fldate IN @s_fldate
        AND class   IN @s_class
      GROUP BY carrid, connid, fldate, class
      INTO TABLE @DATA(lt_counts).

    SORT lt_counts BY carrid connid fldate class.

    LOOP AT rt_out ASSIGNING FIELD-SYMBOL(<ls_out>).
      <ls_out>-occupancy = lcl_calc=>occupancy_rate(
                             iv_seatsmax = <ls_out>-seatsmax
                             iv_seatsocc = <ls_out>-seatsocc ).
      <ls_out>-revenue   = lcl_calc=>revenue(
                             iv_price    = <ls_out>-price
                             iv_seatsocc = <ls_out>-seatsocc ).
      LOOP AT lt_counts INTO DATA(ls_count)
           WHERE carrid = <ls_out>-carrid
             AND connid = <ls_out>-connid
             AND fldate = <ls_out>-fldate.
        CASE ls_count-class.
          WHEN 'F'. <ls_out>-cnt_f = ls_count-cnt.
          WHEN 'C'. <ls_out>-cnt_c = ls_count-cnt.
          WHEN 'Y'. <ls_out>-cnt_y = ls_count-cnt.
        ENDCASE.
      ENDLOOP.
      IF <ls_out>-occupancy < lcl_calc=>gc_low_occ.
        APPEND VALUE lvc_s_scol( color-col = '6'
                                 color-int = '1' )
               TO <ls_out>-row_color.
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

  METHOD display.
    DATA(lt_table) = it_out.
    TRY.
        cl_salv_table=>factory( IMPORTING r_salv_table = DATA(lo_alv)
                                CHANGING  t_table      = lt_table ).
        DATA(lo_cols) = lo_alv->get_columns( ).
        lo_cols->set_optimize( abap_true ).
        lo_cols->set_color_column( 'ROW_COLOR' ).
        DATA(lo_col_rev) = CAST cl_salv_column_table(
                                 lo_cols->get_column( 'REVENUE' ) ).
        lo_col_rev->set_currency_column( 'CURRENCY' ).
        lo_alv->get_sorts( )->add_sort( columnname = 'CARRID'
                                        subtotal   = abap_true ).
        lo_alv->get_aggregations( )->add_aggregation(
          columnname = 'REVENUE' ).
        lo_alv->get_functions( )->set_all( abap_true ).
        lo_alv->get_layout( )->set_key(
          VALUE salv_s_layout_key( report = sy-repid ) ).
        lo_alv->get_layout( )->set_save_restriction(
          cl_salv_layout=>restrict_none ).
        lo_alv->display( ).
      CATCH cx_salv_msg cx_salv_not_found cx_salv_data_error
            cx_salv_existing INTO DATA(lo_err).
        DATA(lv_text) = lo_err->get_text( ).
        MESSAGE lv_text TYPE 'I' DISPLAY LIKE 'E'.
    ENDTRY.
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  NEW lcl_report( )->run( ).
