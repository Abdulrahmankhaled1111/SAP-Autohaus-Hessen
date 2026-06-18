@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Kunde Interface View'
define view entity ZI_AH_Kunde
  as select from zah_kunde
{
  key kunde_id      as KundeId,
      kundentyp     as Kundentyp,
      anrede        as Anrede,
      nachname      as Nachname,
      vorname       as Vorname,
      strasse       as Strasse,
      plz           as Plz,
      ort           as Ort,
      land          as Land,
      telefon       as Telefon,
      mobil         as Mobil,
      email         as Email,
      geburtsdat    as Geburtsdat,
      steuernr      as Steuernr,
      bemerkung     as Bemerkung,
      aktiv         as Aktiv,
      erstellt_am   as ErstelltAm,
      erstellt_von  as ErstelltVon
}
