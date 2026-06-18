@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Rechnung Consumption View'
@Metadata.allowExtensions: true
define root view entity ZC_AH_Rechnung
  provider contract transactional_query
  as projection on ZI_AH_Rechnung
{
  key RechnungId,
      AuftragId,
      KundeId,
      Rechnungsdatum,
      Faelligkeit,
      Status,
      @Semantics.amount.currencyCode: 'EUR'
      Netto,
      MwstSatz,
      @Semantics.amount.currencyCode: 'EUR'
      Mwst,
      @Semantics.amount.currencyCode: 'EUR'
      Brutto,
      @Semantics.amount.currencyCode: 'EUR'
      Bezahlt,
      @Semantics.amount.currencyCode: 'EUR'
      Offen,
      Waehrung,

      _Kunde : redirected to ZC_AH_Kunde,
      _Auftrag : redirected to ZC_AH_Auftrag
}
