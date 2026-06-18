# Datenmodell – Autohaus HESSEN

## ER-Diagramm

```mermaid
erDiagram
    ZAH_LIEFERANT ||--o{ ZAH_EINKAUF : "liefert"
    ZAH_EINKAUF ||--|{ ZAH_EINKAUF_POS : "enthält"
    ZAH_EINKAUF_POS ||--o| ZAH_FAHRZEUG : "wird zu"

    ZAH_FAHRZEUG }o--|| ZAH_MARKE : "gehört zu"
    ZAH_FAHRZEUG ||--o{ ZAH_FAHRZEUG_HIST : "Historie"

    ZAH_KUNDE ||--o{ ZAH_ANGEBOT : "erhält"
    ZAH_ANGEBOT ||--|{ ZAH_ANGEBOT_POS : "enthält"
    ZAH_ANGEBOT_POS }o--|| ZAH_FAHRZEUG : "bezieht sich auf"

    ZAH_KUNDE ||--o{ ZAH_AUFTRAG : "bestellt"
    ZAH_AUFTRAG ||--|{ ZAH_AUFTRAG_POS : "enthält"
    ZAH_AUFTRAG_POS }o--|| ZAH_FAHRZEUG : "Fahrzeug"
    ZAH_AUFTRAG }o--|| ZAH_MITARBEITER : "Verkäufer"
    ZAH_ANGEBOT ||--o| ZAH_AUFTRAG : "wird zu"

    ZAH_AUFTRAG ||--o| ZAH_RECHNUNG : "führt zu"
    ZAH_RECHNUNG ||--|{ ZAH_RECHNUNG_POS : "enthält"
    ZAH_RECHNUNG ||--o{ ZAH_ZAHLUNG : "Zahlungen"

    ZAH_LIEFERANT {
        string LIEFERANT_ID PK
        string NAME
        string STRASSE
        string PLZ
        string ORT
        string TELEFON
        string EMAIL
    }

    ZAH_FAHRZEUG {
        string FAHRZEUG_ID PK
        string FIN PK
        string MARKE_ID FK
        string MODELL
        int BAUJAHR
        string FARBE
        int KM_STAND
        string KRAFTSTOFF
        string GETRIEBE
        decimal EINKAUFSPREIS
        decimal VERKAUFSPREIS
        string STATUS
        date EINGANGSDATUM
    }

    ZAH_KUNDE {
        string KUNDE_ID PK
        string ANREDE
        string NACHNAME
        string VORNAME
        string STRASSE
        string PLZ
        string ORT
        string TELEFON
        string EMAIL
        string KUNDENTYP
    }

    ZAH_AUFTRAG {
        string AUFTRAG_ID PK
        string KUNDE_ID FK
        string MITARBEITER_ID FK
        date AUFTRAGSDATUM
        string STATUS
        decimal GESAMTPREIS
    }

    ZAH_RECHNUNG {
        string RECHNUNG_ID PK
        string AUFTRAG_ID FK
        date RECHNUNGSDATUM
        decimal NETTO
        decimal MWST
        decimal BRUTTO
        string STATUS
    }
```

## Tabellenübersicht (18 Tabellen)

### Stammdaten

| Tabelle | Beschreibung | Schlüssel |
|---------|--------------|-----------|
| `ZAH_MARKE` | Fahrzeugmarken (VW, BMW, …) | `MARKE_ID` |
| `ZAH_LIEFERANT` | Lieferanten / Hersteller | `LIEFERANT_ID` |
| `ZAH_KUNDE` | Kundenstamm | `KUNDE_ID` |
| `ZAH_MITARBEITER` | Verkäufer / Mitarbeiter | `MITARBEITER_ID` |
| `ZAH_FAHRZEUG` | Fahrzeugstamm (jedes einzelne Auto) | `FAHRZEUG_ID` |

### Einkauf

| Tabelle | Beschreibung | Schlüssel |
|---------|--------------|-----------|
| `ZAH_EINKAUF` | Einkaufsauftrag (Kopf) | `EINKAUF_ID` |
| `ZAH_EINKAUF_POS` | Einkaufsauftrag (Positionen) | `EINKAUF_ID` + `POS_NR` |

### Verkauf

| Tabelle | Beschreibung | Schlüssel |
|---------|--------------|-----------|
| `ZAH_ANGEBOT` | Angebot (Kopf) | `ANGEBOT_ID` |
| `ZAH_ANGEBOT_POS` | Angebot (Positionen) | `ANGEBOT_ID` + `POS_NR` |
| `ZAH_AUFTRAG` | Verkaufsauftrag (Kopf) | `AUFTRAG_ID` |
| `ZAH_AUFTRAG_POS` | Verkaufsauftrag (Positionen) | `AUFTRAG_ID` + `POS_NR` |

### Finanzen

| Tabelle | Beschreibung | Schlüssel |
|---------|--------------|-----------|
| `ZAH_RECHNUNG` | Rechnung (Kopf) | `RECHNUNG_ID` |
| `ZAH_RECHNUNG_POS` | Rechnung (Positionen) | `RECHNUNG_ID` + `POS_NR` |
| `ZAH_ZAHLUNG` | Zahlungseingänge | `ZAHLUNG_ID` |

### Hilfstabellen

| Tabelle | Beschreibung | Schlüssel |
|---------|--------------|-----------|
| `ZAH_FAHRZEUG_HIST` | Status-Historie je Fahrzeug | `FAHRZEUG_ID` + `SEQNR` |
| `ZAH_NUMMERNKREIS` | Automatische Nummernvergabe | `OBJEKT_TYP` |
| `ZAH_KONFIG` | Systemkonfiguration | `PARAM` |

## Nummernkreise

| Objekt | Format | Beispiel |
|--------|--------|----------|
| Kunde | `K` + 6-stellig | `K000001` |
| Fahrzeug | `F` + 8-stellig | `F00000001` |
| Einkauf | `E` + 6-stellig | `E000001` |
| Angebot | `A` + 6-stellig | `A000001` |
| Auftrag | `V` + 6-stellig | `V000001` |
| Rechnung | `R` + 6-stellig | `R000001` |

## Fremdschlüssel-Beziehungen

```
ZAH_FAHRZEUG.MARKE_ID        → ZAH_MARKE.MARKE_ID
ZAH_FAHRZEUG.EINKAUF_ID      → ZAH_EINKAUF.EINKAUF_ID
ZAH_EINKAUF.LIEFERANT_ID     → ZAH_LIEFERANT.LIEFERANT_ID
ZAH_ANGEBOT.KUNDE_ID         → ZAH_KUNDE.KUNDE_ID
ZAH_ANGEBOT_POS.FAHRZEUG_ID  → ZAH_FAHRZEUG.FAHRZEUG_ID
ZAH_AUFTRAG.KUNDE_ID         → ZAH_KUNDE.KUNDE_ID
ZAH_AUFTRAG.MITARBEITER_ID   → ZAH_MITARBEITER.MITARBEITER_ID
ZAH_AUFTRAG.ANGEBOT_ID       → ZAH_ANGEBOT.ANGEBOT_ID
ZAH_AUFTRAG_POS.FAHRZEUG_ID  → ZAH_FAHRZEUG.FAHRZEUG_ID
ZAH_RECHNUNG.AUFTRAG_ID      → ZAH_AUFTRAG.AUFTRAG_ID
ZAH_ZAHLUNG.RECHNUNG_ID      → ZAH_RECHNUNG.RECHNUNG_ID
```
