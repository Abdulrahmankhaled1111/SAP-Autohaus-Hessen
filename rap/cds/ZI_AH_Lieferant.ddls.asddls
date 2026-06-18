@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Lieferant Interface View'
define view entity ZI_AH_Lieferant
  as select from zah_lieferant
{
  key lieferant_id  as LieferantId,
      name          as Name,
      strasse       as Strasse,
      plz           as Plz,
      ort           as Ort,
      telefon       as Telefon,
      email         as Email,
      aktiv         as Aktiv
}
