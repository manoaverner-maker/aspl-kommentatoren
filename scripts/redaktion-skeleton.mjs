// Einmal-Helfer: erzeugt/ergaenzt src/data/redaktion.json mit einem leeren
// Eintrag je Fahrer, der aktuell in den Ergebnissen der Hauptseite vorkommt.
// Bestehende (bereits befuellte) Eintraege bleiben unangetastet — der Helfer
// fuegt nur fehlende Fahrer hinzu. So kann man ihn nach neuen Rennen erneut
// laufen lassen, ohne redaktionelle Inhalte zu verlieren.
//
// Aufruf:  node scripts/redaktion-skeleton.mjs [pfad-oder-url-zu-ergebnisse.json]
// Default liest die lokal gebaute Kopie der Hauptseite.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..')
const zielDatei = join(wurzel, 'src', 'data', 'redaktion.json')

const quelle =
  process.argv[2] ||
  join(wurzel, '..', 'aspl-rennkalender', 'public', 'data', 'ergebnisse.json')

// identisch zur slug()-Funktion der App (src/lib/format.js)
function slug(name) {
  return String(name)
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function ladeErgebnisse(q) {
  if (/^https?:/.test(q)) return (await fetch(q)).json()
  return JSON.parse(readFileSync(q, 'utf8'))
}

const ergebnisse = await ladeErgebnisse(quelle)

// alle Fahrernamen einsammeln
const namen = new Set()
for (const serie of ergebnisse) {
  for (const liste of Object.values(serie.strecken ?? {})) {
    for (const e of liste) if (e.fahrer) namen.add(e.fahrer)
  }
}

const bestehend = existsSync(zielDatei) ? JSON.parse(readFileSync(zielDatei, 'utf8')) : {}
let neu = 0
for (const name of [...namen].sort((a, b) => a.localeCompare(b))) {
  const key = slug(name)
  if (bestehend[key]) continue
  bestehend[key] = {
    name,
    nation: '',
    flagge: '',
    spitzname: '',
    aussprache: '',
    funfact: '',
    rivalitaet: '',
  }
  neu++
}

mkdirSync(dirname(zielDatei), { recursive: true })
writeFileSync(zielDatei, JSON.stringify(bestehend, null, 2) + '\n', 'utf8')
console.log(
  `[redaktion-skeleton] ${namen.size} Fahrer gesamt, ${neu} neu ergaenzt -> src/data/redaktion.json`
)
