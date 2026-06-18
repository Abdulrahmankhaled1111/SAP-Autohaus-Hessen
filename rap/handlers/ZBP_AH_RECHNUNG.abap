CLASS zbp_ah_rechnung DEFINITION PUBLIC ABSTRACT FINAL FOR BEHAVIOR OF zc_ah_rechnung.
ENDCLASS.

CLASS zbp_ah_rechnung IMPLEMENTATION.
ENDCLASS.

CLASS lhc_rechnung DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS zahlungErfassen FOR MODIFY
      IMPORTING keys FOR ACTION rechnung~zahlungErfassen
      IMPORTING parameters FOR ACTION rechnung~zahlungErfassen RESULT result.
    METHODS get_instance_features FOR INSTANCE FEATURES
      IMPORTING keys REQUEST requested_features FOR rechnung RESULT result.
ENDCLASS.

CLASS lhc_rechnung IMPLEMENTATION.

  METHOD zahlungErfassen.
    DATA: lo_rechnung TYPE REF TO zcl_ah_rechnung.
    CREATE OBJECT lo_rechnung.

    LOOP AT keys INTO DATA(ls_key).
      READ TABLE parameters INTO DATA(ls_param) WITH KEY %tky = ls_key-%tky.
      TRY.
          lo_rechnung->erfasse_zahlung(
            iv_rechnung_id  = ls_key-RechnungId
            iv_betrag       = ls_param-betrag
            iv_zahlungsart  = ls_param-zahlungsart
            iv_referenz     = ls_param-referenz
          ).
          READ ENTITIES OF zc_ah_rechnung IN LOCAL MODE
            ENTITY rechnung
            ALL FIELDS WITH VALUE #( ( %tky = ls_key-%tky ) )
            RESULT DATA(lt_result).
          APPEND VALUE #( %tky = ls_key-%tky %param = lt_result[ 1 ] ) TO result.
        CATCH zcx_ah_error INTO DATA(lx).
          APPEND VALUE #( %tky = ls_key-%tky %fail = lx ) TO failed.
      ENDTRY.
    ENDLOOP.
  ENDMETHOD.

  METHOD get_instance_features.
    READ ENTITIES OF zc_ah_rechnung IN LOCAL MODE
      ENTITY rechnung
      FIELDS ( Status ) WITH CORRESPONDING #( keys )
      RESULT DATA(lt_rech).

    LOOP AT lt_rech INTO DATA(ls_r).
      DATA(ls_feat) = VALUE #( %key = ls_r-%tky ).
      IF ls_r-Status = 'OFFEN' OR ls_r-Status = 'TEIL'.
        ls_feat-zahlungErfassen = if_abap_behv=>fc-o-enabled.
      ENDIF.
      APPEND ls_feat TO result.
    ENDLOOP.
  ENDMETHOD.

ENDCLASS.
