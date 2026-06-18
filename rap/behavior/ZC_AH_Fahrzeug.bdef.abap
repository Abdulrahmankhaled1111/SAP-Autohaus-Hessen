managed implementation in class zbp_ah_fahrzeug unique;
strict ( 2 );
with draft;

define behavior for ZC_AH_Fahrzeug alias Fahrzeug
persistent table zah_fahrzeug
draft table zah_fahrzeug_d
lock master
authorization master ( instance )
etag master ErstelltAm
{
  create;
  update;
  delete;

  field ( readonly ) FahrzeugId, Fin, ErstelltAm, ErstelltVon;
  field ( mandatory ) Modell, MarkeId, Status;

  action reservieren result [1] $self;
  action freigeben result [1] $self;
  action ausliefern parameter ZC_AH_S_Auslieferung result [1] $self;

  mapping for zah_fahrzeug
  {
    FahrzeugId    = fahrzeug_id;
    Fin           = fin;
    MarkeId       = marke_id;
    Modell        = modell;
    Baujahr       = baujahr;
    Farbe         = farbe;
    KmStand       = km_stand;
    Kraftstoff    = kraftstoff;
    Getriebe      = getriebe;
    LeistungKw    = leistung_kw;
    Hubraum       = hubraum;
    TuevBis       = tuev_bis;
    Einkaufspreis = einkaufspreis;
    Verkaufspreis = verkaufspreis;
    Status        = status;
    EinkaufId     = einkauf_id;
    LieferantId   = lieferant_id;
    Eingangsdatum = eingangsdatum;
    Auslieferdat  = auslieferdat;
    Kennzeichen   = kennzeichen;
    Bemerkung     = bemerkung;
    ErstelltAm    = erstellt_am;
    ErstelltVon   = erstellt_von;
  }
}
