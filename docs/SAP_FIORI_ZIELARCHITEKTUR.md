# SAP Fiori Zielarchitektur

## Zielbild

Autohaus HESSEN soll wie ein SAP-System aufgebaut sein: Benutzer melden sich über SAP/BTP an, sehen ein Fiori Launchpad und öffnen dort nur die Apps, für die sie berechtigt sind.

```mermaid
flowchart TD
    A["Mitarbeiter, Admin, Chef"] --> B["SAP Login / XSUAA"]
    B --> C["SAP Fiori Launchpad"]

    C --> D1["Dashboard"]
    C --> D2["Fahrzeuge"]
    C --> D3["Kunden"]
    C --> D4["Verkauf"]
    C --> D5["Finanzen"]
    C --> D6["Personal"]
    C --> D7["Aufgaben"]
    C --> D8["Tickets"]
    C --> D9["Dokumente"]

    D1 --> E["AppRouter"]
    D2 --> E
    D3 --> E
    D4 --> E
    D5 --> E
    D6 --> E
    D7 --> E
    D8 --> E
    D9 --> E

    E --> F["ERP API"]
    F --> G["SAP HANA Cloud"]
    B --> H["BTP Role Collections"]
    H --> C
```

## Aktueller Projektaufbau

```mermaid
flowchart TD
    A["index.html Launchpad"] --> B["app.html Fiori App Suite"]
    B --> C["AppRouter"]
    C --> D["XSUAA"]
    C --> E["ERP API Node.js"]
    E --> F["SAP HANA Cloud"]
    G["fiori/* UI5 Apps"] --> A
    H["rap und abap Vorlagen"] --> I["später SAP RAP/OData"]
```

## Nächste technische Ausbaustufen

1. Die vorbereiteten UI5 Apps unter `fiori/*` einzeln produktionsreif machen.
2. Jede App direkt an `/api` oder später an OData anbinden.
3. BTP Role Collections erstellen und Benutzern zuweisen.
4. Die App Suite schrittweise in echte getrennte Fiori Apps aufteilen.
5. Später CAP/OData oder SAP RAP als offizielles Backend ergänzen.
