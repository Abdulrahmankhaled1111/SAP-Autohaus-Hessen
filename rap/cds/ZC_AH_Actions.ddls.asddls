@EndUserText.label: 'Auslieferung Parameter'
define abstract entity ZC_AH_S_Auslieferung
{
  km_stand : abap.int4;
}

@EndUserText.label: 'Zahlung Parameter'
define abstract entity ZC_AH_S_Zahlung
{
  @Semantics.amount.currencyCode: 'EUR'
  betrag       : abap.curr(15,2);
  zahlungsart  : abap.char(10);
  referenz     : abap.char(30);
}
