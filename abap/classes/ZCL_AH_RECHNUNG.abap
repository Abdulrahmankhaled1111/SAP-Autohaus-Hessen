*&---------------------------------------------------------------------*
*& Klasse: ZCL_AH_RECHNUNG
*& Rechnungsstellung + Zahlungseingang
*&---------------------------------------------------------------------*
CLASS zcl_ah_rechnung DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    TYPES:
      BEGIN OF ty_rechnung_komplett,
        header TYPE zah_rechnung,
        items  TYPE STANDARD TABLE OF zah_rechnung_pos WITH DEFAULT KEY,
        payments TYPE STANDARD TABLE OF zah_zahlung WITH DEFAULT KEY,
      END OF ty_rechnung_komplett.

    CONSTANTS: gc_mwst_satz TYPE p LENGTH 3 DECIMALS 2 VALUE '0.19'.

    METHODS create_from_auftrag
      IMPORTING
        iv_auftrag_id TYPE zah_auftrag-auftrag_id
      RETURNING
        VALUE(rv_rechnung_id) TYPE zah_rechnung-rechnung_id
      RAISING
        zcx_ah_error.

    METHODS erfasse_zahlung
      IMPORTING
        iv_rechnung_id TYPE zah_rechnung-rechnung_id
        iv_betrag TYPE zah_zahlung-betrag
        iv_zahlungsart TYPE zah_zahlung-zahlungsart DEFAULT 'UEBERWEISUNG'
        iv_referenz TYPE zah_zahlung-referenz OPTIONAL
      RAISING
        zcx_ah_error.

    METHODS read
      IMPORTING
        iv_rechnung_id TYPE zah_rechnung-rechnung_id
      RETURNING
        VALUE(rs_rechnung) TYPE ty_rechnung_komplett
      RAISING
        zcx_ah_error.

    METHODS get_offene_rechnungen
      RETURNING
        VALUE(rt_rechnung) TYPE STANDARD TABLE OF zah_rechnung.

  PROTECTED SECTION.
  PRIVATE SECTION.

ENDCLASS.

CLASS zcl_ah_rechnung IMPLEMENTATION.

  METHOD create_from_auftrag.
    DATA: ls_auftrag  TYPE zah_auftrag,
          lt_auf_pos  TYPE TABLE OF zah_auftrag_pos,
          ls_rechnung TYPE zah_rechnung,
          lt_rech_pos TYPE TABLE OF zah_rechnung_pos,
          lv_zahlziel TYPE char10.

    SELECT SINGLE * FROM zah_auftrag INTO ls_auftrag
      WHERE auftrag_id = iv_auftrag_id AND status = 'AUSG'.
    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING textid = zcx_ah_error=>update_failed.
    ENDIF.

    SELECT * FROM zah_auftrag_pos INTO TABLE lt_auf_pos
      WHERE auftrag_id = iv_auftrag_id.

    ls_rechnung-rechnung_id = zcl_ah_nummernkreis=>get_next_number( 'RECHNUNG' ).
    ls_rechnung-auftrag_id = iv_auftrag_id.
    ls_rechnung-kunde_id = ls_auftrag-kunde_id.
    ls_rechnung-rechnungsdatum = sy-datum.

    SELECT SINGLE wert FROM zah_konfig INTO lv_zahlziel WHERE param = 'ZAHLUNGSZIEL'.
    ls_rechnung-faelligkeit = sy-datum + CONV i( lv_zahlziel ).

    ls_rechnung-status = 'OFFEN'.
    ls_rechnung-netto = ls_auftrag-netto.
    ls_rechnung-mwst_satz = gc_mwst_satz * 100.
    ls_rechnung-mwst = ls_auftrag-mwst.
    ls_rechnung-brutto = ls_auftrag-brutto.
    ls_rechnung-bezahlt = 0.
    ls_rechnung-offen = ls_auftrag-brutto.
    ls_rechnung-erstellt_am = sy-datum.
    ls_rechnung-erstellt_von = sy-uname.

    LOOP AT lt_auf_pos INTO DATA(ls_ap).
      APPEND VALUE #(
        rechnung_id  = ls_rechnung-rechnung_id
        pos_nr       = ls_ap-pos_nr
        fahrzeug_id  = ls_ap-fahrzeug_id
        beschreibung = ls_ap-beschreibung
        menge        = 1
        einzelpreis  = ls_ap-netto
        netto        = ls_ap-netto
      ) TO lt_rech_pos.
    ENDLOOP.

    INSERT zah_rechnung FROM ls_rechnung.
    INSERT zah_rechnung_pos FROM TABLE lt_rech_pos.

    COMMIT WORK.
    rv_rechnung_id = ls_rechnung-rechnung_id.
  ENDMETHOD.

  METHOD erfasse_zahlung.
    DATA: ls_rechnung TYPE zah_rechnung,
          ls_zahlung TYPE zah_zahlung.

    SELECT SINGLE * FROM zah_rechnung INTO ls_rechnung
      WHERE rechnung_id = iv_rechnung_id
        AND status <> 'BEZAHLT'.
    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING textid = zcx_ah_error=>update_failed.
    ENDIF.

    ls_zahlung-zahlung_id = zcl_ah_nummernkreis=>get_next_number( 'ZAHLUNG' ).
    ls_zahlung-rechnung_id = iv_rechnung_id.
    ls_zahlung-zahlungsdatum = sy-datum.
    ls_zahlung-betrag = iv_betrag.
    ls_zahlung-zahlungsart = iv_zahlungsart.
    ls_zahlung-referenz = iv_referenz.
    ls_zahlung-erstellt_am = sy-datum.
    ls_zahlung-erstellt_von = sy-uname.

    INSERT zah_zahlung FROM ls_zahlung.

    ls_rechnung-bezahlt = ls_rechnung-bezahlt + iv_betrag.
    ls_rechnung-offen = ls_rechnung-brutto - ls_rechnung-bezahlt.

    IF ls_rechnung-offen <= 0.
      ls_rechnung-status = 'BEZAHLT'.
      ls_rechnung-offen = 0.
    ELSE.
      ls_rechnung-status = 'TEIL'.
    ENDIF.

    MODIFY zah_rechnung FROM ls_rechnung.
    COMMIT WORK.
  ENDMETHOD.

  METHOD read.
    SELECT SINGLE * FROM zah_rechnung INTO rs_rechnung-header
      WHERE rechnung_id = iv_rechnung_id.
    SELECT * FROM zah_rechnung_pos INTO TABLE rs_rechnung-items
      WHERE rechnung_id = iv_rechnung_id.
    SELECT * FROM zah_zahlung INTO TABLE rs_rechnung-payments
      WHERE rechnung_id = iv_rechnung_id.
  ENDMETHOD.

  METHOD get_offene_rechnungen.
    SELECT * FROM zah_rechnung INTO TABLE rt_rechnung
      WHERE status = 'OFFEN' OR status = 'TEIL'
      ORDER BY faelligkeit.
  ENDMETHOD.

ENDCLASS.
