@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Auftrag Consumption View'
@Metadata.allowExtensions: true
define root view entity ZC_AH_Auftrag
  provider contract transactional_query
  as projection on ZI_AH_Auftrag
{
  key AuftragId,
      AngebotId,
      @Consumption.valueHelpDefinition: [{
        entity: { name: 'ZC_AH_Kunde', element: 'KundeId' }
      }]
      KundeId,
      MitarbeiterId,
      Auftragsdatum,
      Liefertermin,
      Status,
      @Semantics.amount.currencyCode: 'EUR'
      Netto,
      @Semantics.amount.currencyCode: 'EUR'
      Rabatt,
      @Semantics.amount.currencyCode: 'EUR'
      Mwst,
      @Semantics.amount.currencyCode: 'EUR'
      Brutto,
      @Semantics.amount.currencyCode: 'EUR'
      Anzahlung,
      Waehrung,
      Bemerkung,

      _Kunde : redirected to ZC_AH_Kunde,
      _Positionen : redirected to child ZC_AH_AuftragPos
}
