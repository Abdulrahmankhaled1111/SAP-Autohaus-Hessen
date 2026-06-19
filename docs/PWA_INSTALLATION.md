# Autohaus HESSEN als Handy-App installieren

Die Anwendung ist jetzt als Progressive Web App vorbereitet. Dadurch kann sie auf dem Handy wie eine App installiert werden, ohne dass sie zuerst in den App Store muss.

## Voraussetzungen

- Die App muss ueber HTTPS laufen, zum Beispiel ueber SAP BTP:
  `https://autohaus-hessen-approuter.cfapps.us10-001.hana.ondemand.com`
- Der Benutzer muss sich mit dem SAP/BTP-Login anmelden koennen.
- Nach Aenderungen muss die App neu auf BTP deployt werden.

## Android

1. Die App-URL in Chrome oeffnen.
2. Falls der Button **App installieren** sichtbar ist, darauf klicken.
3. Alternativ im Chrome-Menue auf **App installieren** oder **Zum Startbildschirm hinzufuegen** klicken.
4. Danach erscheint **Autohaus HESSEN** als Icon auf dem Startbildschirm.

## iPhone

1. Die App-URL in Safari oeffnen.
2. Unten auf das Teilen-Symbol klicken.
3. **Zum Home-Bildschirm** waehlen.
4. Namen bestaetigen und **Hinzufuegen** klicken.

## Was die PWA jetzt kann

- eigenes App-Icon
- eigener App-Name
- Start im App-Modus ohne normale Browser-Optik
- sichtbarer Installationsbutton im Kopfbereich und unten rechts
- automatische Installation, wenn Chrome/Android den Installationsdialog freigibt
- klare Anleitung, wenn der Browser nur manuelles Hinzufuegen erlaubt
- Offline-Hinweis, wenn keine Verbindung besteht
- SAP-Login, API und Logout bleiben online und werden nicht offline zwischengespeichert

## Warum der Button manchmal keinen direkten Dialog oeffnet

Der Browser entscheidet selbst, ob der echte Installationsdialog sofort erlaubt ist. Voraussetzungen sind HTTPS, Manifest, Service Worker und ein nicht bereits installierter Zustand. Wenn der Browser den Dialog noch nicht freigibt, bleibt der Button trotzdem sichtbar und zeigt die passenden Schritte fuer Android oder iPhone.
