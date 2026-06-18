CLASS zbp_ah_fahrzeug DEFINITION PUBLIC ABSTRACT FINAL FOR BEHAVIOR OF zc_ah_fahrzeug.
ENDCLASS.

CLASS zbp_ah_fahrzeug IMPLEMENTATION.
ENDCLASS.

CLASS lhc_fahrzeug DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS reservieren FOR MODIFY
      IMPORTING keys FOR ACTION fahrzeug~reservieren RESULT result.
    METHODS freigeben FOR MODIFY
      IMPORTING keys FOR ACTION fahrzeug~freigeben RESULT result.
    METHODS ausliefern FOR MODIFY
      IMPORTING keys FOR ACTION fahrzeug~ausliefern
      IMPORTING parameters FOR ACTION fahrzeug~ausliefern RESULT result.
    METHODS get_instance_features FOR INSTANCE FEATURES
      IMPORTING keys REQUEST requested_features FOR fahrzeug RESULT result.
ENDCLASS.

CLASS lhc_fahrzeug IMPLEMENTATION.

  METHOD reservieren.
    DATA: lo_fahrz TYPE REF TO zcl_ah_fahrzeug.
    CREATE OBJECT lo_fahrz.

    LOOP AT keys INTO DATA(ls_key).
      TRY.
          lo_fahrz->reservieren( ls_key-FahrzeugId ).
          APPEND VALUE #( %tky = ls_key-%tky %param = lo_fahrz->read( ls_key-FahrzeugId ) ) TO result.
        CATCH zcx_ah_error INTO DATA(lx).
          APPEND VALUE #( %tky = ls_key-%tky %fail = lx ) TO failed.
      ENDTRY.
    ENDLOOP.
  ENDMETHOD.

  METHOD freigeben.
    DATA: lo_fahrz TYPE REF TO zcl_ah_fahrzeug.
    CREATE OBJECT lo_fahrz.

    LOOP AT keys INTO DATA(ls_key).
      TRY.
          lo_fahrz->set_status(
            iv_fahrzeug_id  = ls_key-FahrzeugId
            iv_neuer_status = 'BESTAND'
            iv_bemerkung    = 'Reservierung aufgehoben'
          ).
          APPEND VALUE #( %tky = ls_key-%tky %param = lo_fahrz->read( ls_key-FahrzeugId ) ) TO result.
        CATCH zcx_ah_error INTO DATA(lx).
          APPEND VALUE #( %tky = ls_key-%tky %fail = lx ) TO failed.
      ENDTRY.
    ENDLOOP.
  ENDMETHOD.

  METHOD ausliefern.
    DATA: lo_fahrz TYPE REF TO zcl_ah_fahrzeug.
    CREATE OBJECT lo_fahrz.

    LOOP AT keys INTO DATA(ls_key).
      READ TABLE parameters INTO DATA(ls_param) WITH KEY %tky = ls_key-%tky.
      TRY.
          lo_fahrz->verkaufen( ls_key-FahrzeugId ).
          lo_fahrz->ausliefern(
            iv_fahrzeug_id = ls_key-FahrzeugId
            iv_km_stand    = COND #( WHEN ls_param IS NOT INITIAL THEN ls_param-km_stand )
          ).
          APPEND VALUE #( %tky = ls_key-%tky %param = lo_fahrz->read( ls_key-FahrzeugId ) ) TO result.
        CATCH zcx_ah_error INTO DATA(lx).
          APPEND VALUE #( %tky = ls_key-%tky %fail = lx ) TO failed.
      ENDTRY.
    ENDLOOP.
  ENDMETHOD.

  METHOD get_instance_features.
    READ ENTITIES OF zc_ah_fahrzeug IN LOCAL MODE
      ENTITY fahrzeug
      FIELDS ( Status ) WITH CORRESPONDING #( keys )
      RESULT DATA(lt_fahrzeug).

    LOOP AT lt_fahrzeug INTO DATA(ls_f).
      DATA(ls_feat) = VALUE #( %key = ls_f-%tky ).
      CASE ls_f-Status.
        WHEN 'BESTAND'.
          ls_feat-reservieren = if_abap_behv=>fc-o-enabled.
        WHEN 'RESV'.
          ls_feat-freigeben = if_abap_behv=>fc-o-enabled.
          ls_feat-ausliefern = if_abap_behv=>fc-o-enabled.
        WHEN OTHERS.
      ENDCASE.
      APPEND ls_feat TO result.
    ENDLOOP.
  ENDMETHOD.

ENDCLASS.

CLASS lsc_fahrzeug DEFINITION INHERITING FROM cl_abap_behavior_saver.
  PROTECTED SECTION.
    METHODS save_modified REDEFINITION.
    METHODS cleanup_finalize REDEFINITION.
ENDCLASS.

CLASS lsc_fahrzeug IMPLEMENTATION.

  METHOD save_modified.
    DATA: lo_fahrz TYPE REF TO zcl_ah_fahrzeug.
    CREATE OBJECT lo_fahrz.

    READ ENTITIES OF zc_ah_fahrzeug IN LOCAL MODE
      ENTITY fahrzeug
      ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(lt_create)
      FAILED DATA(lt_failed)
      REPORTED DATA(lt_reported).

    LOOP AT lt_create INTO DATA(ls_new) WHERE %is_draft = abap_false.
      IF ls_new-FahrzeugId IS INITIAL.
        DATA(ls_db) = CORRESPONDING zah_fahrzeug( ls_new ).
        lo_fahrz->create( ls_db ).
      ELSE.
        lo_fahrz->update( CORRESPONDING zah_fahrzeug( ls_new ) ).
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

  METHOD cleanup_finalize.
  ENDMETHOD.

ENDCLASS.
