@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Marke Consumption View'
define root view entity ZC_AH_Marke
  provider contract transactional_query
  as projection on ZI_AH_Marke
{
  key MarkeId,
      Bezeichnung,
      Herkunft,
      Aktiv
}
