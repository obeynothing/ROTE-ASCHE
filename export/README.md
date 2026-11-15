# ROTE ASCHE — Veröffentlichung (GitHub Pages & eigener Webspace)

**ROTE ASCHE** ist eine reine statische Singleplayer-Web-App (HTML, CSS, JS) ohne Backend-Server und ohne `npm` zur Laufzeit. Die lokale Bestenliste wird direkt im Browser (`localStorage`) gespeichert.

## 1. GitHub Pages (empfohlen)
1. Repository auf GitHub hochladen (`main`-Branch). Die Datei `.github/workflows/gh-pages.yml` ist bereits vorbereitet.
2. In GitHub unter **Settings → Pages → Source** auf **GitHub Actions** umstellen.
3. Nach dem Push baut GitHub automatisch `dist/` und veröffentlicht das Spiel unter `https://<dein-name>.github.io/<repo>/`.

**Alternativ ohne Build-Action:** Einfach den Inhalt des fertig kompilierten Ordners `export/` (enthält `index.html` und `assets/`) direkt ins GitHub-Repository oder auf deinen Webspace laden.

## 2. Eigener Server / Webspace (Apache, Nginx, Caddy)
1. Den Inhalt von `export/` in das Webroot-Verzeichnis deines Servers kopieren (z. B. `/var/www/html/`).
2. Fertig — kein Node.js und kein `npm` auf dem Zielserver erforderlich.
