# Deployment – Autohaus HESSEN auf jedem Firmenrechner

## Architektur (Empfehlung: S/4HANA)

```
┌─────────────────────────────────────────────────────────────┐
│  JEDER FIRMENRECHNER (Browser: Chrome / Edge / Firefox)     │
│  URL: https://fiori.autohaus-hessen.de                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│  SAP Fiori Launchpad (S/4HANA oder SAP Build Work Zone)     │
│  ├── Dashboard App                                           │
│  ├── Fahrzeug App                                            │
│  ├── Kunde App                                               │
│  └── Verkauf App                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │ OData V4
┌──────────────────────────▼──────────────────────────────────┐
│  S/4HANA Backend (RAP + OData Service ZUI_AH_AUTOMOTIVE)     │
│  ├── CDS Views (ZC_AH_*)                                     │
│  ├── Behavior Definitions                                    │
│  ├── Handler Classes (ZBP_AH_*)                              │
│  └── Datenbanktabellen (ZAH_*)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Option A: S/4HANA On-Premise (Empfohlen für Autohaus HESSEN)

### Voraussetzungen
- SAP S/4HANA 2021 oder neuer
- Fiori Launchpad aktiviert (Transaktion `/UI2/FLP`)
- SAP Gateway / Embedded Gateway
- SSL-Zertifikat für HTTPS

### Schritt 1: Backend installieren (1 Tag)

```
1. Domänen + Tabellen anlegen        → INSTALLATION.md
2. RAP-Objekte importieren           → rap/ Ordner
3. OData Service aktivieren:
   - Transaktion /IWFND/MAINT_SERVICE
   - Service: ZUI_AH_AUTOMOTIVE
   - System aktivieren + lokales System zuordnen
4. Demo-Daten einspielen             → ZAH_R_DEMO_DATEN
```

### Schritt 2: Fiori Apps deployen (halber Tag)

**Mit SAP Business Application Studio (BAS):**

```bash
# 1. BAS öffnen (BTP Cockpit → Create Dev Space → Full Stack)
# 2. Apps importieren aus fiori/ Ordner
# 3. Deploy:
npm install -g @sap/ux-ui5-tooling
cd fiori/zahfahrzeug
npm install
npm run build
# Deploy to ABAP:
npm run deploy
```

**Alternativ: Manuelles Deploy über SE80:**

```
1. SE80 → BSP-Anwendung anlegen: ZAH_FAHRZEUG
2. Webapp-Dateien hochladen
3. Aktivieren
4. Wiederholen für: ZAH_KUNDE, ZAH_VERKAUF, ZAH_DASHBOARD
```

### Schritt 3: Fiori Launchpad einrichten (2 Stunden)

```
1. /UI2/FLPD_CUST → Launchpad Designer
2. Katalog anlegen: ZAH_AUTOMOTIVE_CAT
3. Apps hinzufügen (aus fiori/launchpad/ZAH_Launchpad_Site.json)
4. Gruppen erstellen: Verkauf, Bestand, Finanzen
5. Site veröffentlichen
```

### Schritt 4: Benutzer & Rollen (1 Stunde)

```
1. PFCG → Rollen anlegen (siehe BUSINESS_ROLES.md)
2. Benutzer zuordnen
3. Jeder Mitarbeiter bekommt Login + Rolle
```

### Schritt 5: Firmenrechner einrichten

**Jeder Mitarbeiter öffnet im Browser:**

```
https://[s4-server]:[port]/sap/bc/ui5_ui5/sap/zah_launchpad
```

Oder mit schöner URL (DNS + Reverse Proxy):
```
https://fiori.autohaus-hessen.de
```

**Kein SAP GUI nötig!** Funktioniert auf:
- Windows PCs
- Macs
- Tablets
- Smartphones

---

## Option B: SAP BTP (Cloud)

### Voraussetzungen
- SAP BTP Account (Pay-As-You-Go oder CPEA)
- ABAP Environment Service aktiviert
- SAP Build Work Zone (für Launchpad)

### Schritt 1: ABAP Environment

```
1. BTP Cockpit → ABAP Environment erstellen
2. Custom Namespace ZAH anlegen
3. Code importieren (abapGit oder manuell)
4. RAP Service publizieren
```

### Schritt 2: SAP Build Work Zone

```
1. BTP Cockpit → SAP Build Work Zone aktivieren
2. Content Manager → Apps importieren
3. Site erstellen mit Katalog + Gruppen
4. Identity Authentication → Benutzer anlegen
```

### Schritt 3: Zugriff

```
URL: https://[tenant].workzone.ondemand.com
Login: Firmen-E-Mail + Passwort (SSO möglich)
```

---

## Option C: Lokale Entwicklung & Test

### UI5 lokal starten (ohne SAP-System)

```bash
cd C:\Users\abdul\autohaus-hessen-sap
npm install
npm start
```

Öffnet: `http://localhost:8080` mit Mock-Daten.

### Mit echtem S/4HANA Backend verbinden

`ui5.yaml` anpassen:
```yaml
server:
  customMiddleware:
    - name: fiori-tools-proxy
      afterMiddleware: compression
      configuration:
        backend:
          - url: https://dein-s4-server:443
            client: '100'
```

---

## Checkliste: Go-Live

- [ ] Alle Tabellen angelegt und aktiviert
- [ ] RAP Service `ZUI_AH_AUTOMOTIVE` aktiv und getestet
- [ ] 4 Fiori Apps deployed
- [ ] Launchpad Site veröffentlicht
- [ ] Business Roles angelegt
- [ ] Benutzer angelegt und Rollen zugeordnet
- [ ] Demo-Daten eingespielt
- [ ] Testlauf: Einkauf → Verkauf → Rechnung
- [ ] HTTPS / SSL konfiguriert
- [ ] URL an alle Mitarbeiter kommuniziert
- [ ] Kurze Schulung (30 Min) für Verkäufer

---

## Support & Wartung

| Aufgabe | Transaktion / Tool |
|---|---|
| Tabellen pflegen | SM30 |
| Service prüfen | /IWFND/ERROR_LOG |
| Apps aktualisieren | BAS → Deploy |
| Benutzer anlegen | SU01 + PFCG |
| Logs prüfen | SLG1 |
| Performance | ST05 |

---

## Geschätzte Kosten (BTP Cloud)

| Service | Kosten/Monat (ca.) |
|---|---|
| ABAP Environment (1 User) | ~500–800 EUR |
| SAP Build Work Zone | ~300–500 EUR |
| **Gesamt Cloud** | **~800–1.300 EUR/Monat** |

S/4HANA On-Premise: Einmalige Lizenzkosten, danach Wartung.
