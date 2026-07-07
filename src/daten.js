// Laden & Aufbereiten der Renndaten. Die Daten werden NICHT hier gepflegt,
// sondern zur Laufzeit von der Hauptseite (aspl-rennkalender) per fetch()
// geholt — Single Source of Truth bleibt dort. Diese Datei rechnet daraus die
// Sichten fuers Cockpit (Startfelder, Wertungen, Fahrer-Statistik, Duelle).
import { berechneFahrerwertung, berechneTeamwertung } from './punkte.js'
import { slug } from './lib/format.js'

// Wo liegen die JSON-Exporte? Standard = Live-Hauptseite (dieselbe Domain,
// darum same-origin/CORS unkritisch). Ueberschreibbar per ?daten=<url> zum
// Testen gegen einen lokalen Hauptseiten-Server, z. B.
//   ?daten=http://localhost:5173/aspl-rennkalender/data/
const LIVE_BASIS = 'https://manoaverner-maker.github.io/aspl-rennkalender/data/'

export function datenBasis() {
  const ausUrl = new URLSearchParams(window.location.search).get('daten')
  let basis = ausUrl || import.meta.env.VITE_DATEN_BASIS || LIVE_BASIS
  return basis.endsWith('/') ? basis : basis + '/'
}

async function holeJson(url) {
  const antwort = await fetch(url, { cache: 'no-store' })
  if (!antwort.ok) throw new Error(`${url} → HTTP ${antwort.status}`)
  return antwort.json()
}

const CACHE_KEY = 'aspl_kom_cache_v1'

function baueDaten(basis, strecken, kalender, ergebnisse, stand, ausCache) {
  return {
    basis,
    strecken,
    kalender,
    ergebnisse,
    stand,
    ausCache,
    streckenMap: Object.fromEntries(strecken.map((s) => [s.id, s])),
  }
}

export async function ladeAlleDaten() {
  const basis = datenBasis()
  try {
    const [strecken, kalender, ergebnisse] = await Promise.all([
      holeJson(basis + 'strecken.json'),
      holeJson(basis + 'kalender.json'),
      holeJson(basis + 'ergebnisse.json'),
    ])
    const stand = Date.now()
    // Offline-Puffer aktualisieren, damit ein Netz-Blip im Stream die Seite nicht killt
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ basis, strecken, kalender, ergebnisse, stand }))
    } catch {
      /* Speicher voll / privater Modus — nicht kritisch */
    }
    return baueDaten(basis, strecken, kalender, ergebnisse, stand, false)
  } catch (err) {
    // Fetch fehlgeschlagen → letzten erfolgreichen Stand aus dem Puffer nehmen
    let roh = null
    try {
      roh = localStorage.getItem(CACHE_KEY)
    } catch {
      /* ignore */
    }
    if (roh) {
      const c = JSON.parse(roh)
      return { ...baueDaten(c.basis, c.strecken, c.kalender, c.ergebnisse, c.stand, true), fehler: err }
    }
    throw err
  }
}

// ---- Auswahl-Listen (Saison / Series) -------------------------------------

export function serienListe(kalender) {
  return [...kalender]
    .sort((a, b) => (a.sortierung ?? 99) - (b.sortierung ?? 99))
    .map((k) => ({
      saisonId: k.saisonId,
      saisonName: k.saisonName,
      seriesId: k.seriesId,
      seriesName: k.seriesName,
      comingSoon: !!k.comingSoon,
    }))
}

export function findeKalender(kalender, saisonId, seriesId) {
  return kalender.find((k) => k.saisonId === saisonId && k.seriesId === seriesId) ?? null
}

export function findeErgebnis(ergebnisse, saisonId, seriesId) {
  return ergebnisse.find((e) => e.saisonId === saisonId && e.seriesId === seriesId) ?? null
}

// Rennen (typ "rennen") eines Kalenders — in Kalender-Reihenfolge
export function rennenListe(kalenderObj, streckenMap) {
  if (!kalenderObj) return []
  return kalenderObj.eintraege
    .filter((e) => e.typ === 'rennen' && streckenMap[e.streckeId])
    .map((e) => ({
      id: e.runde + '-' + e.streckeId,
      runde: e.runde,
      streckeId: e.streckeId,
      datum: e.datum,
      verschobenAuf: e.verschobenAuf ?? null,
      strecke: streckenMap[e.streckeId],
    }))
}

// Punktesystem passend zur Series (Endurance → FIA, sonst DTM); pro
// Ergebnis-Datei via "punkteSystem" ueberschreibbar (wie auf der Hauptseite)
export function punkteSystemVon(kalenderObj, ergebnisObj) {
  return ergebnisObj?.punkteSystem ?? (kalenderObj?.seriesId === 'endurance' ? 'endurance' : 'dtm')
}

// Team-Series? — an den Daten festgemacht, nicht an der ID
export function istTeamSerie(ergebnisObj) {
  for (const liste of Object.values(ergebnisObj?.strecken ?? {})) {
    if (liste.some((e) => e.team)) return true
  }
  return false
}

// ---- Startfeld & Roster ----------------------------------------------------

// Klassierung eines einzelnen Rennens (dient zugleich als Startfeld)
export function startfeld(ergebnisObj, streckeId) {
  return ergebnisObj?.strecken?.[streckeId] ?? []
}

// Alle Fahrer der Series (ueber alle Rennen) — fuer Blitzsuche & Fallback-Feld.
// nr/team/fahrzeug werden auf den zuletzt bekannten Wert aktualisiert.
export function serienRoster(ergebnisObj) {
  const map = new Map()
  for (const liste of Object.values(ergebnisObj?.strecken ?? {})) {
    for (const e of liste) {
      const vorhanden = map.get(e.fahrer) ?? { fahrer: e.fahrer, nr: null, team: null, fahrzeug: null, rennen: 0 }
      if (e.nr != null) vorhanden.nr = e.nr
      if (e.team) vorhanden.team = e.team
      if (e.fahrzeug) vorhanden.fahrzeug = e.fahrzeug
      vorhanden.rennen += 1
      map.set(e.fahrer, vorhanden)
    }
  }
  return [...map.values()].sort((a, b) => a.fahrer.localeCompare(b.fahrer))
}

// ---- Wertungen -------------------------------------------------------------

function mitPosition(liste) {
  const fuehrer = liste[0]?.punkte ?? 0
  return liste.map((e, i) => ({ ...e, position: i + 1, rueckstand: fuehrer - e.punkte }))
}

export function wertung(ergebnisObj, system) {
  return {
    fahrer: mitPosition(berechneFahrerwertung(ergebnisObj?.strecken, system)),
    teams: mitPosition(berechneTeamwertung(ergebnisObj?.strecken, system)),
  }
}

// Kennzahlen eines Fahrers (Siege/Podien/Poles + Ergebnisliste je Rennen)
export function fahrerStatistik(ergebnisObj, fahrerName) {
  const stat = { siege: 0, podien: 0, poles: 0, rennen: 0, team: null, fahrzeug: null, nr: null, ergebnisse: [] }
  for (const [streckeId, liste] of Object.entries(ergebnisObj?.strecken ?? {})) {
    const e = liste.find((x) => x.fahrer === fahrerName)
    if (!e) continue
    stat.rennen += 1
    if (e.platz === 1) stat.siege += 1
    if (e.platz <= 3) stat.podien += 1
    if (e.quali === 1) stat.poles += 1
    if (e.team) stat.team = e.team
    if (e.fahrzeug) stat.fahrzeug = e.fahrzeug
    if (e.nr != null) stat.nr = e.nr
    stat.ergebnisse.push({ streckeId, platz: e.platz, quali: e.quali ?? null })
  }
  return stat
}

// Alle Infos, die die Fahrerkarte braucht, in einem Rutsch
export function fahrerDetails(ergebnisObj, system, fahrerName) {
  const w = wertung(ergebnisObj, system).fahrer
  const idx = w.findIndex((f) => f.fahrer === fahrerName)
  const inWertung = idx >= 0 ? w[idx] : null
  const stat = fahrerStatistik(ergebnisObj, fahrerName)
  return {
    fahrer: fahrerName,
    position: idx >= 0 ? idx + 1 : null,
    punkte: inWertung?.punkte ?? 0,
    rueckstand: inWertung?.rueckstand ?? null,
    ...stat,
  }
}

// Engstes Duell: kleinste Punktedifferenz zweier BENACHBARTER Fahrer in der
// Wertung (nur Fahrer mit mind. einem Rennen). Liefert null bei < 2 Fahrern.
export function engstesDuell(fahrerWertung) {
  const wertende = fahrerWertung.filter((f) => f.rennen > 0)
  if (wertende.length < 2) return null
  let beste = null
  for (let i = 1; i < wertende.length; i++) {
    const abstand = wertende[i - 1].punkte - wertende[i].punkte
    if (beste === null || abstand < beste.abstand) {
      beste = { vorne: wertende[i - 1], hinten: wertende[i], abstand }
    }
  }
  return beste
}

// Fakten-Topf fuer den Zufalls-Button: Strecken-Besonderheiten + befuellte
// Fahrer-Fun-Facts. Solange die redaktionellen Felder leer sind, kommen die
// Fakten nur aus den Streckendaten — der Button funktioniert also sofort.
export function faktenTopf(kalenderObj, streckenMap, ergebnisObj, redaktion) {
  const fakten = []
  const strecken = new Set(rennenListe(kalenderObj, streckenMap).map((r) => r.streckeId))
  for (const id of strecken) {
    const s = streckenMap[id]
    for (const b of s?.besonderheiten ?? []) {
      fakten.push({ text: b, quelle: s.kurzname })
    }
  }
  for (const f of serienRoster(ergebnisObj)) {
    const red = redaktion[slug(f.fahrer)]
    if (red?.funfact) fakten.push({ text: red.funfact, quelle: f.fahrer })
  }
  return fakten
}
