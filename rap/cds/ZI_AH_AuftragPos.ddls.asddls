@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Auftrag Position Interface View'
define view entity ZI_AH_AuftragPos
  as select from zah_auftrag_pos as Pos
  association [0..1] to ZI_AH_Fahrzeug as _Fahrzeug
    on Pos.fahrzeug_id = _Fahrzeug.FahrzeugId
{
  key auftrag_id    as AuftragId,
  key pos_nr        as PosNr,
      fahrzeug_id   as FahrzeugId,
      beschreibung  as Beschreibung,
      verkaufspreis as Verkaufspreis,
      rabatt        as Rabatt,
      netto         as Netto,

      _Fahrzeug
}
