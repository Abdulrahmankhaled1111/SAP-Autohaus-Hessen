@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Auftrag Position Consumption View'
define view entity ZC_AH_AuftragPos
  as projection on ZI_AH_AuftragPos
{
  key AuftragId,
  key PosNr,
      @Consumption.valueHelpDefinition: [{
        entity: { name: 'ZC_AH_Fahrzeug', element: 'FahrzeugId' }
      }]
      FahrzeugId,
      Beschreibung,
      @Semantics.amount.currencyCode: 'EUR'
      Verkaufspreis,
      @Semantics.amount.currencyCode: 'EUR'
      Rabatt,
      @Semantics.amount.currencyCode: 'EUR'
      Netto,

      _Fahrzeug : redirected to ZC_AH_Fahrzeug
}
