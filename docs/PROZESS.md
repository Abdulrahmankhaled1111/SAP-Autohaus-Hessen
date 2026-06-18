# Geschäftsprozesse – Autohaus HESSEN

## 1. Einkauf / Fahrzeugbeschaffung

**Ziel:** Neue Fahrzeuge beim Hersteller oder Großhändler beschaffen und in den Bestand einbuchen.

### Ablauf

1. **Lieferant anlegen** (`ZAH_LIEFERANT`)
   - Hersteller (VW, BMW, Mercedes …) oder Importeur
   - Kontaktdaten, Zahlungsbedingungen

2. **Einkaufsauftrag erstellen** (`ZAH_EINKAUF` + `ZAH_EINKAUF_POS`)
   - Lieferant, Bestelldatum, erwartete Lieferung
   - Positionen: Marke, Modell, Anzahl, Einkaufspreis

3. **Wareneingang / Fahrzeug einbuchen**
   - Pro Fahrzeug: FIN/VIN, Kennzeichen, Farbe, km-Stand
   - Status → `BESTAND`
   - Einkaufspreis wird auf Fahrzeug übertragen

### Transaktion: `ZAH_EINK`

---

## 2. Bestandsverwaltung

**Ziel:** Überblick über alle Fahrzeuge im Autohaus.

### Funktionen

- Fahrzeuge suchen (Marke, Modell, Status, Preis)
- Fahrzeugdetails anzeigen
- Status ändern (z. B. → Werkstatt)
- Bestandswert berechnen

### Transaktion: `ZAH_BEST`

---

## 3. Kundenverwaltung

**Ziel:** Kundenstammdaten pflegen.

### Daten

- Kundennummer (automatisch)
- Anrede, Name, Vorname
- Adresse, PLZ, Ort
- Telefon, E-Mail
- Kundentyp: Privat / Gewerbe
- Erstellungsdatum

### Transaktion: `ZAH_KUND`

---

## 4. Verkaufsprozess

**Ziel:** Vom Angebot bis zur Auslieferung.

### 4.1 Angebot erstellen

- Kunde auswählen
- Fahrzeug(e) aus Bestand wählen
- Verkaufspreis, Rabatt, Finanzierung
- Gültigkeitsdatum
- Status: `OFFEN` → `ANGENOMMEN` / `ABGELEHNT`

### 4.2 Verkaufsauftrag

- Aus angenommenem Angebot oder direkt
- Fahrzeug wird **reserviert** (Status → `RESV`)
- Verkäufer (Mitarbeiter) zuordnen
- Anzahlung optional erfassen

### 4.3 Auslieferung

- Fahrzeug-Status → `AUSG`
- Übergabedatum, km-Stand bei Übergabe
- Kunde erhält Fahrzeug

### Transaktion: `ZAH_VERK`

---

## 5. Rechnungsstellung

**Ziel:** Rechnung für verkaufte Fahrzeuge erstellen.

### Ablauf

1. Verkaufsauftrag mit Status `AUSGELIEFERT` auswählen
2. Rechnung generieren (`ZAH_RECHNUNG`)
   - Rechnungsnummer (automatisch)
   - Nettobetrag, MwSt. (19 %), Bruttobetrag
   - Fälligkeitsdatum
3. Rechnung drucken / als PDF

### Transaktion: `ZAH_RECH`

---

## 6. Zahlungseingang

- Zahlung zu Rechnung erfassen (`ZAH_ZAHLUNG`)
- Teilzahlung oder Vollzahlung
- Rechnungsstatus: `OFFEN` → `TEILBEZAHLT` → `BEZAHLT`

---

## 7. Berichte

| Bericht | Inhalt |
|---------|--------|
| Bestandsübersicht | Alle Fahrzeuge nach Status/Marke |
| Umsatzbericht | Verkäufe pro Monat/Verkäufer |
| Offene Rechnungen | Noch nicht bezahlte Rechnungen |
| Einkaufsübersicht | Eingekaufte Fahrzeuge pro Lieferant |

### Transaktion: `ZAH_UMS`

---

## Rollen & Berechtigungen (Vorschlag)

| Rolle | Berechtigungen |
|-------|----------------|
| `ZAH_VERKAUF` | Kunden, Angebote, Aufträge |
| `ZAH_EINKAUF` | Lieferanten, Einkauf, Bestand |
| `ZAH_BUCHHALT` | Rechnungen, Zahlungen, Berichte |
| `ZAH_ADMIN` | Alle Transaktionen + Stammdaten |
