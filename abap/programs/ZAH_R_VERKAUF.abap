*&---------------------------------------------------------------------*
*& Report: ZAH_R_VERKAUF
*& Verkaufsprozess-Steuerung
*& Transaktion: ZAH_VERK (in SE93 anlegen)
*&
*& Ablauf:
*&   1. Angebot erstellen
*&   2. Angebot annehmen → Auftrag
*&   3. Ausliefern
*&   4. Rechnung erstellen
*&---------------------------------------------------------------------*
REPORT zah_r_verkauf.

SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE TEXT-001.
  PARAMETERS: p_angebot TYPE zah_angebot-angebot_id,
              p_auftrag TYPE zah_auftrag-auftrag_id.
SELECTION-SCREEN END OF BLOCK b1.

SELECTION-SCREEN BEGIN OF BLOCK b2 WITH FRAME TITLE TEXT-002.
  PARAMETERS: p_ang_neu  RADIOBUTTON GROUP act DEFAULT 'X',
              p_ang_ok   RADIOBUTTON GROUP act,
              p_auslief  RADIOBUTTON GROUP act,
              p_rech     RADIOBUTTON GROUP act.
SELECTION-SCREEN END OF BLOCK b2.

CLASS lcl_verkauf DEFINITION CREATE PRIVATE.
  PUBLIC SECTION.
    METHODS run.
  PRIVATE SECTION.
    DATA: mo_verkauf   TYPE REF TO zcl_ah_verkauf,
          mo_rechnung  TYPE REF TO zcl_ah_rechnung.

    METHODS annehmen_angebot
      IMPORTING iv_angebot_id TYPE zah_angebot-angebot_id.
    METHODS ausliefern
      IMPORTING iv_auftrag_id TYPE zah_auftrag-auftrag_id.
    METHODS rechnung_erstellen
      IMPORTING iv_auftrag_id TYPE zah_auftrag-auftrag_id.
ENDCLASS.

START-OF-SELECTION.
  NEW lcl_verkauf( )->run( ).

CLASS lcl_verkauf IMPLEMENTATION.

  METHOD run.
    CREATE OBJECT: mo_verkauf, mo_rechnung.

    CASE 'X'.
      WHEN p_ang_neu.
        MESSAGE 'Angebot erstellen: Nutzen Sie ZAH_ANGEBOT_NEU' TYPE 'I'.
      WHEN p_ang_ok.
        IF p_angebot IS INITIAL.
          MESSAGE 'Bitte Angebotsnummer eingeben' TYPE 'E'.
        ENDIF.
        annehmen_angebot( p_angebot ).
      WHEN p_auslief.
        IF p_auftrag IS INITIAL.
          MESSAGE 'Bitte Auftragsnummer eingeben' TYPE 'E'.
        ENDIF.
        ausliefern( p_auftrag ).
      WHEN p_rech.
        IF p_auftrag IS INITIAL.
          MESSAGE 'Bitte Auftragsnummer eingeben' TYPE 'E'.
        ENDIF.
        rechnung_erstellen( p_auftrag ).
    ENDCASE.
  ENDMETHOD.

  METHOD annehmen_angebot.
    TRY.
        DATA(lv_auftrag_id) = mo_verkauf->annehmen_angebot( iv_angebot_id ).
        MESSAGE |Auftrag { lv_auftrag_id } erstellt| TYPE 'S'.
      CATCH zcx_ah_error INTO DATA(lx).
        MESSAGE lx->get_text( ) TYPE 'E'.
    ENDTRY.
  ENDMETHOD.

  METHOD ausliefern.
    TRY.
        mo_verkauf->ausliefern( iv_auftrag_id ).
        MESSAGE |Auftrag { iv_auftrag_id } ausgeliefert| TYPE 'S'.
      CATCH zcx_ah_error INTO DATA(lx).
        MESSAGE lx->get_text( ) TYPE 'E'.
    ENDTRY.
  ENDMETHOD.

  METHOD rechnung_erstellen.
    TRY.
        DATA(lv_rechnung_id) = mo_rechnung->create_from_auftrag( iv_auftrag_id ).
        MESSAGE |Rechnung { lv_rechnung_id } erstellt| TYPE 'S'.
      CATCH zcx_ah_error INTO DATA(lx).
        MESSAGE lx->get_text( ) TYPE 'E'.
    ENDTRY.
  ENDMETHOD.

ENDCLASS.
