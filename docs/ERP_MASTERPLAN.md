# Autohaus HESSEN ERP Masterplan

## Zielbild

Die Autohaus HESSEN Management Suite wird zu einem eigenen ERP-System auf SAP BTP. Die Oberfläche bleibt die zentrale Arbeitsfläche für Abteilungen wie Geschäftsführung, Verkauf, Finanzen, Personal, Service, Dokumente und Tickets. Darunter entsteht ein stabiler Backend-Kern mit API, zentralen Daten, Rollen, Protokollierung und später SAP HANA Cloud.

## Aktueller Ausbau

- SAP BTP Cloud Foundry hostet die Anwendung.
- SAP AppRouter schützt die Oberfläche.
- XSUAA übernimmt Anmeldung und Rollenbasis.
- Eine eigene ERP-API nimmt Daten zentral entgegen.
- SAP HANA Cloud ist als dauerhafte Datenbank vorgesehen; die API erkennt eine HANA-Bindung automatisch.
- Die ERP-Daten werden in getrennten HANA-Tabellen pro Fachbereich gespeichert.
- Die Oberfläche kann weiterhin lokal arbeiten, verbindet sich aber automatisch mit der ERP-API, wenn sie verfügbar ist.
- Änderungen werden im Audit-Protokoll festgehalten.

## Nächste professionelle Ausbaustufen

1. Rollen in BTP als Role Collections pflegen und in der App erzwingen.
2. Dokumente als PDF erzeugen, speichern und versionieren.
3. Nummernkreise für Rechnungen, Angebote, Kaufverträge und Personalabrechnungen absichern.
4. Steuerberater-Export und Zahlungsabgleich im Finanzbereich ergänzen.
5. Backup, Monitoring und Änderungsprotokolle produktiv betreiben.
6. Abteilungen über eigene Workflows und Freigaben verbinden.
7. Später von JSON-Payload-Tabellen auf vollständig relationale Tabellen mit OData-Service wechseln.

## HANA-Datenmodell Ausbaustufe 1

Die API legt folgende Tabellen im HANA-Schema an:

- `ERP_SYSTEM_STATE`
- `ERP_VEHICLES`
- `ERP_CUSTOMERS`
- `ERP_SALES`
- `ERP_INVOICES`
- `ERP_REQUESTS`
- `ERP_LETTERS`
- `ERP_NOTES`
- `ERP_EMPLOYEES`
- `ERP_PAYROLLS`
- `ERP_TASKS`
- `ERP_TICKETS`
- `ERP_REMINDERS`
- `ERP_AUDIT_LOG`

Damit sind die Fachbereiche technisch getrennt. Die Oberfläche kann trotzdem weiterhin den vollständigen ERP-Datenstand laden, damit die vorhandene Bedienung stabil bleibt.

## Wichtig

Die aktuelle Lohn- und Steuerlogik ist ein Muster für die interne Vorbereitung. Für echten Lohn, ELStAM, Krankenkassenmeldungen, DEÜV und Steuerrecht muss später ein zertifiziertes Lohnsystem oder Steuerbüro angebunden werden.
