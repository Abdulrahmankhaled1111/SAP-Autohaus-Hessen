*&---------------------------------------------------------------------*
*& Klasse: ZCL_AH_FAHRZEUG
*& Fahrzeugverwaltung – CRUD + Statussteuerung
*&---------------------------------------------------------------------*
CLASS zcl_ah_fahrzeug DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    TYPES: tt_fahrzeug TYPE STANDARD TABLE OF zah_fahrzeug WITH DEFAULT KEY.

    METHODS constructor
      IMPORTING
        iv_fahrzeug_id TYPE zah_fahrzeug-fahrzeug_id OPTIONAL.

    " CRUD
    METHODS create
      IMPORTING
        is_fahrzeug TYPE zah_fahrzeug
      RETURNING
        VALUE(rv_fahrzeug_id) TYPE zah_fahrzeug-fahrzeug_id
      RAISING
        zcx_ah_error.

    METHODS update
      IMPORTING
        is_fahrzeug TYPE zah_fahrzeug
      RAISING
        zcx_ah_error.

    METHODS delete
      IMPORTING
        iv_fahrzeug_id TYPE zah_fahrzeug-fahrzeug_id
      RAISING
        zcx_ah_error.

    METHODS read
      IMPORTING
        iv_fahrzeug_id TYPE zah_fahrzeug-fahrzeug_id
      RETURNING
        VALUE(rs_fahrzeug) TYPE zah_fahrzeug
      RAISING
        zcx_ah_error.

    METHODS get_by_status
      IMPORTING
        iv_status TYPE zah_fahrzeug-status
      RETURNING
        VALUE(rt_fahrzeug) TYPE tt_fahrzeug.

    METHODS get_bestand
      RETURNING
        VALUE(rt_fahrzeug) TYPE tt_fahrzeug.

    " Statussteuerung
    METHODS set_status
      IMPORTING
        iv_fahrzeug_id TYPE zah_fahrzeug-fahrzeug_id
        iv_neuer_status TYPE zah_fahrzeug-status
        iv_bemerkung TYPE char100 OPTIONAL
      RAISING
        zcx_ah_error.

    METHODS reservieren
      IMPORTING
        iv_fahrzeug_id TYPE zah_fahrzeug-fahrzeug_id
      RAISING
        zcx_ah_error.

    METHODS verkaufen
      IMPORTING
        iv_fahrzeug_id TYPE zah_fahrzeug-fahrzeug_id
      RAISING
        zcx_ah_error.

    METHODS ausliefern
      IMPORTING
        iv_fahrzeug_id TYPE zah_fahrzeug-fahrzeug_id
        iv_km_stand TYPE zah_fahrzeug-km_stand OPTIONAL
      RAISING
        zcx_ah_error.

  PROTECTED SECTION.
  PRIVATE SECTION.
    DATA: ms_fahrzeug TYPE zah_fahrzeug.

    METHODS write_history
      IMPORTING
        iv_fahrzeug_id TYPE zah_fahrzeug-fahrzeug_id
        iv_status_alt TYPE zah_fahrzeug-status
        iv_status_neu TYPE zah_fahrzeug-status
        iv_bemerkung TYPE char100 OPTIONAL.

    METHODS validate_status_change
      IMPORTING
        iv_status_alt TYPE zah_fahrzeug-status
        iv_status_neu TYPE zah_fahrzeug-status
      RAISING
        zcx_ah_error.

ENDCLASS.

CLASS zcl_ah_fahrzeug IMPLEMENTATION.

  METHOD constructor.
    IF iv_fahrzeug_id IS NOT INITIAL.
      ms_fahrzeug = me->read( iv_fahrzeug_id ).
    ENDIF.
  ENDMETHOD.

  METHOD create.
    DATA: ls_fahrzeug TYPE zah_fahrzeug.

    ls_fahrzeug = is_fahrzeug.
    ls_fahrzeug-fahrzeug_id = zcl_ah_nummernkreis=>get_next_number( 'FAHRZEUG' ).
    ls_fahrzeug-status = 'BESTAND'.
    ls_fahrzeug-eingangsdatum = sy-datum.
    ls_fahrzeug-erstellt_am = sy-datum.
    ls_fahrzeug-erstellt_von = sy-uname.

    INSERT zah_fahrzeug FROM ls_fahrzeug.
    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING textid = zcx_ah_error=>update_failed.
    ENDIF.

    write_history(
      iv_fahrzeug_id = ls_fahrzeug-fahrzeug_id
      iv_status_alt  = ''
      iv_status_neu  = 'BESTAND'
      iv_bemerkung   = 'Fahrzeug angelegt'
    ).

    COMMIT WORK.
    rv_fahrzeug_id = ls_fahrzeug-fahrzeug_id.
  ENDMETHOD.

  METHOD update.
    DATA: ls_fahrzeug TYPE zah_fahrzeug.

    ls_fahrzeug = is_fahrzeug.
    ls_fahrzeug-geandert_am = sy-datum.
    ls_fahrzeug-geandert_von = sy-uname.

    MODIFY zah_fahrzeug FROM ls_fahrzeug.
    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING textid = zcx_ah_error=>update_failed.
    ENDIF.
    COMMIT WORK.
  ENDMETHOD.

  METHOD delete.
    DELETE FROM zah_fahrzeug WHERE fahrzeug_id = iv_fahrzeug_id.
    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING textid = zcx_ah_error=>fahrzeug_not_found
                mv_fahrzeug_id = iv_fahrzeug_id.
    ENDIF.
    COMMIT WORK.
  ENDMETHOD.

  METHOD read.
    SELECT SINGLE * FROM zah_fahrzeug
      INTO rs_fahrzeug
      WHERE fahrzeug_id = iv_fahrzeug_id.

    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING textid = zcx_ah_error=>fahrzeug_not_found
                mv_fahrzeug_id = iv_fahrzeug_id.
    ENDIF.
  ENDMETHOD.

  METHOD get_by_status.
    SELECT * FROM zah_fahrzeug
      INTO TABLE rt_fahrzeug
      WHERE status = iv_status
      ORDER BY marke_id, modell.
  ENDMETHOD.

  METHOD get_bestand.
    rt_fahrzeug = me->get_by_status( 'BESTAND' ).
  ENDMETHOD.

  METHOD set_status.
    DATA: ls_fahrzeug TYPE zah_fahrzeug,
          lv_status_alt TYPE zah_fahrzeug-status.

    ls_fahrzeug = me->read( iv_fahrzeug_id ).
    lv_status_alt = ls_fahrzeug-status.

    validate_status_change(
      iv_status_alt = lv_status_alt
      iv_status_neu = iv_neuer_status
    ).

    ls_fahrzeug-status = iv_neuer_status.
    ls_fahrzeug-geandert_am = sy-datum.
    ls_fahrzeug-geandert_von = sy-uname.

    MODIFY zah_fahrzeug FROM ls_fahrzeug.

    write_history(
      iv_fahrzeug_id = iv_fahrzeug_id
      iv_status_alt  = lv_status_alt
      iv_status_neu  = iv_neuer_status
      iv_bemerkung   = iv_bemerkung
    ).

    COMMIT WORK.
  ENDMETHOD.

  METHOD reservieren.
    me->set_status(
      iv_fahrzeug_id  = iv_fahrzeug_id
      iv_neuer_status = 'RESV'
      iv_bemerkung    = 'Fahrzeug reserviert'
    ).
  ENDMETHOD.

  METHOD verkaufen.
    me->set_status(
      iv_fahrzeug_id  = iv_fahrzeug_id
      iv_neuer_status = 'VKFT'
      iv_bemerkung    = 'Fahrzeug verkauft'
    ).
  ENDMETHOD.

  METHOD ausliefern.
    DATA: ls_fahrzeug TYPE zah_fahrzeug.

    ls_fahrzeug = me->read( iv_fahrzeug_id ).
    IF iv_km_stand IS NOT INITIAL.
      ls_fahrzeug-km_stand = iv_km_stand.
    ENDIF.
    ls_fahrzeug-auslieferdat = sy-datum.
    MODIFY zah_fahrzeug FROM ls_fahrzeug.

    me->set_status(
      iv_fahrzeug_id  = iv_fahrzeug_id
      iv_neuer_status = 'AUSG'
      iv_bemerkung    = 'Fahrzeug ausgeliefert'
    ).
  ENDMETHOD.

  METHOD write_history.
    DATA: ls_hist TYPE zah_fahrzeug_hist,
          lv_seq  TYPE numc6.

    SELECT MAX( seqnr ) FROM zah_fahrzeug_hist
      INTO lv_seq
      WHERE fahrzeug_id = iv_fahrzeug_id.

    ls_hist-fahrzeug_id = iv_fahrzeug_id.
    ls_hist-seqnr = lv_seq + 1.
    ls_hist-status_alt = iv_status_alt.
    ls_hist-status_neu = iv_status_neu.
    ls_hist-aenderdatum = sy-datum.
    ls_hist-aenderzeit = sy-uzeit.
    ls_hist-aenderuser = sy-uname.
    ls_hist-bemerkung = iv_bemerkung.

    INSERT zah_fahrzeug_hist FROM ls_hist.
  ENDMETHOD.

  METHOD validate_status_change.
    " Erlaubte Statusübergänge
    DATA: lt_allowed TYPE TABLE OF string.

    CASE iv_status_alt.
      WHEN 'BEST'.
        lt_allowed = VALUE #( ( 'BESTAND' ) ( 'STORNO' ) ).
      WHEN 'BESTAND'.
        lt_allowed = VALUE #( ( 'RESV' ) ( 'WS' ) ).
      WHEN 'RESV'.
        lt_allowed = VALUE #( ( 'VKFT' ) ( 'BESTAND' ) ).
      WHEN 'VKFT'.
        lt_allowed = VALUE #( ( 'AUSG' ) ).
      WHEN 'WS'.
        lt_allowed = VALUE #( ( 'BESTAND' ) ).
      WHEN OTHERS.
        IF iv_status_alt IS INITIAL.
          RETURN.  " Neuanlage
        ENDIF.
    ENDCASE.

    IF line_exists( lt_allowed[ table_line = iv_status_neu ] ) = abap_false.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING textid = zcx_ah_error=>status_invalid
                mv_status = iv_status_neu.
    ENDIF.
  ENDMETHOD.

ENDCLASS.
