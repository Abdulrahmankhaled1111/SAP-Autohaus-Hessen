@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Lieferant Consumption View'
define root view entity ZC_AH_Lieferant
  provider contract transactional_query
  as projection on ZI_AH_Lieferant
{
  key LieferantId,
      Name,
      Strasse,
      Plz,
      Ort,
      Telefon,
      Email,
      Aktiv
}
