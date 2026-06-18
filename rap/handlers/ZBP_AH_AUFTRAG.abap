CLASS zbp_ah_auftrag DEFINITION PUBLIC ABSTRACT FINAL FOR BEHAVIOR OF zc_ah_auftrag.
ENDCLASS.

CLASS zbp_ah_auftrag IMPLEMENTATION.
ENDCLASS.

CLASS lhc_auftrag DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS ausliefern FOR MODIFY
      IMPORTING keys FOR ACTION auftrag~ausliefern RESULT result.
    METHODS rechnungErstellen FOR MODIFY
      IMPORTING keys FOR ACTION auftrag~rechnungErstellen RESULT result.
    METHODS get_instance_features FOR INSTANCE FEATURES
      IMPORTING keys REQUEST requested_features FOR auftrag RESULT result.
ENDCLASS.

CLASS lhc_auftrag IMPLEMENTATION.

  METHOD ausliefern.
    DATA: lo_verkauf TYPE REF TO zcl_ah_verkauf.
    CREATE OBJECT lo_verkauf.

    LOOP AT keys INTO DATA(ls_key).
      TRY.
          lo_verkauf->ausliefern( ls_key-AuftragId ).
          READ ENTITIES OF zc_ah_auftrag IN LOCAL MODE
            ENTITY auftrag
            ALL FIELDS WITH VALUE #( ( %tky = ls_key-%tky ) )
            RESULT DATA(lt_result).
          APPEND VALUE #( %tky = ls_key-%tky %param = lt_result[ 1 ] ) TO result.
        CATCH zcx_ah_error INTO DATA(lx).
          APPEND VALUE #( %tky = ls_key-%tky %fail = lx ) TO failed.
      ENDTRY.
    ENDLOOP.
  ENDMETHOD.

  METHOD rechnungErstellen.
    DATA: lo_rechnung TYPE REF TO zcl_ah_rechnung.
    CREATE OBJECT lo_rechnung.

    LOOP AT keys INTO DATA(ls_key).
      TRY.
          lo_rechnung->create_from_auftrag( ls_key-AuftragId ).
          READ ENTITIES OF zc_ah_auftrag IN LOCAL MODE
            ENTITY auftrag
            ALL FIELDS WITH VALUE #( ( %tky = ls_key-%tky ) )
            RESULT DATA(lt_result).
          APPEND VALUE #( %tky = ls_key-%tky %param = lt_result[ 1 ] ) TO result.
        CATCH zcx_ah_error INTO DATA(lx).
          APPEND VALUE #( %tky = ls_key-%tky %fail = lx ) TO failed.
      ENDTRY.
    ENDLOOP.
  ENDMETHOD.

  METHOD get_instance_features.
    READ ENTITIES OF zc_ah_auftrag IN LOCAL MODE
      ENTITY auftrag
      FIELDS ( Status ) WITH CORRESPONDING #( keys )
      RESULT DATA(lt_auftrag).

    LOOP AT lt_auftrag INTO DATA(ls_a).
      DATA(ls_feat) = VALUE #( %key = ls_a-%tky ).
      CASE ls_a-Status.
        WHEN 'OFFEN' OR 'RESV'.
          ls_feat-ausliefern = if_abap_behv=>fc-o-enabled.
        WHEN 'AUSG'.
          ls_feat-rechnungErstellen = if_abap_behv=>fc-o-enabled.
        WHEN OTHERS.
      ENDCASE.
      APPEND ls_feat TO result.
    ENDLOOP.
  ENDMETHOD.

ENDCLASS.

CLASS lsc_auftrag DEFINITION INHERITING FROM cl_abap_behavior_saver.
  PROTECTED SECTION.
    METHODS save_modified REDEFINITION.
ENDCLASS.

CLASS lsc_auftrag IMPLEMENTATION.

  METHOD save_modified.
    DATA: lo_verkauf TYPE REF TO zcl_ah_verkauf,
          lt_items   TYPE STANDARD TABLE OF zah_auftrag_pos.

    CREATE OBJECT lo_verkauf.

    READ ENTITIES OF zc_ah_auftrag IN LOCAL MODE
      ENTITY auftrag
      ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(lt_header)
      BY \_Positionen RESULT DATA(lt_pos).

    LOOP AT lt_header INTO DATA(ls_h).
      lt_items = CORRESPONDING #( lt_pos ).
      IF ls_h-AuftragId IS INITIAL.
        lo_verkauf->create_auftrag(
          is_header = CORRESPONDING zah_auftrag( ls_h )
          it_items  = lt_items
        ).
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

ENDCLASS.
