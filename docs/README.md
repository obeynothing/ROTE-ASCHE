# ROTE ASCHE — Veröffentlichung (GitHub Pages & eigener Webspace)

**ROTE ASCHE** ist eine reine statische Singleplayer-Web-App (HTML, CSS, JS) ohne Backend-Server und ohne `npm` zur Laufzeit. Die lokale Bestenliste wird direkt im Browser (`localStorage`) gespeichert.

## 1. GitHub Pages (2 einfache Wege)
### Weg A: Branch `/docs` (sofort ohne Build-Schritt)
1. Repository auf GitHub hochladen (`main`-Branch). Der fertig gebaute statische Ordner `docs/` (inkl. `.nojekyll`) liegt bereits bereit.
2. In GitHub unter **Settings → Pages → Build and deployment → Source** auf **Deploy from a branch** stellen, Branch **`main`** und Ordner **`/docs`** wählen → **Save**.

### Weg B: GitHub Actions (automatischer Build bei jedem Push)
1. In GitHub unter **Settings → Pages → Source** auf **GitHub Actions** umstellen.
2. Die Datei `.github/workflows/gh-pages.yml` baut automatisch `dist/` und veröffentlicht unter `https://<dein-name>.github.io/<repo>/`.

> **Wichtig:** Wenn in GitHub Pages fälschlich Branch `main` + Ordner `/ (root)` gewählt wird, lädt der Browser die rohe Quell-HTML (`/src/main.tsx`), die ein statischer Server nicht direkt ausführen kann. Nutze daher **`/docs`** oder **GitHub Actions** (oder lade nur den Inhalt von `export/` in ein reines Pages-Repo hoch).

## 2. Eigener Server / Webspace (Apache, Nginx, Caddy)
1. Den Inhalt von `export/` (oder `docs/`) in das Webroot-Verzeichnis deines Servers kopieren (z. B. `/var/www/html/`).
2. Fertig — kein Node.js und kein `npm` auf dem Zielserver erforderlich.
