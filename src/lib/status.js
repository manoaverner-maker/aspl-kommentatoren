// Renn-Status + Termine — abgeleitet vom Datum, analog zur Hauptseite
// (aspl-rennkalender/src/utils/status.js). Wird fuers "Nächstes Rennen" und
// den Countdown gebraucht.
const RENNENDE = 'T23:00:00'

export function effektivesDatum(e) {
  return e.verschobenAuf || e.datum
}

export function berechneStatus(datum, verschobenAuf) {
  const eff = verschobenAuf || datum
  if (!eff || eff === 'TBD') return 'tbd'
  const ende = new Date(eff + RENNENDE)
  if (Date.now() > ende.getTime()) return 'gefahren'
  return verschobenAuf ? 'verschoben' : 'ausstehend'
}

// Nächstes anstehendes (oder verschobenes) Rennen des Kalenders
export function naechstesRennen(kalenderObj, streckenMap) {
  if (!kalenderObj) return null
  const kandidaten = kalenderObj.eintraege
    .filter((e) => e.typ === 'rennen' && streckenMap[e.streckeId])
    .map((e) => ({
      ...e,
      status: berechneStatus(e.datum, e.verschobenAuf),
      eff: effektivesDatum(e),
      strecke: streckenMap[e.streckeId],
    }))
    .filter((e) => e.status === 'ausstehend' || e.status === 'verschoben')
    .sort((a, b) => (a.eff || '').localeCompare(b.eff || ''))
  return kandidaten[0] ?? null
}

// Zeitpunkt fuer den Countdown: Renndatum + Quali-/Startzeit
export function rennZeitpunkt(rennen, zeiten) {
  const datum = rennen?.eff || rennen?.verschobenAuf || rennen?.datum
  if (!datum || datum === 'TBD') return null
  const zeit = rennen.startzeit || zeiten?.quali || zeiten?.rennstart || '20:00'
  const d = new Date(`${datum}T${zeit}:00`)
  return isNaN(d.getTime()) ? null : d
}

export function formatDatum(datum) {
  if (!datum || datum === 'TBD') return 'Termin folgt'
  const d = new Date(datum + 'T12:00:00')
  if (isNaN(d.getTime())) return datum
  return d.toLocaleDateString('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Restzeit hübsch: "3 T 4 Std" / "2 Std 14 Min" / "12 Min"
export function restzeitText(ziel) {
  if (!ziel) return null
  const ms = ziel.getTime() - Date.now()
  if (ms <= 0) return 'LÄUFT / vorbei'
  const min = Math.floor(ms / 60000)
  const tage = Math.floor(min / 1440)
  const std = Math.floor((min % 1440) / 60)
  const restMin = min % 60
  if (tage > 0) return `${tage} T ${std} Std`
  if (std > 0) return `${std} Std ${restMin} Min`
  return `${restMin} Min`
}
