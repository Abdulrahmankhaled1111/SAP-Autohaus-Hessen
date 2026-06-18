*&---------------------------------------------------------------------*
*& Klasse: ZCL_AH_NUMMERNKREIS
*& Automatische Nummernvergabe für alle Belegtypen
*& Anlegen in SE24
*&---------------------------------------------------------------------*
CLASS zcl_ah_nummernkreis DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    TYPES: ty_objekt_typ TYPE char10.

    CLASS-METHODS get_next_number
      IMPORTING
        iv_objekt_typ TYPE ty_objekt_typ
      RETURNING
        VALUE(rv_number) TYPE char10
      RAISING
        zcx_ah_error.

    CLASS-METHODS format_number
      IMPORTING
        iv_prefix TYPE char2
        iv_number TYPE numc10
      RETURNING
        VALUE(rv_id) TYPE char10.

  PROTECTED SECTION.
  PRIVATE SECTION.

ENDCLASS.

CLASS zcl_ah_nummernkreis IMPLEMENTATION.

  METHOD get_next_number.
    DATA: ls_nk TYPE zah_nummernkreis,
          lv_nr TYPE numc10.

    " Nummernkreis mit Sperre lesen
    SELECT SINGLE * FROM zah_nummernkreis
      INTO ls_nk
      WHERE objekt_typ = iv_objekt_typ.

    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING
          textid = zcx_ah_error=>nummernkreis_not_found
          mv_objekt = iv_objekt_typ.
    ENDIF.

    " Nummer erhöhen
    lv_nr = ls_nk-aktuelle_nr + 1.

    UPDATE zah_nummernkreis
      SET aktuelle_nr = lv_nr
      WHERE objekt_typ = iv_objekt_typ.

    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING
          textid = zcx_ah_error=>update_failed.
    ENDIF.

    COMMIT WORK.

    rv_number = format_number(
      iv_prefix = ls_nk-prefix
      iv_number = lv_nr
    ).
  ENDMETHOD.

  METHOD format_number.
    DATA: lv_num_char TYPE char10.
    lv_num_char = iv_number.
    CONDENSE lv_num_char NO-GAPS.
    rv_id = iv_prefix && lv_num_char+2(8).  " Präfix + 8 Stellen
  ENDMETHOD.

ENDCLASS.
