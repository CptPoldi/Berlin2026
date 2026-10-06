# Berlin Karteikarten – Webapp (25.–31.10.2026)

Statische Web-App (PWA) ohne Server und ohne Build-Schritt. Funktioniert nach dem ersten Laden offline.

## Auf GitHub Pages veröffentlichen
1. Auf github.com ein neues Repository anlegen (z. B. `berlin-2026`). Privat geht nur mit bezahltem Plan, sonst „Public“ – die Seite enthält nichts Persönliches, aber nenne das Repo ggf. neutral.
2. Den **Inhalt dieses Ordners** (nicht den Ordner selbst) hochladen: „Add file → Upload files“, alle Dateien/Ordner hineinziehen (`index.html`, `app.js`, `app.css`, `sw.js`, `manifest.webmanifest`, `data/`, `icons/`, `tools/`), „Commit changes“.
3. Repository → **Settings → Pages** → Source: „Deploy from a branch“, Branch `main`, Ordner `/ (root)` → Save.
4. Nach ca. 1–2 Minuten ist die App unter `https://DEIN-NAME.github.io/berlin-2026/` erreichbar.
5. Auf jedem Handy die URL **einmal mit Internet öffnen** (damit der Offline-Speicher gefüllt wird), dann „Zum Home-Bildschirm hinzufügen“ (iOS: Teilen-Symbol; Android/Chrome: Menü → App installieren). Der Link lässt sich als QR-Code verteilen.

## Inhalte ändern
Alles Inhaltliche steht in `data/stationen.json` (Öffnungszeiten `sched`, Texte `dd`, Links `links`, Reservierung `res`). Nach einer Änderung auf GitHub im Ordner `sw.js` die erste Zeile `const V='berlin-v1'` auf `berlin-v2` ändern, damit Handys die neue Version laden.

## Wichtig / Grenzen
- **Häkchen und Notizen liegen nur lokal auf dem jeweiligen Handy** (kein Sync). Übertragen geht über „Infos → Backup“.
- **Externe Links wurden nicht automatisch geprüft.** Mit `python3 tools/check_links.py` auf dem eigenen Rechner testen (403/429 kann Bot-Schutz sein). Wikipedia-Links sind Suchlinks und landen auch bei Titeländerungen richtig.
- Öffnungszeiten, Preise, Reservierungspflichten: Stand 06.10.2026, vor dem Besuch prüfen. Offen/unsicher: Ehrenmal Bundeswehr (Freitag), Örnek (Adresse Kottbusser Damm 98 vs. Karl-Marx-Straße 109), Herbstferien-Termine, Plötzensee-Öffnung.
- „Route ab Standort“ öffnet Google Maps mit ÖPNV ab aktuellem Standort (Standortfreigabe nötig); „Route ab Hotel“ startet in der Stülerstraße 6.
- Die Deep-Dive-Texte sind eigene Zusammenfassungen zur Orientierung, keine Quellenangabe pro Satz.
