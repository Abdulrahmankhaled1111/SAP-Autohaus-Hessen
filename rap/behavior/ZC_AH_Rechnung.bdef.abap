managed implementation in class zbp_ah_rechnung unique;
strict ( 2 );

define behavior for ZC_AH_Rechnung alias Rechnung
persistent table zah_rechnung
lock master
authorization master ( instance )
{
  create;
  update;

  field ( readonly ) RechnungId;
  field ( mandatory ) AuftragId, KundeId;

  action zahlungErfassen parameter ZC_AH_S_Zahlung result [1] $self;

  mapping for zah_rechnung
  {
    RechnungId     = rechnung_id;
    AuftragId      = auftrag_id;
    KundeId        = kunde_id;
    Rechnungsdatum = rechnungsdatum;
    Faelligkeit    = faelligkeit;
    Status         = status;
    Netto          = netto;
    MwstSatz       = mwst_satz;
    Mwst           = mwst;
    Brutto         = brutto;
    Bezahlt        = bezahlt;
    Offen          = offen;
    Waehrung       = waehrung;
  }
}
