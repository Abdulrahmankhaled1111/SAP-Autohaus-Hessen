@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Fahrzeug Interface View'
define view entity ZI_AH_Fahrzeug
  as select from zah_fahrzeug as Fahrzeug
  association [0..1] to ZI_AH_Marke as _Marke
    on Fahrzeug.marke_id = _Marke.MarkeId
  association [0..1] to ZI_AH_Lieferant as _Lieferant
    on Fahrzeug.lieferant_id = _Lieferant.LieferantId
{
  key fahrzeug_id     as FahrzeugId,
  key fin             as Fin,
      marke_id        as MarkeId,
      modell          as Modell,
      baujahr         as Baujahr,
      farbe           as Farbe,
      km_stand        as KmStand,
      kraftstoff      as Kraftstoff,
      getriebe        as Getriebe,
      leistung_kw     as LeistungKw,
      hubraum         as Hubraum,
      tuev_bis        as TuevBis,
      einkaufspreis   as Einkaufspreis,
      verkaufspreis   as Verkaufspreis,
      status          as Status,
      einkauf_id      as EinkaufId,
      lieferant_id    as LieferantId,
      eingangsdatum   as Eingangsdatum,
      auslieferdat    as Auslieferdat,
      kennzeichen     as Kennzeichen,
      bemerkung       as Bemerkung,
      erstellt_am     as ErstelltAm,
      erstellt_von    as ErstelltVon,

      _Marke,
      _Lieferant
}
