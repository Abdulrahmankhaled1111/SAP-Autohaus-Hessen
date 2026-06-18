# Git fuer Autohaus HESSEN

Diese Datei beschreibt den professionellen Git-Start fuer das Projekt.

## 1. Git installieren

Wenn `git` im Terminal nicht erkannt wird, installiere Git fuer Windows:

https://git-scm.com/download/win

Danach ein neues Terminal oeffnen und pruefen:

```powershell
git --version
```

## 2. Repository starten

Im Projektordner ausfuehren:

```powershell
git init
git status
git add .
git commit -m "Initiale Autohaus HESSEN Management Suite"
```

## 3. Mit GitHub oder GitLab verbinden

Auf GitHub/GitLab ein neues leeres Repository erstellen und dann:

```powershell
git branch -M main
git remote add origin <DEINE-REPOSITORY-URL>
git push -u origin main
```

## 4. Arbeitsweise wie im Unternehmen

Fuer neue Funktionen immer einen eigenen Branch verwenden:

```powershell
git checkout -b feature/rechnungen-angebote-mahnungen
```

Nach der Arbeit:

```powershell
git status
git add .
git commit -m "Erweitert Dokumente und Rollen"
git push
```

Danach in GitHub/GitLab einen Pull Request erstellen, pruefen und erst danach in `main` uebernehmen.

## 5. Was nicht in Git gehoert

Die Datei `.gitignore` sorgt dafuer, dass lokale Abhaengigkeiten, Log-Dateien, temporare Exporte und geheime `.env`-Dateien nicht hochgeladen werden.

