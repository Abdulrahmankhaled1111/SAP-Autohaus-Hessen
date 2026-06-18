managed implementation in class zbp_ah_auftrag unique;
strict ( 2 );

define behavior for ZC_AH_Auftrag alias Auftrag
persistent table zah_auftrag
lock master
authorization master ( instance )
{
  create;
  update;
  delete;

  association _Positionen { create; }

  field ( readonly ) AuftragId;
  field ( mandatory ) KundeId, Status;

  action ausliefern result [1] $self;
  action rechnungErstellen result [1] $self;

  mapping for zah_auftrag
  {
    AuftragId      = auftrag_id;
    AngebotId      = angebots_id;
    KundeId        = kunde_id;
    MitarbeiterId  = mitarbeiter_id;
    Auftragsdatum  = auftragsdatum;
    Liefertermin   = liefertermin;
    Status         = status;
    Netto          = netto;
    Rabatt         = rabatt;
    Mwst           = mwst;
    Brutto         = brutto;
    Anzahlung      = anzahlung;
    Waehrung       = waehrung;
    Bemerkung      = bemerkung;
  }
}

define behavior for ZC_AH_AuftragPos alias AuftragPos
persistent table zah_auftrag_pos
lock dependent by _Auftrag
authorization dependent by _Auftrag
{
  update;
  delete;
  association _Auftrag;

  field ( readonly ) AuftragId, PosNr;
  field ( mandatory ) FahrzeugId;

  mapping for zah_auftrag_pos
  {
    AuftragId    = auftrag_id;
    PosNr        = pos_nr;
    FahrzeugId   = fahrzeug_id;
    Beschreibung = beschreibung;
    Verkaufspreis = verkaufspreis;
    Rabatt       = rabatt;
    Netto        = netto;
  }
}
