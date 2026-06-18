*&---------------------------------------------------------------------*
*& Report: ZAH_R_KUNDE_ALV
*& Kundenverwaltung mit ALV-Grid
*& Transaktion: ZAH_KUND (in SE93 anlegen)
*&---------------------------------------------------------------------*
REPORT zah_r_kunde_alv.

TABLES: zah_kunde.

SELECTION-SCREEN BEGIN OF BLOCK b1 WITH FRAME TITLE TEXT-001.
  PARAMETERS: p_name TYPE zah_kunde-nachname,
              p_ort  TYPE zah_kunde-ort,
              p_typ  TYPE zah_kunde-kundentyp AS LISTBOX
                VISIBLE LENGTH 20
                DEFAULT 'P'.
SELECTION-SCREEN END OF BLOCK b1.

SELECTION-SCREEN BEGIN OF BLOCK b2 WITH FRAME TITLE TEXT-002.
  PARAMETERS: p_neu RADIOBUTTON GROUP g1 DEFAULT 'X',
              p_aend RADIOBUTTON GROUP g1,
              p_anze RADIOBUTTON GROUP g1.
SELECTION-SCREEN END OF BLOCK b2.

CLASS lcl_kunde DEFINITION CREATE PRIVATE.
  PUBLIC SECTION.
    METHODS run
      IMPORTING
        iv_name TYPE zah_kunde-nachname
        iv_ort  TYPE zah_kunde-ort
        iv_typ  TYPE zah_kunde-kundentyp.
  PRIVATE SECTION.
    DATA: mo_kunde TYPE REF TO zcl_ah_kunde,
          mt_kunde TYPE STANDARD TABLE OF zah_kunde.

    METHODS search_kunden
      IMPORTING iv_name TYPE zah_kunde-nachname
                iv_ort  TYPE zah_kunde-ort.
    METHODS display_alv.
    METHODS create_kunde.
ENDCLASS.

INITIALIZATION.
  DATA: lt_values TYPE vrm_values,
        ls_value  TYPE vrm_value.
  lt_values = VALUE #(
    ( key = 'P' text = 'Privatkunde' )
    ( key = 'G' text = 'Gewerbekunde' ) ).
  CALL FUNCTION 'VRM_SET_VALUES'
    EXPORTING id = 'P_TYP' values = lt_values.

START-OF-SELECTION.
  DATA(lo_kunde) = NEW lcl_kunde( ).
  lo_kunde->run( iv_name = p_name iv_ort = p_ort iv_typ = p_typ ).

CLASS lcl_kunde IMPLEMENTATION.

  METHOD run.
    CREATE OBJECT mo_kunde.

    CASE 'X'.
      WHEN p_neu.
        create_kunde( ).
      WHEN p_aend.
        MESSAGE 'Kunde ändern – Funktion in Entwicklung' TYPE 'I'.
      WHEN p_anze.
        search_kunden( iv_name = iv_name iv_ort = iv_ort ).
        IF mt_kunde IS INITIAL.
          MESSAGE 'Keine Kunden gefunden' TYPE 'S' DISPLAY LIKE 'W'.
          RETURN.
        ENDIF.
        display_alv( ).
    ENDCASE.
  ENDMETHOD.

  METHOD search_kunden.
    DATA(lv_name) = COND string( WHEN iv_name IS NOT INITIAL THEN |%{ iv_name }%| ).
    DATA(lv_ort)  = COND string( WHEN iv_ort IS NOT INITIAL THEN |%{ iv_ort }%| ).
    mt_kunde = mo_kunde->search( iv_name = lv_name iv_ort = lv_ort ).
  ENDMETHOD.

  METHOD display_alv.
    DATA: lo_alv TYPE REF TO cl_salv_table.
    TRY.
        cl_salv_table=>factory(
          IMPORTING r_salv_table = lo_alv
          CHANGING  t_table      = mt_kunde ).
        lo_alv->get_functions( )->set_all( abap_true ).
        lo_alv->get_columns( )->set_optimize( abap_true ).
        lo_alv->display( ).
      CATCH cx_salv_msg INTO DATA(lx).
        MESSAGE lx->get_text( ) TYPE 'E'.
    ENDTRY.
  ENDMETHOD.

  METHOD create_kunde.
    " Dialog für Neuanlage – vereinfachte Version
    MESSAGE 'Kundenanlage: Nutzen Sie die Transaktion ZAH_KUND_NEU' TYPE 'I'.
  ENDMETHOD.

ENDCLASS.
