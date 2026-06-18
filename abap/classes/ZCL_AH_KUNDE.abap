*&---------------------------------------------------------------------*
*& Klasse: ZCL_AH_KUNDE
*& Kundenverwaltung – CRUD
*&---------------------------------------------------------------------*
CLASS zcl_ah_kunde DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    TYPES: tt_kunde TYPE STANDARD TABLE OF zah_kunde WITH DEFAULT KEY.

    METHODS create
      IMPORTING
        is_kunde TYPE zah_kunde
      RETURNING
        VALUE(rv_kunde_id) TYPE zah_kunde-kunde_id
      RAISING
        zcx_ah_error.

    METHODS update
      IMPORTING
        is_kunde TYPE zah_kunde
      RAISING
        zcx_ah_error.

    METHODS delete
      IMPORTING
        iv_kunde_id TYPE zah_kunde-kunde_id
      RAISING
        zcx_ah_error.

    METHODS read
      IMPORTING
        iv_kunde_id TYPE zah_kunde-kunde_id
      RETURNING
        VALUE(rs_kunde) TYPE zah_kunde
      RAISING
        zcx_ah_error.

    METHODS search
      IMPORTING
        iv_name TYPE zah_kunde-nachname OPTIONAL
        iv_ort TYPE zah_kunde-ort OPTIONAL
      RETURNING
        VALUE(rt_kunde) TYPE tt_kunde.

  PROTECTED SECTION.
  PRIVATE SECTION.

ENDCLASS.

CLASS zcl_ah_kunde IMPLEMENTATION.

  METHOD create.
    DATA: ls_kunde TYPE zah_kunde.

    ls_kunde = is_kunde.
    ls_kunde-kunde_id = zcl_ah_nummernkreis=>get_next_number( 'KUNDE' ).
    ls_kunde-erstellt_am = sy-datum.
    ls_kunde-erstellt_von = sy-uname.
    ls_kunde-aktiv = 'X'.

    INSERT zah_kunde FROM ls_kunde.
    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING textid = zcx_ah_error=>update_failed.
    ENDIF.

    COMMIT WORK.
    rv_kunde_id = ls_kunde-kunde_id.
  ENDMETHOD.

  METHOD update.
    DATA: ls_kunde TYPE zah_kunde.

    ls_kunde = is_kunde.
    ls_kunde-geandert_am = sy-datum.
    ls_kunde-geandert_von = sy-uname.

    MODIFY zah_kunde FROM ls_kunde.
    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING textid = zcx_ah_error=>update_failed.
    ENDIF.
    COMMIT WORK.
  ENDMETHOD.

  METHOD delete.
    " Soft-Delete: nur deaktivieren
    UPDATE zah_kunde SET aktiv = ''
      WHERE kunde_id = iv_kunde_id.
    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING textid = zcx_ah_error=>kunde_not_found
                mv_kunde_id = iv_kunde_id.
    ENDIF.
    COMMIT WORK.
  ENDMETHOD.

  METHOD read.
    SELECT SINGLE * FROM zah_kunde
      INTO rs_kunde
      WHERE kunde_id = iv_kunde_id
        AND aktiv = 'X'.

    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING textid = zcx_ah_error=>kunde_not_found
                mv_kunde_id = iv_kunde_id.
    ENDIF.
  ENDMETHOD.

  METHOD search.
    SELECT * FROM zah_kunde
      INTO TABLE rt_kunde
      WHERE aktiv = 'X'
        AND ( iv_name IS INITIAL OR nachname LIKE iv_name )
        AND ( iv_ort IS INITIAL OR ort LIKE iv_ort )
      ORDER BY nachname, vorname.
  ENDMETHOD.

ENDCLASS.
