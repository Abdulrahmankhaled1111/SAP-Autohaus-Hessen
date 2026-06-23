# Autohaus HESSEN - Produktivbetrieb

Dieses Dokument beschreibt, welche Bausteine fuer einen produktiven Betrieb der Autohaus-HESSEN-App noetig sind.

## Aktueller Stand

- SAP BTP AppRouter schuetzt die Oberflaeche.
- Node.js ERP API stellt zentrale Daten bereit.
- SAP HANA Cloud speichert ERP-Tabellen, wenn die HANA-Bindung erreichbar ist.
- Audit-Protokoll, Backup-Export und Betriebsstatus sind in der Sicherheits-App vorhanden.
- Entwicklungsmodus kann Anwender waehrend Wartung sperren.

## Rollen und Zustaendigkeiten

| Bereich | Zuständig | Aufgabe |
| --- | --- | --- |
| BTP Umgebung | SAP/BTP Admin | Produktiven Subaccount, Cloud Foundry, Services, Destinations und Deployments betreiben |
| Rollenmodell | Security/Admin | BTP-Rollensammlungen und spaeter S/4HANA-Berechtigungen vergeben |
| Buchhaltung | FI/CO, Steuerbuero | S/4HANA, SAP FI oder DATEV fuer offizielle Finanzprozesse freigeben |
| Verkauf/Bestand | SD/MM | Kunden, Verkauf, Bestand und Fahrzeugprozesse fachlich definieren |
| Entwicklung | BTP/ABAP/RAP Entwickler | Schnittstellen, Erweiterungen, Tests und Deployments bauen |
| Datenschutz | Geschaeftsfuehrung/Datenschutz | DSGVO-Konzept, Loeschfristen, Zugriffskontrolle und AV-Vertraege pruefen |

## Produktiv-Checkliste

1. Trial/Free-Tier durch produktive BTP-Umgebung ersetzen.
2. BTP-Rollen fachlich freigeben und Benutzern zuordnen.
3. HANA Cloud produktiv betreiben und Backup-Strategie festlegen.
4. S/4HANA, SAP FI oder DATEV fuer Buchhaltung anbinden.
5. SMTP/API fuer echten E-Mail-Versand einrichten.
6. Revisionssicheres Dokumentenarchiv anbinden.
7. Monitoring und Alarmierung aktivieren.
8. Test-, Freigabe- und Rollback-Prozess definieren.
9. DSGVO-Konzept rechtlich pruefen lassen.

## Entwicklungsmodus

Der Entwicklungsmodus wird ueber `development-mode.json` gesteuert.

```json
{
  "enabled": true
}
```

`enabled: true` sperrt die Anmeldung fuer Anwender und zeigt eine professionelle Wartungsseite.
`enabled: false` gibt die App wieder frei.

## Betriebsbericht

In der App unter `Sicherheit` kann ein Betriebsbericht exportiert werden. Er enthaelt:

- Status von BTP, API, HANA und Tabellenmodell
- Produktiv-Checkliste
- Integrationsstatus fuer S/4HANA, DATEV, E-Mail und Archiv
- empfohlene naechste Schritte
