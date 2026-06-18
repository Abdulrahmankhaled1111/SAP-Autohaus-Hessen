# Installation – Autohaus HESSEN SAP System

Schritt-für-Schritt-Anleitung zur Einrichtung in deinem SAP-System.

## Voraussetzungen

- SAP S/4HANA oder NetWeaver 7.50+
- Entwicklerberechtigung (`S_DEVELOP`, Objekttyp `PROG`, `FUGR`, `CLAS`)
- Custom-Namespace `ZAH` in SPRO freigeschaltet

---

## Schritt 1: Nachrichtenklasse anlegen (SE91)

| Nachrichtenklasse | `ZAH` |
|---|---|
| 001 | Nummernkreis für &1 nicht gefunden |
| 002 | Fahrzeug &1 nicht gefunden |
| 003 | Statusübergang nach &1 nicht erlaubt |
| 004 | Datenbankupdate fehlgeschlagen |
| 005 | Kunde &1 nicht gefunden |

---

## Schritt 2: Domänen anlegen (SE11)

Reihenfolge beachten – zuerst Domänen, dann Datenelemente:

1. `ZAH_D_STATUS` – siehe `abap/domains/ZAH_DOMAINS.txt`
2. `ZAH_D_KUNDENTYP`
3. `ZAH_D_ANREDE`
4. `ZAH_D_KRAFTSTOFF`
5. `ZAH_D_WAEHRUNG`

Datenelemente danach anlegen (ebenfalls in `ZAH_DOMAINS.txt`).

---

## Schritt 3: Tabellen anlegen (SE11)

**Reihenfolge** (wegen Fremdschlüsseln):

```
1. ZAH_MARKE
2. ZAH_LIEFERANT
3. ZAH_KUNDE
4. ZAH_MITARBEITER
5. ZAH_NUMMERNKREIS
6. ZAH_KONFIG
7. ZAH_EINKAUF        → ZAH_EINKAUF_POS
8. ZAH_FAHRZEUG
9. ZAH_FAHRZEUG_HIST
10. ZAH_ANGEBOT       → ZAH_ANGEBOT_POS
11. ZAH_AUFTRAG       → ZAH_AUFTRAG_POS
12. ZAH_RECHNUNG      → ZAH_RECHNUNG_POS
13. ZAH_ZAHLUNG
```

Für jede Tabelle:
1. SE11 → Datenbanktabelle → Anlegen
2. Felder aus `abap/tables/*.txt` übernehmen
3. Technische Einstellungen: Tabellenart `TRANSP`, Pufferung `vollständig gepuffert`
4. Aktivieren (Strg+F3)

---

## Schritt 4: Stammdaten einspielen (SM30 / SE16)

### ZAH_NUMMERNKREIS

| OBJEKT_TYP | PREFIX | AKTUELLE_NR | BESCHREIBUNG |
|---|---|---|---|
| KUNDE | K | 0000000000 | Kundennummern |
| FAHRZEUG | F | 0000000000 | Fahrzeug-IDs |
| EINKAUF | E | 0000000000 | Einkaufsaufträge |
| ANGEBOT | A | 0000000000 | Angebote |
| AUFTRAG | V | 0000000000 | Verkaufsaufträge |
| RECHNUNG | R | 0000000000 | Rechnungen |
| ZAHLUNG | Z | 0000000000 | Zahlungen |
| LIEFERANT | L | 0000000000 | Lieferanten |

### ZAH_KONFIG

| PARAM | WERT |
|---|---|
| FIRMA_NAME | Autohaus HESSEN GmbH |
| FIRMA_STRASSE | Musterstraße 1 |
| FIRMA_PLZ | 60311 |
| FIRMA_ORT | Frankfurt am Main |
| MWST_SATZ | 19.00 |
| WAEHRUNG | EUR |
| ZAHLUNGSZIEL | 14 |

### ZAH_MARKE (Beispieldaten)

| MARKE_ID | BEZEICHNUNG | HERKUNFT |
|---|---|---|
| 0001 | Volkswagen | Deutschland |
| 0002 | BMW | Deutschland |
| 0003 | Mercedes-Benz | Deutschland |
| 0004 | Audi | Deutschland |

---

## Schritt 5: ABAP-Klassen anlegen (SE24)

Reihenfolge:

```
1. ZCX_AH_ERROR        (Exception – zuerst!)
2. ZCL_AH_NUMMERNKREIS
3. ZCL_AH_FAHRZEUG
4. ZCL_AH_KUNDE
5. ZCL_AH_EINKAUF
6. ZCL_AH_VERKAUF
7. ZCL_AH_RECHNUNG
```

Für jede Klasse:
1. SE24 → Klasse anlegen → Name eingeben
2. Code aus `abap/classes/*.abap` kopieren
3. Aktivieren

---

## Schritt 6: Programme anlegen (SE38)

| Programm | Datei | Beschreibung |
|---|---|---|
| `ZAH_R_FAHRZEUG_ALV` | `ZAH_R_FAHRZEUG_ALV.abap` | Fahrzeugverwaltung |
| `ZAH_R_KUNDE_ALV` | `ZAH_R_KUNDE_ALV.abap` | Kundenverwaltung |
| `ZAH_R_BESTAND` | `ZAH_R_BESTAND.abap` | Bestandsübersicht |
| `ZAH_R_UMSATZ` | `ZAH_R_UMSATZ.abap` | Umsatzbericht |
| `ZAH_R_VERKAUF` | `ZAH_R_VERKAUF.abap` | Verkaufsprozess |

---

## Schritt 7: Transaktionen anlegen (SE93)

| Transaktion | Programm | Text |
|---|---|---|
| `ZAH_FAHR` | `ZAH_R_FAHRZEUG_ALV` | Fahrzeugverwaltung |
| `ZAH_KUND` | `ZAH_R_KUNDE_ALV` | Kundenverwaltung |
| `ZAH_BEST` | `ZAH_R_BESTAND` | Bestandsübersicht |
| `ZAH_UMS` | `ZAH_R_UMSATZ` | Umsatzbericht |
| `ZAH_VERK` | `ZAH_R_VERKAUF` | Verkaufsprozess |
| `ZAH_EINK` | `ZAH_R_EINKAUF` | Einkauf (noch anzulegen) |
| `ZAH_RECH` | `ZAH_R_RECHNUNG` | Rechnungen (noch anzulegen) |

In SE93: Transaktion anlegen → Dialogtransaktion → Report-Programm verknüpfen.

---

## Schritt 8: Testlauf – Kompletter Prozess

```
1. ZAH_EINK  → Einkaufsauftrag anlegen, Fahrzeug einbuchen
2. ZAH_BEST  → Fahrzeug im Bestand prüfen
3. ZAH_KUND  → Kunden anlegen
4. ZAH_VERK  → Angebot erstellen und annehmen
5. ZAH_VERK  → Auftrag ausliefern
6. ZAH_VERK  → Rechnung erstellen
7. ZAH_UMS   → Umsatz prüfen
```

---

## Geschätzter Aufwand

| Phase | Aufwand |
|---|---|
| Tabellen + Domänen | 2–3 Stunden |
| Klassen | 2–3 Stunden |
| Programme + Transaktionen | 2–3 Stunden |
| Testen + Fehlerbehebung | 2–4 Stunden |
| **Gesamt** | **1–2 Arbeitstage** |

---

## Nächste Schritte (optional)

- [ ] SAP GUI Dynpros für Eingabemasken (statt Selektionsbild)
- [ ] Fiori/SAPUI5 App für moderne Oberfläche
- [ ] Excel-Export mit `abap2xlsx`
- [ ] Berechtigungsrollen (`PFCG`)
- [ ] Werkstatt-Modul (Service/Reparatur)
- [ ] Finanzierungsrechner
