*&---------------------------------------------------------------------*
*& Klasse: ZCL_AH_EINKAUF
*& Einkaufsprozess – Bestellung + Wareneingang
*&---------------------------------------------------------------------*
CLASS zcl_ah_einkauf DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    TYPES:
      BEGIN OF ty_einkauf_komplett,
        header TYPE zah_einkauf,
        items  TYPE STANDARD TABLE OF zah_einkauf_pos WITH DEFAULT KEY,
      END OF ty_einkauf_komplett.

    METHODS create_einkauf
      IMPORTING
        is_header TYPE zah_einkauf
        it_items  TYPE STANDARD TABLE
      RETURNING
        VALUE(rv_einkauf_id) TYPE zah_einkauf-einkauf_id
      RAISING
        zcx_ah_error.

    METHODS wareneingang
      IMPORTING
        iv_einkauf_id TYPE zah_einkauf-einkauf_id
        iv_pos_nr TYPE zah_einkauf_pos-pos_nr
        is_fahrzeug TYPE zah_fahrzeug
      RETURNING
        VALUE(rv_fahrzeug_id) TYPE zah_fahrzeug-fahrzeug_id
      RAISING
        zcx_ah_error.

    METHODS read
      IMPORTING
        iv_einkauf_id TYPE zah_einkauf-einkauf_id
      RETURNING
        VALUE(rs_einkauf) TYPE ty_einkauf_komplett
      RAISING
        zcx_ah_error.

  PROTECTED SECTION.
  PRIVATE SECTION.
    DATA: mo_fahrzeug TYPE REF TO zcl_ah_fahrzeug.

    METHODS get_fahrzeug
      RETURNING
        VALUE(ro_fahrzeug) TYPE REF TO zcl_ah_fahrzeug.

ENDCLASS.

CLASS zcl_ah_einkauf IMPLEMENTATION.

  METHOD get_fahrzeug.
    IF mo_fahrzeug IS NOT BOUND.
      CREATE OBJECT mo_fahrzeug.
    ENDIF.
    ro_fahrzeug = mo_fahrzeug.
  ENDMETHOD.

  METHOD create_einkauf.
    DATA: ls_header TYPE zah_einkauf,
          ls_item   TYPE zah_einkauf_pos,
          lv_pos    TYPE numc4 VALUE 10,
          lv_gesamt TYPE curr15.

    ls_header = is_header.
    ls_header-einkauf_id = zcl_ah_nummernkreis=>get_next_number( 'EINKAUF' ).
    ls_header-status = 'OFFEN'.
    ls_header-erstellt_am = sy-datum.
    ls_header-erstellt_von = sy-uname.

    LOOP AT it_items INTO DATA(ls_pos).
      ls_item = CORRESPONDING #( ls_pos ).
      ls_item-einkauf_id = ls_header-einkauf_id.
      ls_item-pos_nr = lv_pos.
      ls_item-gesamtpreis = ls_item-anzahl * ls_item-einzelpreis.
      lv_gesamt = lv_gesamt + ls_item-gesamtpreis.
      INSERT zah_einkauf_pos FROM ls_item.
      lv_pos = lv_pos + 10.
    ENDLOOP.

    ls_header-gesamtpreis = lv_gesamt.
    INSERT zah_einkauf FROM ls_header.

    COMMIT WORK.
    rv_einkauf_id = ls_header-einkauf_id.
  ENDMETHOD.

  METHOD wareneingang.
    DATA: ls_pos     TYPE zah_einkauf_pos,
          ls_fahrz   TYPE zah_fahrzeug,
          lo_fahrz   TYPE REF TO zcl_ah_fahrzeug.

    SELECT SINGLE * FROM zah_einkauf_pos
      INTO ls_pos
      WHERE einkauf_id = iv_einkauf_id
        AND pos_nr = iv_pos_nr.

    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING textid = zcx_ah_error=>update_failed.
    ENDIF.

    ls_fahrz = is_fahrzeug.
    ls_fahrz-einkauf_id = iv_einkauf_id.
    ls_fahrz-einkaufspreis = ls_pos-einzelpreis.
    ls_fahrz-marke_id = ls_pos-marke_id.
    ls_fahrz-modell = ls_pos-modell.

    lo_fahrz = get_fahrzeug( ).
    rv_fahrzeug_id = lo_fahrz->create( ls_fahrz ).

    " Gelieferte Menge erhöhen
    ls_pos-geliefert = ls_pos-geliefert + 1.
    MODIFY zah_einkauf_pos FROM ls_pos.

    " Einkauf abschließen wenn vollständig geliefert
    SELECT SUM( anzahl ) SUM( geliefert )
      FROM zah_einkauf_pos
      INTO (@DATA(lv_anzahl), @DATA(lv_geliefert))
      WHERE einkauf_id = iv_einkauf_id.

    IF lv_anzahl = lv_geliefert.
      UPDATE zah_einkauf SET status = 'BESTAND'
        WHERE einkauf_id = iv_einkauf_id.
    ENDIF.

    COMMIT WORK.
  ENDMETHOD.

  METHOD read.
    SELECT SINGLE * FROM zah_einkauf
      INTO rs_einkauf-header
      WHERE einkauf_id = iv_einkauf_id.

    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING textid = zcx_ah_error=>update_failed.
    ENDIF.

    SELECT * FROM zah_einkauf_pos
      INTO TABLE rs_einkauf-items
      WHERE einkauf_id = iv_einkauf_id
      ORDER BY pos_nr.
  ENDMETHOD.

ENDCLASS.
