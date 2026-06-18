@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Fahrzeug Consumption View'
@Metadata.allowExtensions: true
define root view entity ZC_AH_Fahrzeug
  provider contract transactional_query
  as projection on ZI_AH_Fahrzeug
{
  key FahrzeugId,
  key Fin,
      @Consumption.valueHelpDefinition: [{
        entity: { name: 'ZC_AH_Marke', element: 'MarkeId' }
      }]
      MarkeId,
      Modell,
      Baujahr,
      Farbe,
      KmStand,
      Kraftstoff,
      Getriebe,
      LeistungKw,
      Hubraum,
      TuevBis,
      @Semantics.amount.currencyCode: 'EUR'
      Einkaufspreis,
      @Semantics.amount.currencyCode: 'EUR'
      Verkaufspreis,
      Status,
      EinkaufId,
      LieferantId,
      Eingangsdatum,
      Auslieferdat,
      Kennzeichen,
      Bemerkung,
      ErstelltAm,
      ErstelltVon,

      _Marke : redirected to ZC_AH_Marke,
      _Lieferant : redirected to ZC_AH_Lieferant
}
