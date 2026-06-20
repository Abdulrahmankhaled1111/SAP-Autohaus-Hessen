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

- Root-Aufruf `/` öffnet zuerst `maintenance.html`.
- Wenn der Entwicklungsmodus aus ist, wird automatisch zum Launchpad weitergeleitet.
- Wenn der Entwicklungsmodus aktiv ist, sieht der Anwender die Sperrseite und kann sich nicht normal anmelden.
- Direkte Links auf `index.html` oder `app.html` werden zusätzlich im Frontend blockiert.

## Vorschau

Zum Testen ohne Aktivierung:

```text
/maintenance.html?preview=dev
/index.html?preview=dev
```
