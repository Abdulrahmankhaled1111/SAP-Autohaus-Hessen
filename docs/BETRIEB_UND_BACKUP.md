# Betrieb und Datensicherung

Diese Anwendung läuft als Autohaus-HESSEN-ERP auf SAP BTP mit AppRouter, Node-API und SAP HANA Cloud.

## Systemstatus prüfen

In der App:

1. Öffne **Sicherheit**.
2. Klicke auf **Status prüfen**.
3. Prüfe die Felder **Backend**, **Datenbank**, **Tabellenmodell** und **Audit-Einträge**.

Wenn dort **ERP-API aktiv** und **SAP HANA verbunden** steht, arbeitet die App gegen den zentralen SAP-BTP-Backend-Teil.

## Automatische Abmeldung

Die App meldet Benutzer nach **10 Minuten ohne Aktivität** automatisch ab.

Als Aktivität zählen Mausbewegung, Klick, Tastatur, Touch und Scrollen. In der Cloud wird danach die SAP/BTP-Sitzung über den AppRouter beendet und der Benutzer muss sich neu anmelden.

Der sichtbare Sitzungsbutton sitzt oben im **SAP Fiori Launchpad**. Dort wird die Restzeit als `MM:SS` angezeigt. Grau zeigt die verbleibende Sitzungszeit, Weiß zeigt den bereits abgelaufenen Teil. Ein Klick auf den Button verlängert die Sitzung wieder auf 10 Minuten.

Für den produktiven Alltag kann der Wert später angepasst werden:

- 5 Minuten: sinnvoll für sensible Bereiche wie Personal oder Finanzen.
- 10 Minuten: aktueller Standard für das Autohaus-System.
- 15 Minuten: oft angenehmer für normale Büroarbeit.

## Backup herunterladen

In der App:

1. Öffne **Sicherheit**.
2. Klicke auf **Backup herunterladen**.
3. Lege die heruntergeladene JSON-Datei an einem sicheren Ort ab.

Das Backup enthält den ERP-Datenbestand, aber keine SAP-Passwörter und keine Service-Keys.

Empfehlung für den Betrieb:

- Täglich ein Backup herunterladen, solange noch kein automatischer Backup-Prozess eingerichtet ist.
- Zusätzlich monatlich ein Archivbackup ablegen.
- Backup-Dateien nicht per WhatsApp oder privater E-Mail versenden.
- Zugriff nur für Chef/Admin.

## Was vor echtem Produktivbetrieb noch geprüft werden muss

- BTP-Rollensammlungen für Admin, Chef, Verkauf, Finanzen, Personal und Mitarbeiter sauber zuweisen.
- Datenschutz und Zugriffsrechte prüfen.
- Automatisches HANA-Backup oder Export-Job einrichten.
- Steuerberater/Lohnbüro für echte Lohnabrechnung und Steuerdaten einbinden.
- Impressum, Aufbewahrungsfristen und Dokumentenarchiv rechtlich prüfen.
