# ASPL Kommentatoren-Cockpit

Schnelle, kontraststarke Live-Referenz für die ASPL-Rennkommentatoren — gedacht
für einen **zweiten Bildschirm neben dem Stream** (Desktop/Tablet, Querformat).
In unter zwei Sekunden scannbar: Startfelder, Fahrerkarten, Meisterschaftsstand,
Streckeninfos, automatische Storyline-Hinweise und ein OBS-Overlay.

> Eigenständiges, **internes** Projekt — bewusst **nicht** mit der öffentlichen
> Fan-Seite (aspl-rennkalender) verlinkt und nicht beworben (`noindex`).

## Daten — kommen live von der Hauptseite

Es werden **keine Renndaten hier gepflegt.** Beim Laden holt die Seite per
`fetch()` drei JSON-Dateien von der Hauptseite:

```
https://manoaverner-maker.github.io/aspl-rennkalender/data/strecken.json
https://manoaverner-maker.github.io/aspl-rennkalender/data/kalender.json
https://manoaverner-maker.github.io/aspl-rennkalender/data/ergebnisse.json
```

Diese werden dort automatisch bei jedem Build aus `src/data/` re-exportiert
(`scripts/export-daten.mjs`). Strecken, Termine und Ergebnisse pflegt man also
**nur an einem Ort** — in der Hauptseite. Die Meisterschafts-Rechenlogik in
`src/punkte.js` ist eine wortgleiche Kopie der Hauptseite, damit die Punkte
exakt übereinstimmen.

### Gegen lokale Daten testen

Mit `?daten=<basis-url>` lässt sich die Datenquelle umbiegen, z. B. gegen einen
lokal laufenden Hauptseiten-Dev-Server:

```
http://localhost:5174/aspl-kommentatoren/?daten=http://localhost:5173/aspl-rennkalender/data/
```

## Ansichten (Hash-Routing)

| URL | Ansicht |
|-----|---------|
| `#/` | Startfeld-Grid + Blitzsuche + Streckeninfo + engstes Duell + Zufalls-Fakt |
| `#/meisterschaft` | Fahrer- und (bei Team-Series) Teamwertung |
| `#/overlay/<saison>/<series>/<fahrer-slug>` | **OBS-Overlay** — Lower-Third, transparenter Hintergrund |

Das Overlay öffnet man aus jeder Fahrerkarte über **„📺 Auf Stream zeigen"**
(neues Fenster) bzw. **„🔗 Overlay-URL kopieren"** — diese URL kommt direkt als
Browser-Source in OBS (transparenter Hintergrund, kein Rand, keine Navigation).

## Redaktionelle Inhalte (Spitzname, Aussprache, Fun Fact, Rivalität, Nation)

Diese Felder pflegt das Kommentatoren-Team selbst in
[`src/data/redaktion.json`](src/data/redaktion.json) — Schlüssel ist der
Fahrer-Slug (z. B. `lukas-knips`). Alle aktuellen Fahrer sind bereits mit leeren
Feldern angelegt; einfach ausfüllen, committen, fertig. Der Zufalls-Fakt-Button
zieht aus den befüllten Fun-Facts **und** den Strecken-Besonderheiten — er
funktioniert also sofort, auch solange die Fahrer-Felder noch leer sind.

Kamen neue Fahrer dazu, ergänzt dieser Helfer die fehlenden (leeren) Einträge,
ohne bestehende Inhalte zu überschreiben:

```powershell
node scripts/redaktion-skeleton.mjs
# oder gegen die Live-Daten:
node scripts/redaktion-skeleton.mjs https://manoaverner-maker.github.io/aspl-rennkalender/data/ergebnisse.json
```

## Entwicklung

```powershell
npm install
npm run dev       # lokaler Dev-Server
npm run build     # Produktions-Build nach dist/
npm run preview   # dist/ lokal ansehen
```

Deployment läuft automatisch über GitHub Actions bei jedem Push auf `main`
(`.github/workflows/deploy.yml`) → GitHub Pages.

---

Manoa Verner · ASPL · 2026
