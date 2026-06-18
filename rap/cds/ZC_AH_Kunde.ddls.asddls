@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Kunde Consumption View'
@Metadata.allowExtensions: true
define root view entity ZC_AH_Kunde
  provider contract transactional_query
  as projection on ZI_AH_Kunde
{
  key KundeId,
      Kundentyp,
      Anrede,
      Nachname,
      Vorname,
      Strasse,
      Plz,
      Ort,
      Land,
      Telefon,
      Mobil,
      Email,
      Geburtsdat,
      Steuernr,
      Bemerkung,
      Aktiv,
      ErstelltAm,
      ErstelltVon
}
