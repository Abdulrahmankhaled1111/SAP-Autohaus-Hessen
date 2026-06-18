CLASS zbp_ah_kunde DEFINITION PUBLIC ABSTRACT FINAL FOR BEHAVIOR OF zc_ah_kunde.
ENDCLASS.

CLASS zbp_ah_kunde IMPLEMENTATION.
ENDCLASS.

CLASS lhc_kunde DEFINITION INHERITING FROM cl_abap_behavior_handler.
  PRIVATE SECTION.
    METHODS get_instance_authorizations FOR INSTANCE AUTHORIZATION
      IMPORTING keys REQUEST requested_authorizations FOR kunde RESULT result.
ENDCLASS.

CLASS lhc_kunde IMPLEMENTATION.

  METHOD get_instance_authorizations.
    " Alle authentifizierten Benutzer dürfen Kunden verwalten
    result = VALUE #( FOR key IN keys
      ( %key = key
        %update = if_abap_behv=>auth-unrestricted
        %delete = if_abap_behv=>auth-unrestricted ) ).
  ENDMETHOD.

ENDCLASS.

CLASS lsc_kunde DEFINITION INHERITING FROM cl_abap_behavior_saver.
  PROTECTED SECTION.
    METHODS save_modified REDEFINITION.
ENDCLASS.

CLASS lsc_kunde IMPLEMENTATION.

  METHOD save_modified.
    DATA: lo_kunde TYPE REF TO zcl_ah_kunde.
    CREATE OBJECT lo_kunde.

    READ ENTITIES OF zc_ah_kunde IN LOCAL MODE
      ENTITY kunde
      ALL FIELDS WITH CORRESPONDING #( keys )
      RESULT DATA(lt_data).

    LOOP AT lt_data INTO DATA(ls_k).
      IF ls_k-KundeId IS INITIAL.
        lo_kunde->create( CORRESPONDING zah_kunde( ls_k ) ).
      ELSE.
        lo_kunde->update( CORRESPONDING zah_kunde( ls_k ) ).
      ENDIF.
    ENDLOOP.
  ENDMETHOD.

ENDCLASS.
