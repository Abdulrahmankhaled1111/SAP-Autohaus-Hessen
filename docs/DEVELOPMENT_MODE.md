# Entwicklungsmodus

Der Entwicklungsmodus sperrt das Autohaus-HESSEN-System für Anwender, wenn am System gearbeitet wird.

## Aktivieren

In `development-mode.json`:

```json
{
  "enabled": true
}
```

Danach neu bauen und auf SAP BTP deployen.

## Deaktivieren

In `development-mode.json`:

```json
{
  "enabled": false
}
```

Danach wieder neu bauen und deployen.

## Verhalten

- Root-Aufruf `/` öffnet das geschützte Launchpad `index.html`.
- Wenn der Entwicklungsmodus aus ist, startet das System normal.
- Wenn der Entwicklungsmodus aktiv ist, sieht der Anwender nach dem SAP-Login sofort die Sperrseite und kann nicht weiterarbeiten.
- Direkte Links auf `index.html` oder `app.html` werden im Frontend blockiert.
- `maintenance.html` bleibt als öffentliche Info- und Abmeldeseite erhalten.

## Vorschau

Zum Testen ohne Aktivierung:

```text
/maintenance.html?preview=dev
/index.html?preview=dev
```
