@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Umsatz Analytics'
@Analytics.dataCategory: #CUBE
define view entity ZC_AH_Umsatz
  as select from ZI_AH_Rechnung as R
  association [0..1] to ZI_AH_Kunde as _Kunde
    on R.kunde_id = _Kunde.KundeId
{
  key R.rechnung_id     as RechnungId,
      R.rechnungsdatum  as Rechnungsdatum,
      substring( cast( R.rechnungsdatum as abap.char( 8 ) ), 1, 6 ) as Periode,
      R.kunde_id        as KundeId,
      _Kunde.Nachname   as Kundenname,
      @Semantics.amount.currencyCode: 'EUR'
      R.netto           as Netto,
      @Semantics.amount.currencyCode: 'EUR'
      R.mwst            as Mwst,
      @Semantics.amount.currencyCode: 'EUR'
      R.brutto          as Brutto,
      R.status          as Status
}
