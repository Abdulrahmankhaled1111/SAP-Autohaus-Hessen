*&---------------------------------------------------------------------*
*& Report: ZAH_R_UMSATZ
*& Umsatzbericht – Verkäufe pro Monat / Verkäufer
*& Transaktion: ZAH_UMS (in SE93 anlegen)
*&---------------------------------------------------------------------*
REPORT zah_r_umsatz.

SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE TEXT-001.
  SELECT-OPTIONS: s_datum FOR sy-datum DEFAULT sy-datum.
  PARAMETERS: p_monat RADIOBUTTON GROUP g1 DEFAULT 'X',
              p_verk  RADIOBUTTON GROUP g1.
SELECTION-SCREEN END OF BLOCK b1.

CLASS lcl_umsatz DEFINITION CREATE PRIVATE.
  PUBLIC SECTION.
    METHODS run
      IMPORTING
        it_datum TYPE STANDARD TABLE
        iv_monat TYPE abap_bool
        iv_verk  TYPE abap_bool.
  PRIVATE SECTION.
    TYPES: BEGIN OF ty_umsatz,
             periode       TYPE char10,
             mitarbeiter   TYPE char40,
             anzahl        TYPE i,
             umsatz_netto  TYPE curr15,
             umsatz_brutto TYPE curr15,
           END OF ty_umsatz.

    DATA: mt_umsatz TYPE STANDARD TABLE OF ty_umsatz.

    METHODS load_monatsumsatz
      IMPORTING it_datum TYPE STANDARD TABLE.
    METHODS load_verkaeuferumsatz
      IMPORTING it_datum TYPE STANDARD TABLE.
    METHODS display_alv.
ENDCLASS.

START-OF-SELECTION.
  NEW lcl_umsatz( )->run(
    it_datum = s_datum[]
    iv_monat = p_monat
    iv_verk  = p_verk
  ).

CLASS lcl_umsatz IMPLEMENTATION.

  METHOD run.
    IF iv_monat = abap_true.
      load_monatsumsatz( it_datum ).
    ELSE.
      load_verkaeuferumsatz( it_datum ).
    ENDIF.
    display_alv( ).
  ENDMETHOD.

  METHOD load_monatsumsatz.
    SELECT
      CAST( SUBSTRING( CAST( r~rechnungsdatum AS CHAR ), 1, 6 ) AS CHAR(10) ) AS periode,
      COUNT( * ) AS anzahl,
      SUM( r~netto ) AS umsatz_netto,
      SUM( r~brutto ) AS umsatz_brutto
      FROM zah_rechnung AS r
      INTO CORRESPONDING FIELDS OF TABLE @mt_umsatz
      WHERE r~rechnungsdatum IN @it_datum
        AND r~status <> 'STORNO'
      GROUP BY SUBSTRING( CAST( r~rechnungsdatum AS CHAR ), 1, 6 )
      ORDER BY periode.
  ENDMETHOD.

  METHOD load_verkaeuferumsatz.
    SELECT
      m~nachname AS mitarbeiter,
      COUNT( * ) AS anzahl,
      SUM( r~netto ) AS umsatz_netto,
      SUM( r~brutto ) AS umsatz_brutto
      FROM zah_rechnung AS r
      INNER JOIN zah_auftrag AS a ON r~auftrag_id = a~auftrag_id
      INNER JOIN zah_mitarbeiter AS m ON a~mitarbeiter_id = m~mitarbeiter_id
      INTO CORRESPONDING FIELDS OF TABLE @mt_umsatz
      WHERE r~rechnungsdatum IN @it_datum
        AND r~status <> 'STORNO'
      GROUP BY m~nachname
      ORDER BY umsatz_brutto DESCENDING.
  ENDMETHOD.

  METHOD display_alv.
    WRITE: / 'Autohaus HESSEN GmbH – Umsatzbericht'.
    WRITE: / 'Zeitraum:', s_datum-low, 'bis', s_datum-high.
    SKIP 1.

    DATA: lo_alv TYPE REF TO cl_salv_table.
    TRY.
        cl_salv_table=>factory(
          IMPORTING r_salv_table = lo_alv
          CHANGING  t_table      = mt_umsatz ).
        lo_alv->get_functions( )->set_all( abap_true ).
        lo_alv->get_columns( )->set_optimize( abap_true ).
        lo_alv->get_aggregations( )->add_aggregation(
          columnname = 'UMSATZ_BRUTTO' aggregation = if_salv_c_aggregation=>total ).
        lo_alv->display( ).
      CATCH cx_salv_msg INTO DATA(lx).
        MESSAGE lx->get_text( ) TYPE 'E'.
    ENDTRY.
  ENDMETHOD.

ENDCLASS.
