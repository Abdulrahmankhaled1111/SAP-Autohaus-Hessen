# SAP BTP Deployment

Diese Anleitung bringt die Autohaus HESSEN Management Suite auf SAP BTP.

## Zielarchitektur

```text
Browser
  -> SAP App Router
  -> XSUAA Login und Rollen
  -> HTML5 Apps Repository
  -> spaeter OData / SAP RAP Backend
  -> spaeter HANA Cloud / SAP Datenbank
```

## Was jetzt vorbereitet ist

- `mta.yaml` fuer Multi-Target-Application Deployment
- `xs-security.json` fuer Rollen und Login
- `approuter/` fuer zentralen Zugriff mit XSUAA
- `build:btp` fuer ein sauberes HTML5-App-Build-Verzeichnis
- HTML5 Apps Repository Host und Runtime
- Destination Service als Vorbereitung fuer OData/RAP

## Voraussetzungen

Installiere lokal:

```powershell
npm install
npm install -g mbt
npm install -g @sap/cds-dk
```

SAP Cloud Foundry CLI und MultiApps Plugin:

```powershell
cf --version
cf install-plugin multiapps
```

## Login in SAP BTP

In deinem BTP Cockpit:

1. Subaccount oeffnen
2. Cloud Foundry Environment aktivieren
3. Org und Space anlegen, z. B. `dev`
4. API Endpoint kopieren

Dann lokal:

```powershell
cf login -a <API-ENDPOINT>
cf target -o <ORG> -s <SPACE>
```

## Build und Deployment

### Variante A: Direkter App-Router-Deploy ohne MTAR

Diese Variante funktioniert gut auf Windows und fuer Trial-Accounts:

```powershell
tools\cf-cli\cf.exe login -a <API-ENDPOINT> --sso
tools\cf-cli\cf.exe target -o <ORG> -s <SPACE>
npm.cmd run build:btp
tools\cf-cli\cf.exe create-service xsuaa application autohaus-hessen-xsuaa -c xs-security.json
tools\cf-cli\cf.exe push -f manifest.yml
```

Danach zeigt `cf apps` die URL der Anwendung.

### Variante B: MTAR-Deployment

Diese Variante braucht auf Windows zusaetzlich echtes GNU Make:

```powershell
npm run build:btp
mbt build
cf deploy mta_archives/autohaus-hessen-sap_1.0.0.mtar
```

## Rollen zuweisen

Nach dem Deployment im BTP Cockpit:

1. Security
2. Role Collections
3. Rollen aus `xs-security.json` einer Role Collection zuweisen
4. Benutzer zuordnen

Empfohlene Role Collections:

| Role Collection | Rolle |
|---|---|
| Autohaus_Admin | AH_Admin |
| Autohaus_Chef | AH_Chef |
| Autohaus_Mitarbeiter | AH_Mitarbeiter |
| Autohaus_Finanzen | AH_Finanzen |
| Autohaus_Personal | AH_Personal |

## Naechster professioneller Schritt

Aktuell ist die UI BTP-ready, aber die Demo-Daten werden noch im Browser gespeichert.

Als naechstes sollte gebaut werden:

1. echtes Backend
2. Datenbank
3. OData API
4. serverseitige Rollenrechte
5. Dokumentenarchiv
6. Backup und Protokolle

SAP-Zielbild:

```text
Fiori UI
  -> OData V4
  -> SAP RAP
  -> HANA Cloud
```
