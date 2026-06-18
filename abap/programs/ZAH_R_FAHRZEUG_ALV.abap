*&---------------------------------------------------------------------*
*& Report: ZAH_R_FAHRZEUG_ALV
*& Fahrzeugverwaltung mit ALV-Grid
*& Transaktion: ZAH_FAHR (in SE93 anlegen)
*&---------------------------------------------------------------------*
REPORT zah_r_fahrzeug_alv.

TABLES: zah_fahrzeug.

SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE TEXT-001.
  SELECT-OPTIONS: s_status FOR zah_fahrzeug-status DEFAULT 'BESTAND',
                  s_marke  FOR zah_fahrzeug-marke_id.
  PARAMETERS: p_modell TYPE zah_fahrzeug-modell.
SELECTION-SCREEN END OF BLOCK b1.

CLASS lcl_main DEFINITION CREATE PRIVATE.
  PUBLIC SECTION.
    METHODS run.
  PRIVATE SECTION.
    DATA: mo_alv TYPE REF TO cl_salv_table,
          mt_data TYPE STANDARD TABLE OF zah_fahrzeug.

    METHODS load_data.
    METHODS display_alv.
    METHODS on_user_command FOR EVENT added_function OF cl_salv_events_table
      IMPORTING e_salv_function.
ENDCLASS.

START-OF-SELECTION.
  DATA(lo_main) = NEW lcl_main( ).
  lo_main->run( ).

CLASS lcl_main IMPLEMENTATION.

  METHOD run.
    load_data( ).
    IF mt_data IS INITIAL.
      MESSAGE 'Keine Fahrzeuge gefunden' TYPE 'S' DISPLAY LIKE 'W'.
      RETURN.
    ENDIF.
    display_alv( ).
  ENDMETHOD.

  METHOD load_data.
    SELECT f~*, m~bezeichnung AS marke
      FROM zah_fahrzeug AS f
      LEFT JOIN zah_marke AS m ON f~marke_id = m~marke_id
      INTO CORRESPONDING FIELDS OF TABLE @mt_data
      WHERE f~status IN @s_status
        AND f~marke_id IN @s_marke
        AND ( @p_modell IS INITIAL OR f~modell LIKE @p_modell )
      ORDER BY f~marke_id, f~modell.
  ENDMETHOD.

  METHOD display_alv.
    TRY.
        cl_salv_table=>factory(
          IMPORTING r_salv_table = mo_alv
          CHANGING  t_table      = mt_data ).

        DATA(lo_functions) = mo_alv->get_functions( ).
        lo_functions->set_all( abap_true ).

        DATA(lo_columns) = mo_alv->get_columns( ).
        lo_columns->set_optimize( abap_true ).

        DATA(lo_events) = mo_alv->get_event( ).
        SET HANDLER on_user_command FOR lo_events.

        mo_alv->set_screen_status(
          pfstatus = 'ZAH_FAHR_STATUS'
          report   = sy-repid ).

        mo_alv->display( ).
      CATCH cx_salv_msg INTO DATA(lx_error).
        MESSAGE lx_error->get_text( ) TYPE 'E'.
    ENDTRY.
  ENDMETHOD.

  METHOD on_user_command.
    CASE e_salv_function.
      WHEN 'RESERVIEREN'.
        " Ausgewähltes Fahrzeug reservieren
        MESSAGE 'Fahrzeug reserviert' TYPE 'S'.
      WHEN 'DETAIL'.
        MESSAGE 'Fahrzeugdetails' TYPE 'I'.
    ENDCASE.
  ENDMETHOD.

ENDCLASS.

* Textelemente:
* TEXT-001: Selektionskriterien
