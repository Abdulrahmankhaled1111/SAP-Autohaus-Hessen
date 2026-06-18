@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Rechnung Interface View'
define view entity ZI_AH_Rechnung
  as select from zah_rechnung as Rechnung
  association [0..1] to ZI_AH_Kunde as _Kunde
    on Rechnung.kunde_id = _Kunde.KundeId
  association [0..1] to ZI_AH_Auftrag as _Auftrag
    on Rechnung.auftrag_id = _Auftrag.AuftragId
{
  key rechnung_id     as RechnungId,
      auftrag_id      as AuftragId,
      kunde_id        as KundeId,
      rechnungsdatum  as Rechnungsdatum,
      faelligkeit     as Faelligkeit,
      status          as Status,
      netto           as Netto,
      mwst_satz       as MwstSatz,
      mwst            as Mwst,
      brutto          as Brutto,
      bezahlt         as Bezahlt,
      offen           as Offen,
      waehrung        as Waehrung,

      _Kunde,
      _Auftrag
}
