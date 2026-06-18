@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Bestandsübersicht Analytics'
@Analytics.dataCategory: #CUBE
@Analytics.internalName: #LOCAL
define view entity ZC_AH_Bestand
  as select from ZI_AH_Fahrzeug as F
  association [0..1] to ZI_AH_Marke as _Marke
    on F.marke_id = _Marke.MarkeId
{
  key F.fahrzeug_id   as FahrzeugId,
      F.fin           as Fin,
      F.marke_id      as MarkeId,
      _Marke.Bezeichnung as Marke,
      F.modell        as Modell,
      F.baujahr       as Baujahr,
      F.farbe         as Farbe,
      F.km_stand      as KmStand,
      F.kraftstoff    as Kraftstoff,
      @Semantics.amount.currencyCode: 'EUR'
      F.einkaufspreis as Einkaufspreis,
      @Semantics.amount.currencyCode: 'EUR'
      F.verkaufspreis as Verkaufspreis,
      F.status        as Status,
      F.eingangsdatum as Eingangsdatum,
      @Semantics.quantity.unitOfMeasure: 'DAY'
      cast( dats_days_between( F.eingangsdatum, $session.system_date ) as abap.int4 ) as TageImBestand
}
