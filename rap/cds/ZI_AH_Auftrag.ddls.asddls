@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Auftrag Interface View'
define view entity ZI_AH_Auftrag
  as select from zah_auftrag as Auftrag
  association [0..1] to ZI_AH_Kunde as _Kunde
    on Auftrag.kunde_id = _Kunde.KundeId
  association [0..*] to ZI_AH_AuftragPos as _Positionen
    on Auftrag.auftrag_id = _Positionen.AuftragId
{
  key auftrag_id      as AuftragId,
      angebots_id     as AngebotId,
      kunde_id        as KundeId,
      mitarbeiter_id  as MitarbeiterId,
      auftragsdatum   as Auftragsdatum,
      liefertermin    as Liefertermin,
      status          as Status,
      netto           as Netto,
      rabatt          as Rabatt,
      mwst            as Mwst,
      brutto          as Brutto,
      anzahlung       as Anzahlung,
      waehrung        as Waehrung,
      bemerkung       as Bemerkung,

      _Kunde,
      _Positionen
}
