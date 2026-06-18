managed implementation in class zbp_ah_kunde unique;
strict ( 2 );

define behavior for ZC_AH_Kunde alias Kunde
persistent table zah_kunde
lock master
authorization master ( instance )
{
  create;
  update;
  delete;

  field ( readonly ) KundeId, ErstelltAm, ErstelltVon;
  field ( mandatory ) Nachname, Kundentyp;

  mapping for zah_kunde
  {
    KundeId     = kunde_id;
    Kundentyp   = kundentyp;
    Anrede      = anrede;
    Nachname    = nachname;
    Vorname     = vorname;
    Strasse     = strasse;
    Plz         = plz;
    Ort         = ort;
    Land        = land;
    Telefon     = telefon;
    Mobil       = mobil;
    Email       = email;
    Geburtsdat  = geburtsdat;
    Steuernr    = steuernr;
    Bemerkung   = bemerkung;
    Aktiv       = aktiv;
    ErstelltAm  = erstellt_am;
    ErstelltVon = erstellt_von;
  }
}
