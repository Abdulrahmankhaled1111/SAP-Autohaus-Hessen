# START HIER – Autohaus HESSEN zum Laufen bringen

## Kurzantwort auf deine Fragen

| Frage | Antwort |
|-------|---------|
| **Eclipse?** | Ja – **Eclipse mit ABAP Development Tools (ADT)** für Backend-Code. Für Fiori-Apps reicht auch **VS Code** oder der Browser. |
| **Reichen die Dateien?** | Ja, aber sie müssen **in ein SAP-System importiert** werden. Die Dateien allein laufen nicht von allein. |
| **10 Mitarbeiter?** | Mit **kostenlosem Zugang** eher als Pilot/Demo. Für dauerhaften Betrieb mit 10 Nutzern brauchst du später ein bezahltes System. |
| **Was brauche ich mindestens?** | 1× SAP-Backend + Browser auf jedem Rechner |

---

## Was du konkret brauchst

```
┌─────────────────────────────────────────────────────────┐
│  DU (Entwicklung)                                        │
│  ├── Eclipse + ADT  ODER  SAP Business Application Studio│
│  ├── Node.js (hast du schon ✓)                          │
│  └── Zugang zu einem SAP-System                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  SAP-SYSTEM (Backend – Daten + Logik)                    │
│  Option A: BTP Trial (kostenlos, Cloud)                 │
│  Option B: NetWeaver Developer Edition (kostenlos, lokal)│
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  10 MITARBEITER (nur Browser nötig)                      │
│  Chrome / Edge → URL öffnen → einloggen → Apps nutzen   │
└─────────────────────────────────────────────────────────┘
```

---

## Option 1: Sofort Oberfläche ansehen (OHNE SAP) – 5 Minuten

So siehst du die Apps sofort im Browser – **ohne echte Daten**:

```powershell
cd C:\Users\abdul\autohaus-hessen-sap
npm start
```

Dann öffnet sich: **http://localhost:8080**

→ Kacheln klicken → Apps ansehen (Design + Navigation)
→ **Achtung:** Ohne SAP-Backend keine echten Daten, Speichern funktioniert nicht.

---

## Option 2: Kostenloser SAP-Zugang (BTP Trial) – Empfohlen

Wenn du **kostenlosen SAP-Zugang** hast, ist das meist **SAP BTP Trial**.

### Schritt 1: BTP Account prüfen

1. Öffne: https://account.hanatrial.ondemand.com/ oder https://cockpit.btp.cloud.sap/
2. Einloggen mit SAP-Account
3. Prüfen ob **ABAP Environment** oder **SAP Build** verfügbar ist

### Schritt 2: ABAP Environment erstellen

```
BTP Cockpit
  → Services → Service Marketplace
  → Suche: "ABAP Environment"
  → Create (Free Tier wählen falls verfügbar)
  → Warten (~30–60 Minuten)
```

Du bekommst dann:
- Eine **System-URL** (z.B. `https://xxx.abap.hana.ondemand.com`)
- **Instance ID** + Zugangsdaten

### Schritt 3: Eclipse + ADT installieren

1. Download: https://tools.hana.ondemand.com/#abap
2. **Eclipse mit ABAP Development Tools** installieren
3. Eclipse öffnen → **File → New → ABAP Cloud Project**
4. Verbindung zu deinem BTP ABAP System:
   - URL: deine ABAP Environment URL
   - Client: 100
   - User + Passwort aus BTP Cockpit

### Schritt 4: Code importieren (Reihenfolge!)

**In Eclipse, verbunden mit SAP-System:**

```
Tag 1 – Backend:
  1. Domänen anlegen          → abap/domains/ZAH_DOMAINS.txt
  2. Tabellen anlegen (SE11)  → abap/tables/*.txt
  3. Klassen anlegen (SE24)   → abap/classes/*.abap
  4. RAP Views importieren    → rap/cds/*.ddls
  5. Behavior + Handler       → rap/behavior/ + rap/handlers/
  6. Service aktivieren       → rap/service/

Tag 2 – Apps:
  7. Fiori Apps deployen      → fiori/*/webapp/
  8. Demo-Daten laden         → ZAH_R_DEMO_DATEN
  9. Benutzer für 10 MA       → anlegen in BTP
```

Detaillierte Anleitung: `INSTALLATION.md`

### Schritt 5: 10 Mitarbeiter einrichten

In BTP Cockpit → **Security → Users**:

```
Benutzer anlegen:
  verkauf01, verkauf02, ... (Verkäufer)
  einkauf01                 (Einkauf)
  buchhalt01                (Buchhaltung)
  admin01                   (Admin)
```

Jeder bekommt Login + Passwort → öffnet Browser-URL.

---

## Option 3: NetWeaver Developer Edition (lokal, kostenlos)

Falls BTP nicht verfügbar:

1. Download: https://developers.sap.com/tutorials/abap-trial-onpremise-download.html
2. Installiert eine **lokale SAP-Datenbank** auf deinem PC (braucht ~16 GB RAM, 100 GB Festplatte)
3. Eclipse + ADT verbinden mit `localhost`
4. Code wie oben importieren

**Nachteil:** Nur auf **deinem PC** laufend, nicht für 10 Mitarbeiter im Netzwerk geeignet (nur Entwicklung/Test).

---

## Eclipse vs. andere Tools – Was wofür?

| Tool | Wofür | Brauchst du? |
|------|-------|--------------|
| **Eclipse + ADT** | ABAP Code, Tabellen, RAP in SAP importieren | **Ja** (Backend) |
| **SAP Business Application Studio** | Fiori Apps deployen (Cloud-IDE) | Optional (Alternative zu Eclipse) |
| **VS Code** | Fiori/UI5 Apps bearbeiten | Optional |
| **Node.js / npm** | Apps lokal testen | **Ja** (hast du) |
| **SAP GUI** | Klassische Transaktionen (SE11, SE38) | Hilfreich |
| **Browser** | Apps nutzen (für alle 10 MA) | **Ja** (für alle) |

**Eclipse allein reicht nicht** – es ist nur der Editor. Du brauchst immer ein **SAP-System dahinter**.

---

## Realistischer Plan für 10 Mitarbeiter

### Phase 1: Jetzt (kostenlos, Demo/Pilot)

```
BTP Trial oder Developer Edition
  → System aufsetzen (1–2 Tage)
  → Code importieren
  → 2–3 Testbenutzer
  → Prozess testen: Einkauf → Verkauf → Rechnung
```

### Phase 2: Später (Produktiv mit 10 MA)

```
SAP S/4HANA Cloud oder On-Premise (kostenpflichtig)
  → Fiori Launchpad für alle 10 MA
  → URL: https://fiori.autohaus-hessen.de
  → Rollen: Verkauf, Einkauf, Buchhaltung
```

| Phase | Kosten | Nutzer |
|-------|--------|--------|
| Pilot (BTP Trial) | 0 € (zeitlich begrenzt) | 2–3 Test |
| Produktiv (S/4HANA) | ab ~2.000 €/Monat | 10 MA |

---

## Checkliste – Was hast du schon?

- [ ] SAP-Account (kostenlos auf accounts.sap.com)
- [ ] Node.js installiert ✓
- [ ] Projektdateien ✓ (`C:\Users\abdul\autohaus-hessen-sap`)
- [ ] BTP Trial ODER NetWeaver Developer Edition?
- [ ] Eclipse + ADT installiert?
- [ ] Mindestens 16 GB RAM (für lokales SAP)

---

## Nächster Schritt – sag mir eins davon:

1. **„BTP“** → Ich führe dich Schritt für Schritt durch BTP + Eclipse
2. **„Lokal“** → Ich helfe dir NetWeaver Developer Edition zu installieren
3. **„Erst mal ansehen“** → Starte `npm start` und schau dir die Apps an
4. **„Eclipse installiert“** → Ich zeige dir wie du die erste Tabelle anlegst

**Am schnellsten:** Option 3 – in 2 Minuten Apps im Browser sehen:
```powershell
cd C:\Users\abdul\autohaus-hessen-sap
npm start
```
