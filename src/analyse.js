// Auto-Storylines: alles selbstberechnet aus den Ergebnissen, kein Pflege-
// aufwand. Form-Kurven, Titel-Rechner, Rekorde, Bewegungen in der Wertung,
// Head-to-Head und automatische Talking-Points.
import { berechneFahrerwertung, maxPunkteProRennen } from './punkte.js'

// streckeIds in Kalender-Reihenfolge, die tatsaechlich Ergebnisse haben
export function gefahreneRennen(rennenListe, ergebnisObj) {
  return rennenListe
    .map((r) => r.streckeId)
    .filter((id) => ergebnisObj?.strecken?.[id]?.length)
}

// Letzte n Ergebnisse eines Fahrers (in Renn-Reihenfolge)
export function formKurve(rennenListe, ergebnisObj, fahrer, n = 3) {
  const res = []
  for (const r of rennenListe) {
    const e = ergebnisObj?.strecken?.[r.streckeId]?.find((x) => x.fahrer === fahrer)
    if (e) res.push({ streckeId: r.streckeId, runde: r.runde, platz: e.platz, quali: e.quali ?? null })
  }
  return res.slice(-n)
}

export function formTrend(form) {
  if (form.length < 2) return 'gleich'
  const a = form[0].platz
  const b = form[form.length - 1].platz
  return b < a ? 'auf' : b > a ? 'ab' : 'gleich'
}

// ---- Titel-Rechner --------------------------------------------------------

export function verbleibendeRennenAnzahl(rennenListe, ergebnisObj) {
  return rennenListe.filter((r) => !ergebnisObj?.strecken?.[r.streckeId]?.length).length
}

export function titelSzenario(fahrerWertung, verbleibend, system) {
  if (!fahrerWertung.length) return null
  const maxProRennen = maxPunkteProRennen(system)
  const maxRest = verbleibend * maxProRennen
  const leader = fahrerWertung[0]
  const zweiter = fahrerWertung[1]
  // Titel entschieden, wenn der Zweite selbst mit allen Restpunkten nicht mehr
  // an den Führenden herankommt (bzw. keine Rennen mehr offen sind).
  const entschieden = verbleibend === 0 || (zweiter ? zweiter.punkte + maxRest < leader.punkte : true)
  // "noch im Titelrennen": kann den aktuellen Führenden rechnerisch noch einholen
  const nochImRennen = fahrerWertung.filter(
    (f) => f.fahrer === leader.fahrer || f.punkte + maxRest >= leader.punkte
  )
  // Kann der Führende beim nächsten Rennen den Titel klarmachen? — im besten
  // Fall (Führender gewinnt, Zweiter geht leer aus) wird der Vorsprung so gross,
  // dass der Zweite mit allen dann noch verbleibenden Rennen nicht mehr herankommt.
  const restNachNaechstem = Math.max(0, verbleibend - 1) * maxProRennen
  const klarBeimNaechsten =
    !entschieden &&
    verbleibend > 0 &&
    (!zweiter || leader.punkte - zweiter.punkte + maxProRennen > restNachNaechstem)
  return { leader, verbleibend, maxRest, maxProRennen, entschieden, nochImRennen, klarBeimNaechsten }
}

// ---- Bewegungen seit dem letzten Rennen -----------------------------------

export function bewegungen(rennenListe, ergebnisObj, system) {
  const gefahren = gefahreneRennen(rennenListe, ergebnisObj)
  if (gefahren.length < 1) return { map: {}, letzteRunde: null }
  const letzteId = gefahren[gefahren.length - 1]

  const full = berechneFahrerwertung(ergebnisObj.strecken, system)
  const posFull = new Map(full.map((f, i) => [f.fahrer, i + 1]))

  const vorher = {}
  for (const [id, liste] of Object.entries(ergebnisObj.strecken)) {
    if (id !== letzteId) vorher[id] = liste
  }
  const before = berechneFahrerwertung(vorher, system)
  const posBefore = new Map(before.map((f, i) => [f.fahrer, i + 1]))

  const map = {}
  for (const f of full) {
    const vor = posBefore.get(f.fahrer)
    map[f.fahrer] = vor == null ? { delta: null, neu: true } : { delta: vor - posFull.get(f.fahrer), neu: false }
  }
  const letzteRunde = rennenListe.find((r) => r.streckeId === letzteId)?.runde ?? null
  return { map, letzteRunde }
}

// ---- Rekorde & Superlative ------------------------------------------------

export function saisonRekorde(rennenListe, ergebnisObj, system) {
  const wertung = berechneFahrerwertung(ergebnisObj?.strecken, system)
  if (!wertung.length) return null
  const order = gefahreneRennen(rennenListe, ergebnisObj)

  const stats = new Map()
  for (const f of wertung) {
    stats.set(f.fahrer, { fahrer: f.fahrer, siege: f.siege, poles: 0, top5: 0, platzSum: 0, rennen: 0, streakMax: 0, streakCur: 0 })
  }
  for (const id of order) {
    const gesehen = new Set()
    for (const e of ergebnisObj.strecken[id]) {
      const s = stats.get(e.fahrer)
      if (!s) continue
      s.rennen += 1
      s.platzSum += e.platz
      if (e.quali === 1) s.poles += 1
      if (e.platz <= 5) s.top5 += 1
      if (e.platz <= 3) {
        s.streakCur += 1
        if (s.streakCur > s.streakMax) s.streakMax = s.streakCur
      } else s.streakCur = 0
      gesehen.add(e.fahrer)
    }
    for (const [f, s] of stats) if (!gesehen.has(f)) s.streakCur = 0
  }

  const arr = [...stats.values()].map((s) => ({ ...s, schnitt: s.rennen ? s.platzSum / s.rennen : 99 }))
  const top = (key) => arr.slice().sort((a, b) => b[key] - a[key])[0]
  const minRennen = Math.max(1, Math.ceil(order.length / 2))

  return {
    meisteSiege: top('siege'),
    meistePoles: top('poles'),
    meisteTop5: top('top5'),
    laengstePodestserie: top('streakMax'),
    besterSchnitt: arr.filter((a) => a.rennen >= minRennen).sort((a, b) => a.schnitt - b.schnitt)[0] ?? null,
  }
}

// ---- Automatische Talking-Points (Fahrerkarte) ----------------------------

export function talkingPoints(details, fahrerWertung, form) {
  const p = []
  const leader = fahrerWertung[0]
  if (details.position === 1) {
    p.push(`Führt die Wertung mit ${details.punkte} Punkten an`)
  } else if (details.position) {
    p.push(`P${details.position} der Wertung · ${details.rueckstand} Pkt hinter ${leader?.fahrer}`)
  }
  if (details.siege > 0) p.push(`${details.siege} Saisonsieg${details.siege > 1 ? 'e' : ''}`)
  if (details.poles > 0) p.push(`${details.poles} Pole-Position${details.poles > 1 ? 'en' : ''}`)

  let podStreak = 0
  for (let i = form.length - 1; i >= 0; i--) {
    if (form[i].platz <= 3) podStreak++
    else break
  }
  if (podStreak >= 2) p.push(`${podStreak} Podestplätze in Folge`)
  if (details.rennen > 1 && details.podien === details.rennen) p.push('In jedem Rennen auf dem Podium')

  if (form.length >= 2) {
    const t = formTrend(form)
    if (t === 'auf') p.push('Formkurve zuletzt steigend')
    if (t === 'ab') p.push('Formkurve zuletzt fallend')
  }
  if (details.position && details.position > 1 && details.rueckstand != null && details.rueckstand <= 10) {
    p.push('In Schlagdistanz zur Tabellenspitze')
  }
  return p
}

// ---- Head-to-Head ---------------------------------------------------------

export function direktvergleich(rennenListe, ergebnisObj, aName, bName) {
  const zeilen = []
  let aVorn = 0
  let bVorn = 0
  for (const r of rennenListe) {
    const liste = ergebnisObj?.strecken?.[r.streckeId]
    if (!liste) continue
    const ea = liste.find((x) => x.fahrer === aName)
    const eb = liste.find((x) => x.fahrer === bName)
    if (!ea && !eb) continue
    if (ea && eb) {
      if (ea.platz < eb.platz) aVorn++
      else if (eb.platz < ea.platz) bVorn++
    }
    zeilen.push({ runde: r.runde, streckeId: r.streckeId, a: ea ? ea.platz : null, b: eb ? eb.platz : null })
  }
  return { zeilen, aVorn, bVorn }
}

// ---- Podium eines Rennens -------------------------------------------------

export function podium(ergebnisObj, streckeId) {
  const liste = ergebnisObj?.strecken?.[streckeId] ?? []
  return liste.filter((e) => e.platz <= 3).sort((a, b) => a.platz - b.platz)
}
