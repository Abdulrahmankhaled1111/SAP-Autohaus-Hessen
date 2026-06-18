*&---------------------------------------------------------------------*
*& Report: ZAH_R_DEMO_DATEN
*& Beispieldaten für Autohaus HESSEN einspielen
*& Einmalig ausführen nach Installation
*&---------------------------------------------------------------------*
REPORT zah_r_demo_daten.

CLASS lcl_demo DEFINITION CREATE PRIVATE.
  PUBLIC SECTION.
    CLASS-METHODS run.
  PRIVATE SECTION.
    CLASS-METHODS create_lieferanten.
    CLASS-METHODS create_mitarbeiter.
    CLASS-METHODS create_kunden.
    CLASS-METHODS create_fahrzeuge.
ENDCLASS.

START-OF-SELECTION.
  lcl_demo=>run( ).

CLASS lcl_demo IMPLEMENTATION.

  METHOD run.
    WRITE: / '=== Autohaus HESSEN – Demo-Daten einspielen ==='.
    SKIP 1.

    create_lieferanten( ).
    create_mitarbeiter( ).
    create_kunden( ).
    create_fahrzeuge( ).

    COMMIT WORK.
    SKIP 1.
    WRITE: / 'Demo-Daten erfolgreich eingespielt!'.
    WRITE: / 'Starte mit Transaktion ZAH_BEST für die Bestandsübersicht.'.
  ENDMETHOD.

  METHOD create_lieferanten.
    DATA: lt_lief TYPE TABLE OF zah_lieferant.

    lt_lief = VALUE #(
      ( lieferant_id = 'L000000001' name = 'Volkswagen AG'
        strasse = 'Berliner Ring 2' plz = '38440' ort = 'Wolfsburg'
        telefon = '05361-90' email = 'info@volkswagen.de' aktiv = 'X'
        erstellt_am = sy-datum erstellt_von = sy-uname )
      ( lieferant_id = 'L000000002' name = 'BMW AG'
        strasse = 'Petuelring 130' plz = '80788' ort = 'München'
        telefon = '089-382-01' email = 'info@bmw.de' aktiv = 'X'
        erstellt_am = sy-datum erstellt_von = sy-uname )
      ( lieferant_id = 'L000000003' name = 'Mercedes-Benz AG'
        strasse = 'Mercedesstr. 120' plz = '70372' ort = 'Stuttgart'
        telefon = '0711-170' email = 'info@mercedes-benz.de' aktiv = 'X'
        erstellt_am = sy-datum erstellt_von = sy-uname )
    ).

    INSERT zah_lieferant FROM TABLE lt_lief ACCEPTING DUPLICATE KEYS.
    WRITE: / 'Lieferanten:', lines( lt_lief ), 'angelegt'.
  ENDMETHOD.

  METHOD create_mitarbeiter.
    DATA: lt_ma TYPE TABLE OF zah_mitarbeiter.

    lt_ma = VALUE #(
      ( mitarbeiter_id = 'M000000001' vorname = 'Max' nachname = 'Müller'
        abteilung = 'Verkauf' position = 'Verkaufsberater'
        telefon = '069-123456' email = 'mueller@autohaus-hessen.de' aktiv = 'X' )
      ( mitarbeiter_id = 'M000000002' vorname = 'Anna' nachname = 'Schmidt'
        abteilung = 'Verkauf' position = 'Verkaufsberaterin'
        telefon = '069-123457' email = 'schmidt@autohaus-hessen.de' aktiv = 'X' )
      ( mitarbeiter_id = 'M000000003' vorname = 'Peter' nachname = 'Weber'
        abteilung = 'Einkauf' position = 'Einkäufer'
        telefon = '069-123458' email = 'weber@autohaus-hessen.de' aktiv = 'X' )
    ).

    INSERT zah_mitarbeiter FROM TABLE lt_ma ACCEPTING DUPLICATE KEYS.
    WRITE: / 'Mitarbeiter:', lines( lt_ma ), 'angelegt'.
  ENDMETHOD.

  METHOD create_kunden.
    DATA: lo_kunde TYPE REF TO zcl_ah_kunde.

    CREATE OBJECT lo_kunde.

    DATA(lt_kunden) = VALUE zcl_ah_kunde=>tt_kunde(
      ( kundentyp = 'P' anrede = 'Herr' nachname = 'Fischer' vorname = 'Thomas'
        strasse = 'Hauptstraße 10' plz = '60313' ort = 'Frankfurt'
        telefon = '069-9876543' email = 'fischer@email.de' )
      ( kundentyp = 'P' anrede = 'Frau' nachname = 'Becker' vorname = 'Sabine'
        strasse = 'Gartenweg 5' plz = '60322' ort = 'Frankfurt'
        telefon = '069-9876544' email = 'becker@email.de' )
      ( kundentyp = 'G' anrede = 'Firma' nachname = 'Logistik GmbH' vorname = ''
        strasse = 'Industriepark 1' plz = '65428' ort = 'Rüsselsheim'
        telefon = '06142-12345' email = 'info@logistik-gmbh.de' )
    ).

    LOOP AT lt_kunden INTO DATA(ls_k).
      TRY.
          lo_kunde->create( ls_k ).
        CATCH zcx_ah_error.
      ENDTRY.
    ENDLOOP.

    WRITE: / 'Kunden:', lines( lt_kunden ), 'angelegt'.
  ENDMETHOD.

  METHOD create_fahrzeuge.
    DATA: lo_fahrz TYPE REF TO zcl_ah_fahrzeug.

    CREATE OBJECT lo_fahrz.

    DATA(lt_fahrzeuge) = VALUE zcl_ah_fahrzeug=>tt_fahrzeug(
      ( fin = 'WVWZZZ3CZWE123456' marke_id = '0001' modell = 'Golf 8 GTI'
        baujahr = '2024' farbe = 'Rot' km_stand = 15
        kraftstoff = 'Benzin' getriebe = 'Automatik' leistung_kw = 180
        einkaufspreis = '28500.00' verkaufspreis = '34900.00'
        lieferant_id = 'L000000001' )
      ( fin = 'WBA8E9G50JNT12345' marke_id = '0002' modell = '320d Touring'
        baujahr = '2023' farbe = 'Schwarz' km_stand = 25000
        kraftstoff = 'Diesel' getriebe = 'Automatik' leistung_kw = 140
        einkaufspreis = '32000.00' verkaufspreis = '38900.00'
        lieferant_id = 'L000000002' )
      ( fin = 'WDD2130041A123456' marke_id = '0003' modell = 'E 220 d'
        baujahr = '2022' farbe = 'Silber' km_stand = 45000
        kraftstoff = 'Diesel' getriebe = 'Automatik' leistung_kw = 143
        einkaufspreis = '35000.00' verkaufspreis = '42900.00'
        lieferant_id = 'L000000003' )
      ( fin = 'WAUZZZF41MA123456' marke_id = '0004' modell = 'A4 Avant 40 TDI'
        baujahr = '2023' farbe = 'Blau' km_stand = 18000
        kraftstoff = 'Diesel' getriebe = 'Automatik' leistung_kw = 150
        einkaufspreis = '30000.00' verkaufspreis = '36900.00'
        lieferant_id = 'L000000001' )
      ( fin = 'WVWZZZ1KZMW123456' marke_id = '0001' modell = 'Tiguan R-Line'
        baujahr = '2024' farbe = 'Weiß' km_stand = 5
        kraftstoff = 'Benzin' getriebe = 'Automatik' leistung_kw = 162
        einkaufspreis = '35000.00' verkaufspreis = '42900.00'
        lieferant_id = 'L000000001' )
    ).

    LOOP AT lt_fahrzeuge INTO DATA(ls_f).
      TRY.
          lo_fahrz->create( ls_f ).
        CATCH zcx_ah_error.
      ENDTRY.
    ENDLOOP.

    WRITE: / 'Fahrzeuge:', lines( lt_fahrzeuge ), 'angelegt'.
  ENDMETHOD.

ENDCLASS.
