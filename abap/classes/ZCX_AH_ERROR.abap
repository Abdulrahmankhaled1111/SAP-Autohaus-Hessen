*&---------------------------------------------------------------------*
*& Klasse: ZCX_AH_ERROR
*& Zentrale Exception-Klasse für Autohaus HESSEN
*&---------------------------------------------------------------------*
CLASS zcx_ah_error DEFINITION
  PUBLIC
  INHERITING FROM cx_static_check
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_t100_message.

    CONSTANTS:
      BEGIN OF nummernkreis_not_found,
        msgid TYPE symsgid VALUE 'ZAH',
        msgno TYPE symsgno VALUE '001',
        attr1 TYPE scx_attrname VALUE 'MV_OBJEKT',
        attr2 TYPE scx_attrname VALUE '',
        attr3 TYPE scx_attrname VALUE '',
        attr4 TYPE scx_attrname VALUE '',
      END OF nummernkreis_not_found,

      BEGIN OF fahrzeug_not_found,
        msgid TYPE symsgid VALUE 'ZAH',
        msgno TYPE symsgno VALUE '002',
        attr1 TYPE scx_attrname VALUE 'MV_FAHRZEUG_ID',
        attr2 TYPE scx_attrname VALUE '',
        attr3 TYPE scx_attrname VALUE '',
        attr4 TYPE scx_attrname VALUE '',
      END OF fahrzeug_not_found,

      BEGIN OF status_invalid,
        msgid TYPE symsgid VALUE 'ZAH',
        msgno TYPE symsgno VALUE '003',
        attr1 TYPE scx_attrname VALUE 'MV_STATUS',
        attr2 TYPE scx_attrname VALUE '',
        attr3 TYPE scx_attrname VALUE '',
        attr4 TYPE scx_attrname VALUE '',
      END OF status_invalid,

      BEGIN OF update_failed,
        msgid TYPE symsgid VALUE 'ZAH',
        msgno TYPE symsgno VALUE '004',
        attr1 TYPE scx_attrname VALUE '',
        attr2 TYPE scx_attrname VALUE '',
        attr3 TYPE scx_attrname VALUE '',
        attr4 TYPE scx_attrname VALUE '',
      END OF update_failed,

      BEGIN OF kunde_not_found,
        msgid TYPE symsgid VALUE 'ZAH',
        msgno TYPE symsgno VALUE '005',
        attr1 TYPE scx_attrname VALUE 'MV_KUNDE_ID',
        attr2 TYPE scx_attrname VALUE '',
        attr3 TYPE scx_attrname VALUE '',
        attr4 TYPE scx_attrname VALUE '',
      END OF kunde_not_found.

    DATA:
      mv_objekt      TYPE char10,
      mv_fahrzeug_id TYPE char10,
      mv_kunde_id    TYPE char10,
      mv_status      TYPE char10.

    METHODS constructor
      IMPORTING
        textid   LIKE if_t100_message=>t100key OPTIONAL
        previous LIKE previous OPTIONAL
        mv_objekt TYPE char10 OPTIONAL
        mv_fahrzeug_id TYPE char10 OPTIONAL
        mv_kunde_id TYPE char10 OPTIONAL
        mv_status TYPE char10 OPTIONAL.

  PROTECTED SECTION.
  PRIVATE SECTION.

ENDCLASS.

CLASS zcx_ah_error IMPLEMENTATION.

  METHOD constructor.
    super->constructor( previous = previous ).
    me->mv_objekt = mv_objekt.
    me->mv_fahrzeug_id = mv_fahrzeug_id.
    me->mv_kunde_id = mv_kunde_id.
    me->mv_status = mv_status.
    CLEAR me->textid.
    IF textid IS INITIAL.
      if_t100_message=>t100key = if_t100_message=>default_textid.
    ELSE.
      if_t100_message=>t100key = textid.
    ENDIF.
  ENDMETHOD.

ENDCLASS.
