*&---------------------------------------------------------------------*
*& Klasse: ZCL_AH_VERKAUF
*& Verkaufsprozess: Angebot → Auftrag → Auslieferung
*&---------------------------------------------------------------------*
CLASS zcl_ah_verkauf DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    TYPES:
      BEGIN OF ty_angebot_komplett,
        header TYPE zah_angebot,
        items  TYPE STANDARD TABLE OF zah_angebot_pos WITH DEFAULT KEY,
      END OF ty_angebot_komplett,
      BEGIN OF ty_auftrag_komplett,
        header TYPE zah_auftrag,
        items  TYPE STANDARD TABLE OF zah_auftrag_pos WITH DEFAULT KEY,
      END OF ty_auftrag_komplett.

    CONSTANTS: gc_mwst_satz TYPE p LENGTH 3 DECIMALS 2 VALUE '0.19'.

    " --- Angebot ---
    METHODS create_angebot
      IMPORTING
        is_header TYPE zah_angebot
        it_items  TYPE STANDARD TABLE
      RETURNING
        VALUE(rv_angebot_id) TYPE zah_angebot-angebot_id
      RAISING
        zcx_ah_error.

    METHODS annehmen_angebot
      IMPORTING
        iv_angebot_id TYPE zah_angebot-angebot_id
      RETURNING
        VALUE(rv_auftrag_id) TYPE zah_auftrag-auftrag_id
      RAISING
        zcx_ah_error.

    " --- Auftrag ---
    METHODS create_auftrag
      IMPORTING
        is_header TYPE zah_auftrag
        it_items  TYPE STANDARD TABLE
      RETURNING
        VALUE(rv_auftrag_id) TYPE zah_auftrag-auftrag_id
      RAISING
        zcx_ah_error.

    METHODS ausliefern
      IMPORTING
        iv_auftrag_id TYPE zah_auftrag-auftrag_id
      RAISING
        zcx_ah_error.

    METHODS read_auftrag
      IMPORTING
        iv_auftrag_id TYPE zah_auftrag-auftrag_id
      RETURNING
        VALUE(rs_auftrag) TYPE ty_auftrag_komplett
      RAISING
        zcx_ah_error.

  PROTECTED SECTION.
  PRIVATE SECTION.
    METHODS berechne_betraege
      CHANGING
        cs_header TYPE any
        ct_items  TYPE STANDARD TABLE.

    METHODS get_fahrzeug_mgr
      RETURNING
        VALUE(ro) TYPE REF TO zcl_ah_fahrzeug.

ENDCLASS.

CLASS zcl_ah_verkauf IMPLEMENTATION.

  METHOD get_fahrzeug_mgr.
    CREATE OBJECT ro.
  ENDMETHOD.

  METHOD berechne_betraege.
    DATA: lv_netto TYPE curr15,
          lv_mwst  TYPE curr15.

    LOOP AT ct_items ASSIGNING FIELD-SYMBOL(<item>).
      ASSIGN COMPONENT 'VERKAUFSPREIS' OF STRUCTURE <item> TO FIELD-SYMBOL(<preis>).
      ASSIGN COMPONENT 'RABATT' OF STRUCTURE <item> TO FIELD-SYMBOL(<rabatt>).
      ASSIGN COMPONENT 'NETTO' OF STRUCTURE <item> TO FIELD-SYMBOL(<netto>).
      IF <rabatt> IS ASSIGNED AND <preis> IS ASSIGNED AND <netto> IS ASSIGNED.
        <netto> = <preis> - <rabatt>.
        lv_netto = lv_netto + <netto>.
      ENDIF.
    ENDLOOP.

    ASSIGN COMPONENT 'NETTO' OF STRUCTURE cs_header TO FIELD-SYMBOL(<h_netto>).
    ASSIGN COMPONENT 'MWST' OF STRUCTURE cs_header TO FIELD-SYMBOL(<h_mwst>).
    ASSIGN COMPONENT 'BRUTTO' OF STRUCTURE cs_header TO FIELD-SYMBOL(<h_brutto>).
    ASSIGN COMPONENT 'RABATT' OF STRUCTURE cs_header TO FIELD-SYMBOL(<h_rabatt>).

    IF <h_netto> IS ASSIGNED.
      <h_netto> = lv_netto.
      <h_mwst> = lv_netto * gc_mwst_satz.
      <h_brutto> = lv_netto + <h_mwst>.
    ENDIF.
  ENDMETHOD.

  METHOD create_angebot.
    DATA: ls_header TYPE zah_angebot,
          ls_item   TYPE zah_angebot_pos,
          lt_items  TYPE STANDARD TABLE OF zah_angebot_pos,
          lv_pos    TYPE numc4 VALUE 10.

    ls_header = is_header.
    ls_header-angebot_id = zcl_ah_nummernkreis=>get_next_number( 'ANGEBOT' ).
    ls_header-status = 'OFFEN'.
    ls_header-angebotsdatum = sy-datum.
    ls_header-erstellt_am = sy-datum.
    ls_header-erstellt_von = sy-uname.

    LOOP AT it_items INTO DATA(ls_pos).
      ls_item = CORRESPONDING #( ls_pos ).
      ls_item-angebot_id = ls_header-angebot_id.
      ls_item-pos_nr = lv_pos.
      ls_item-netto = ls_item-verkaufspreis - ls_item-rabatt.
      APPEND ls_item TO lt_items.
      lv_pos = lv_pos + 10.
    ENDLOOP.

    berechne_betraege( CHANGING cs_header = ls_header ct_items = lt_items ).

    INSERT zah_angebot FROM ls_header.
    INSERT zah_angebot_pos FROM TABLE lt_items.

    COMMIT WORK.
    rv_angebot_id = ls_header-angebot_id.
  ENDMETHOD.

  METHOD annehmen_angebot.
    DATA: ls_angebot TYPE zah_angebot,
          ls_auftrag TYPE zah_auftrag,
          lt_ang_pos TYPE TABLE OF zah_angebot_pos,
          lt_auf_pos TYPE TABLE OF zah_auftrag_pos,
          lo_fahrz   TYPE REF TO zcl_ah_fahrzeug.

    SELECT SINGLE * FROM zah_angebot INTO ls_angebot
      WHERE angebots_id = iv_angebot_id AND status = 'OFFEN'.
    IF sy-subrc <> 0.
      RAISE EXCEPTION TYPE zcx_ah_error
        EXPORTING textid = zcx_ah_error=>update_failed.
    ENDIF.

    SELECT * FROM zah_angebot_pos INTO TABLE lt_ang_pos
      WHERE angebots_id = iv_angebot_id.

    " Auftrag aus Angebot erstellen
    ls_auftrag-auftrag_id = zcl_ah_nummernkreis=>get_next_number( 'AUFTRAG' ).
    ls_auftrag-angebot_id = iv_angebot_id.
    ls_auftrag-kunde_id = ls_angebot-kunde_id.
    ls_auftrag-mitarbeiter_id = ls_angebot-mitarbeiter_id.
    ls_auftrag-auftragsdatum = sy-datum.
    ls_auftrag-status = 'OFFEN'.
    ls_auftrag-netto = ls_angebot-netto.
    ls_auftrag-mwst = ls_angebot-mwst.
    ls_auftrag-brutto = ls_angebot-brutto.
    ls_auftrag-erstellt_am = sy-datum.
    ls_auftrag-erstellt_von = sy-uname.

    lo_fahrz = get_fahrzeug_mgr( ).
    LOOP AT lt_ang_pos INTO DATA(ls_ap).
      APPEND VALUE #(
        auftrag_id    = ls_auftrag-auftrag_id
        pos_nr        = ls_ap-pos_nr
        fahrzeug_id   = ls_ap-fahrzeug_id
        beschreibung  = ls_ap-beschreibung
        verkaufspreis = ls_ap-verkaufspreis
        rabatt        = ls_ap-rabatt
        netto         = ls_ap-netto
      ) TO lt_auf_pos.

      " Fahrzeug reservieren
      lo_fahrz->reservieren( ls_ap-fahrzeug_id ).
    ENDLOOP.

    UPDATE zah_angebot SET status = 'ANGEN' WHERE angebots_id = iv_angebot_id.
    INSERT zah_auftrag FROM ls_auftrag.
    INSERT zah_auftrag_pos FROM TABLE lt_auf_pos.

    COMMIT WORK.
    rv_auftrag_id = ls_auftrag-auftrag_id.
  ENDMETHOD.

  METHOD create_auftrag.
    DATA: ls_header TYPE zah_auftrag,
          ls_item   TYPE zah_auftrag_pos,
          lt_items  TYPE STANDARD TABLE OF zah_auftrag_pos,
          lv_pos    TYPE numc4 VALUE 10,
          lo_fahrz  TYPE REF TO zcl_ah_fahrzeug.

    ls_header = is_header.
    ls_header-auftrag_id = zcl_ah_nummernkreis=>get_next_number( 'AUFTRAG' ).
    ls_header-status = 'OFFEN'.
    ls_header-auftragsdatum = sy-datum.
    ls_header-erstellt_am = sy-datum.
    ls_header-erstellt_von = sy-uname.

    lo_fahrz = get_fahrzeug_mgr( ).

    LOOP AT it_items INTO DATA(ls_pos).
      ls_item = CORRESPONDING #( ls_pos ).
      ls_item-auftrag_id = ls_header-auftrag_id.
      ls_item-pos_nr = lv_pos.
      ls_item-netto = ls_item-verkaufspreis - ls_item-rabatt.
      APPEND ls_item TO lt_items.
      lo_fahrz->reservieren( ls_item-fahrzeug_id ).
      lv_pos = lv_pos + 10.
    ENDLOOP.

    berechne_betraege( CHANGING cs_header = ls_header ct_items = lt_items ).

    INSERT zah_auftrag FROM ls_header.
    INSERT zah_auftrag_pos FROM TABLE lt_items.

    COMMIT WORK.
    rv_auftrag_id = ls_header-auftrag_id.
  ENDMETHOD.

  METHOD ausliefern.
    DATA: ls_auftrag TYPE zah_auftrag,
          lt_pos     TYPE TABLE OF zah_auftrag_pos,
          lo_fahrz   TYPE REF TO zcl_ah_fahrzeug.

    SELECT SINGLE * FROM zah_auftrag INTO ls_auftrag
      WHERE auftrag_id = iv_auftrag_id.
    SELECT * FROM zah_auftrag_pos INTO TABLE lt_pos
      WHERE auftrag_id = iv_auftrag_id.

    lo_fahrz = get_fahrzeug_mgr( ).
    LOOP AT lt_pos INTO DATA(ls_p).
      lo_fahrz->verkaufen( ls_p-fahrzeug_id ).
      lo_fahrz->ausliefern( ls_p-fahrzeug_id ).
    ENDLOOP.

    UPDATE zah_auftrag SET status = 'AUSG' WHERE auftrag_id = iv_auftrag_id.
    COMMIT WORK.
  ENDMETHOD.

  METHOD read_auftrag.
    SELECT SINGLE * FROM zah_auftrag INTO rs_auftrag-header
      WHERE auftrag_id = iv_auftrag_id.
    SELECT * FROM zah_auftrag_pos INTO TABLE rs_auftrag-items
      WHERE auftrag_id = iv_auftrag_id ORDER BY pos_nr.
  ENDMETHOD.

ENDCLASS.
