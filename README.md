# Autohaus HESSEN – Modernes SAP Fiori System

Vollständiges Autohaus-Managementsystem für **Autohaus HESSEN GmbH**.
Läuft im **Browser auf jedem Firmenrechner** – kein SAP GUI nötig.

## Architektur

```
Browser (jeder PC)  →  Fiori Launchpad  →  OData V4  →  S/4HANA RAP Backend
```

**Technologie:** SAP S/4HANA + RAP + Fiori/SAPUI5 (modernster SAP-Standard)

## Apps (im Browser)

| App | Funktion | Zielgruppe |
|-----|----------|------------|
| Dashboard | KPIs, Schnellzugriff | Alle |
| Fahrzeuge | Bestand, Reservierung, Auslieferung | Verkauf, Einkauf |
| Kunden | Kunden anlegen und suchen | Verkauf |
| Verkauf | Wizard: Kunde → Fahrzeug → Auftrag | Verkäufer |

## Projektstruktur

```
autohaus-hessen-sap/
├── fiori/                  # 4 SAPUI5 Web-Apps
│   ├── zahdashboard/       #   Dashboard mit KPIs
│   ├── zahfahrzeug/        #   Fahrzeugverwaltung
│   ├── zahkunde/           #   Kundenverwaltung
│   ├── zahverkauf/         #   Verkaufsprozess (Wizard)
│   └── launchpad/          #   Launchpad + Rollen
├── rap/                    # RAP Backend (OData V4)
│   ├── cds/                #   16 CDS Views
│   ├── behavior/           #   Behavior Definitions
│   ├── handlers/           #   Handler-Klassen
│   └── service/            #   OData Service
├── abap/                   # Klassisches ABAP (Daten + Logik)
│   ├── tables/             #   18 Tabellen
│   ├── classes/            #   7 Klassen
│   └── programs/           #   Reports + Demo-Daten
├── docs/
│   ├── DEPLOYMENT.md       # ★ Firmen-Rollout Anleitung
│   ├── ARCHITECTURE.md     # Technische Architektur
│   ├── PROZESS.md          # Geschäftsprozesse
│   └── DATENMODELL.md      # ER-Diagramm
├── INSTALLATION.md         # Backend-Einrichtung
├── index.html              # Lokaler App-Launcher (Entwicklung)
├── package.json            # UI5 Tooling
└── ui5.yaml                # UI5 Konfiguration
```

## Schnellstart

### Lokal testen (ohne SAP-System)

```bash
cd autohaus-hessen-sap
npm install
npm start
# → http://localhost:8080
```

### In SAP installieren

1. **Backend:** `INSTALLATION.md` befolgen (Tabellen + RAP)
2. **Apps deployen:** `docs/DEPLOYMENT.md` befolgen
3. **Go-Live:** Fiori Launchpad URL an alle Mitarbeiter

## Zugriff für Mitarbeiter

```
https://fiori.autohaus-hessen.de
```

Login mit SAP-Benutzer → Dashboard → Apps über Kacheln.

## Geschäftsprozess

```
Einkauf → Bestand → Kunde → Verkauf → Auslieferung → Rechnung → Zahlung
```

## Dokumentation

| Dokument | Inhalt |
|----------|--------|
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | **Firmen-Rollout auf jeden Rechner** |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technische Architektur |
| [INSTALLATION.md](INSTALLATION.md) | Backend-Einrichtung in SAP |
| [PROZESS.md](docs/PROZESS.md) | Geschäftsprozesse |
| [DATENMODELL.md](docs/DATENMODELL.md) | Datenmodell + ER-Diagramm |
