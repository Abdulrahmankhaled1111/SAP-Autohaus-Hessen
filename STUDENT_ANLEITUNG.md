# Studenten-Anleitung – Autohaus HESSEN SAP Projekt

## Deine Situation

- Student mit **kostenlosem SAP-Zugang**
- Projekt: **Autohaus HESSEN** (komplettes Autohaus-System)
- 10 Mitarbeiter = **10 Testbenutzer** im SAP-System (für Demo/Prüfung)

**Gute Nachricht:** Für ein Uni-Projekt reicht dein kostenloser Zugang völlig aus!

---

## Welchen Zugang hast du? (finde es in 2 Minuten heraus)

| Wenn du das siehst… | Dann hast du… | Beste Option |
|---------------------|---------------|--------------|
| `cockpit.btp.cloud.sap` | **SAP BTP Trial** | ★ Empfohlen – modern, RAP + Fiori |
| `learning.sap.com` mit Systemzugang | **SAP Learning System** | Code über Eclipse/ADT importieren |
| Deine Uni gibt URL + User | **Universitäts-SAP** | Frage Dozent nach ABAP-Entwicklung |
| Nichts davon | **Noch kein System** | NetWeaver Developer Edition (kostenlos) |

**Nicht sicher?** Öffne diese Seiten und schau ob du eingeloggt bist:
1. https://cockpit.btp.cloud.sap/
2. https://learning.sap.com/
3. https://accounts.sap.com/

---

## Empfohlener Weg für Studenten: SAP BTP Trial

### Was du bekommst (kostenlos)
- ABAP Cloud Environment (für RAP + OData)
- ~90 Tage Laufzeit (reicht für Uni-Projekt + Prüfung)
- Bis zu 10+ Testbenutzer anlegbar
- Fiori Apps im Browser

### Schritt-für-Schritt

#### 1. BTP Trial aktivieren (30 Min.)

```
1. https://www.sap.com/registration/free-trials.html
   → "SAP BTP" → "Start Free Trial"

2. ODER direkt: https://cockpit.btp.cloud.sap/
   → Trial Account aktivieren

3. BTP Cockpit → Entitlements → "ABAP Environment" suchen
   → "Create Instance" (Free Tier)
   → Warten (~30–60 Min.)
```

#### 2. Eclipse + ADT installieren (20 Min.)

```
1. Download: https://tools.hana.ondemand.com/#abap
   → "ABAP Development Tools" herunterladen
   → Installer ausführen (enthält Eclipse)

2. Eclipse öffnen
   → File → New → Other → ABAP → "ABAP Cloud Project"

3. Verbindung:
   - System URL: aus BTP Cockpit (ABAP Environment → Details)
   - Client: 100
   - User/Passwort: aus BTP Cockpit
```

#### 3. Namespace anlegen (5 Min.)

In Eclipse, verbunden mit BTP:
```
1. Rechtsklick auf Projekt → New → Other → ABAP → "Package"
2. Package: ZAH_AUTOMOTIVE
3. Beschreibung: Autohaus HESSEN
```

#### 4. Backend importieren (1 Tag Arbeit)

**Reihenfolge einhalten!**

| Nr. | Was | Wo in Eclipse | Dateien |
|-----|-----|---------------|---------|
| 1 | Domänen | New → DDLS/Domain | `abap/domains/ZAH_DOMAINS.txt` |
| 2 | Tabellen | New → Database Table | `abap/tables/*.txt` |
| 3 | Klassen | New → Class | `abap/classes/*.abap` |
| 4 | CDS Views | New → Data Definition | `rap/cds/*.ddls` |
| 5 | Behavior | New → Behavior Definition | `rap/behavior/*.bdef` |
| 6 | Handler | New → Class | `rap/handlers/*.abap` |
| 7 | Service | New → Service Definition | `rap/service/` |
| 8 | Aktivieren | Strg+F3 auf jedes Objekt | – |

Detailliert: `INSTALLATION.md`

#### 5. Fiori Apps deployen (halber Tag)

**Option A – Einfach (für Präsentation):**
```powershell
cd C:\Users\abdul\autohaus-hessen-sap
npm start
# → http://localhost:8080 → Apps zeigen
```

**Option B – Mit echtem Backend (für Abgabe):**
```
1. BTP Cockpit → SAP Build → Dev Space erstellen
2. Fiori Apps aus fiori/ Ordner importieren
3. Deploy to ABAP
```

#### 6. 10 Testbenutzer anlegen (30 Min.)

In BTP Cockpit → Security → Users:
```
ZAH_VERKAUF01  – Verkäufer
ZAH_VERKAUF02  – Verkäufer
ZAH_EINKAUF01  – Einkäufer
ZAH_BUCHHALT01 – Buchhaltung
ZAH_ADMIN01    – Administrator
... (bis 10)
```

Für die **Prüfung/Präsentation** reichen 3–4 Demo-Benutzer.

#### 7. Demo-Daten laden

In Eclipse oder SAP GUI:
```
Programm ZAH_R_DEMO_DATEN ausführen
→ 5 Fahrzeuge, 3 Kunden, 3 Lieferanten
```

---

## Alternative: NetWeaver Developer Edition (100% kostenlos, lokal)

Falls BTP nicht verfügbar oder abgelaufen:

```
1. https://developers.sap.com/tutorials/abap-trial-onpremise-download.html
2. Download (~20 GB) → Installieren (VM empfohlen)
3. Braucht: 16 GB RAM, 100 GB Festplatte
4. Eclipse + ADT → localhost verbinden
5. Code importieren wie oben
```

**Vorteil:** Unbegrenzt, kein Ablaufdatum
**Nachteil:** Nur auf deinem PC, schwerer zu installieren

---

## Was du für die Uni-Abgabe zeigen kannst

### Präsentation (15 Min.)

```
1. Dashboard öffnen          → KPIs zeigen
2. Fahrzeugbestand zeigen    → 5 Demo-Fahrzeuge
3. Kunden anlegen            → Live-Demo
4. Verkaufsprozess           → Kunde → Fahrzeug → Auftrag
5. Rechnung erstellen        → Prozess komplett
6. Umsatzbericht             → Auswertung
```

### Abgabe-Dokumentation

| Dokument | Datei |
|----------|-------|
| Datenmodell + ER-Diagramm | `docs/DATENMODELL.md` |
| Geschäftsprozesse | `docs/PROZESS.md` |
| Technische Architektur | `docs/ARCHITECTURE.md` |
| Quellcode | Gesamter Projektordner |

### Screenshots machen von:
- Fiori Dashboard
- Fahrzeugliste mit Status
- Verkaufs-Wizard
- Rechnung
- Umsatzbericht

---

## Realistischer Zeitplan (Neben dem Studium)

| Woche | Aufgabe | Stunden |
|-------|---------|---------|
| 1 | BTP Trial + Eclipse + erste Tabelle | 5–8 h |
| 2 | Alle Tabellen + Klassen | 8–10 h |
| 3 | RAP Views + Service | 8–10 h |
| 4 | Fiori Apps + Demo-Daten | 5–8 h |
| 5 | Testen + Dokumentation + Präsentation | 5–8 h |
| **Gesamt** | | **~30–40 Stunden** |

---

## Häufige Studenten-Probleme

| Problem | Lösung |
|---------|--------|
| „Trial abgelaufen" | NetWeaver Developer Edition nutzen |
| „Eclipse verbindet nicht" | URL + Client 100 + User aus BTP Cockpit prüfen |
| „RAP geht nicht" | ABAP Environment braucht, nicht altes NetWeaver |
| „Apps zeigen keine Daten" | Erst Backend, dann OData Service aktivieren |
| „10 User zu viel" | 3–4 Demo-User reichen für Prüfung |

---

## Checkliste für dich

- [ ] SAP-Account vorhanden (accounts.sap.com)
- [ ] Node.js installiert ✓
- [ ] Projektdateien ✓ (88 Dateien)
- [ ] BTP Trial ODER Developer Edition?
- [ ] Eclipse + ADT installiert?
- [ ] Erste Tabelle angelegt?
- [ ] Demo-Daten geladen?
- [ ] Präsentation vorbereitet?

---

## Nächster Schritt

Sag mir was du hast:

1. **„BTP"** – Ich führe dich durch BTP Trial + erste Tabelle in Eclipse
2. **„Uni-System"** – Ich passe die Anleitung an dein Uni-System an
3. **„Developer Edition"** – Ich helfe bei der lokalen Installation
4. **„Präsentation"** – Ich bereite eine Demo-Präsentation vor

**Sofort ohne SAP:** Apps ansehen mit `npm start` → http://localhost:8080
