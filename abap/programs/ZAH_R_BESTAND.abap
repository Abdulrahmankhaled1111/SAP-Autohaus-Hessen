*&---------------------------------------------------------------------*
*& Report: ZAH_R_BESTAND
*& Bestandsübersicht – alle Fahrzeuge im Autohaus
*& Transaktion: ZAH_BEST (in SE93 anlegen)
*&---------------------------------------------------------------------*
REPORT zah_r_bestand.

SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE TEXT-001.
  PARAMETERS: p_all   RADIOBUTTON GROUP st DEFAULT 'X',
              p_best  RADIOBUTTON GROUP st,
              p_resv  RADIOBUTTON GROUP st,
              p_ws    RADIOBUTTON GROUP st.
SELECTION-SCREEN END OF BLOCK b1.

CLASS lcl_bestand DEFINITION CREATE PRIVATE.
  PUBLIC SECTION.
    METHODS run.
  PRIVATE SECTION.
    TYPES: BEGIN OF ty_bestand,
             fahrzeug_id   TYPE zah_fahrzeug-fahrzeug_id,
             fin           TYPE zah_fahrzeug-fin,
             marke         TYPE zah_marke-bezeichnung,
             modell        TYPE zah_fahrzeug-modell,
             baujahr       TYPE zah_fahrzeug-baujahr,
             farbe         TYPE zah_fahrzeug-farbe,
             km_stand      TYPE zah_fahrzeug-km_stand,
             einkaufspreis TYPE zah_fahrzeug-einkaufspreis,
             verkaufspreis TYPE zah_fahrzeug-verkaufspreis,
             status        TYPE zah_fahrzeug-status,
             eingangsdatum TYPE zah_fahrzeug-eingangsdatum,
             tage_bestand  TYPE i,
           END OF ty_bestand.

    DATA: mt_bestand TYPE STANDARD TABLE OF ty_bestand.

    METHODS load_data.
    METHODS display_alv.
    METHODS get_status_filter RETURNING VALUE(rv_status) TYPE zah_fahrzeug-status.
ENDCLASS.

START-OF-SELECTION.
  NEW lcl_bestand( )->run( ).

CLASS lcl_bestand IMPLEMENTATION.

  METHOD get_status_filter.
    CASE 'X'.
      WHEN p_best. rv_status = 'BESTAND'.
      WHEN p_resv. rv_status = 'RESV'.
      WHEN p_ws.   rv_status = 'WS'.
      WHEN OTHERS. CLEAR rv_status.
    ENDCASE.
  ENDMETHOD.

  METHOD run.
    load_data( ).
    display_alv( ).
  ENDMETHOD.

  METHOD load_data.
    SELECT f~fahrzeug_id, f~fin, m~bezeichnung AS marke,
           f~modell, f~baujahr, f~farbe, f~km_stand,
           f~einkaufspreis, f~verkaufspreis, f~status,
           f~eingangsdatum
      FROM zah_fahrzeug AS f
      LEFT JOIN zah_marke AS m ON f~marke_id = m~marke_id
      INTO CORRESPONDING FIELDS OF TABLE @mt_bestand
      WHERE ( @p_all = 'X' OR f~status = @get_status_filter( ) )
        AND f~status NOT IN ('AUSG', 'VKFT')
      ORDER BY f~status, m~bezeichnung, f~modell.

    LOOP AT mt_bestand ASSIGNING FIELD-SYMBOL(<fs>).
      <fs>-tage_bestand = sy-datum - <fs>-eingangsdatum.
    ENDLOOP.
  ENDMETHOD.

  METHOD display_alv.
    DATA: lo_alv     TYPE REF TO cl_salv_table,
          lo_agg     TYPE REF TO cl_salv_aggregations,
          lv_bestand TYPE i,
          lv_wert    TYPE p DECIMALS 2.

    DESCRIBE TABLE mt_bestand LINES lv_bestand.
    LOOP AT mt_bestand INTO DATA(ls) WHERE status = 'BESTAND'.
      lv_wert = lv_wert + ls-einkaufspreis.
    ENDLOOP.

    WRITE: / 'Autohaus HESSEN – Bestandsübersicht'.
    WRITE: / 'Fahrzeuge gesamt:', lv_bestand.
    WRITE: / 'Bestandswert (Einkauf):', lv_wert CURRENCY 'EUR'.
    SKIP 1.

    TRY.
        cl_salv_table=>factory(
          IMPORTING r_salv_table = lo_alv
          CHANGING  t_table      = mt_bestand ).
        lo_alv->get_functions( )->set_all( abap_true ).
        lo_alv->get_columns( )->set_optimize( abap_true ).

        lo_agg = lo_alv->get_aggregations( ).
        lo_agg->add_aggregation( columnname = 'EINKAUFSPREIS' aggregation = if_salv_c_aggregation=>total ).
        lo_agg->add_aggregation( columnname = 'VERKAUFSPREIS' aggregation = if_salv_c_aggregation=>total ).

        lo_alv->display( ).
      CATCH cx_salv_msg INTO DATA(lx).
        MESSAGE lx->get_text( ) TYPE 'E'.
    ENDTRY.
  ENDMETHOD.

ENDCLASS.
