@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Marke Interface View'
define view entity ZI_AH_Marke
  as select from zah_marke
{
  key marke_id      as MarkeId,
      bezeichnung   as Bezeichnung,
      herkunft      as Herkunft,
      aktiv         as Aktiv
}
