import {
  findeKalender,
  findeErgebnis,
  punkteSystemVon,
  wertung,
  serienRoster,
} from '../daten.js'
import { slug, nummer } from '../lib/format.js'

// OBS-Browser-Source: kompaktes Lower-Third mit transparentem Hintergrund.
// Bewusst reduziert auf das, was auf dem Stream gut aussieht: Startnummer,
// Name, Team, Flagge, WM-Position. Eigene URL (#/overlay/<saison>/<series>/<slug>).
export default function Overlay({ route, daten, lade, redaktion }) {
  // Solange Daten laden: nichts zeigen (Seite bleibt transparent).
  if (lade || !daten) return null

  const ergebnisObj = findeErgebnis(daten.ergebnisse, route.saisonId, route.seriesId)
  const kalenderObj = findeKalender(daten.kalender, route.saisonId, route.seriesId)
  const system = punkteSystemVon(kalenderObj, ergebnisObj)
  const roster = serienRoster(ergebnisObj)
  const rosterEintrag = roster.find((f) => slug(f.fahrer) === route.slug)

  if (!rosterEintrag) {
    return (
      <div className="overlay-buehne">
        <div className="overlay-fehler">Fahrer nicht gefunden ({route.slug}).</div>
      </div>
    )
  }

  const w = wertung(ergebnisObj, system).fahrer
  const position = w.findIndex((f) => f.fahrer === rosterEintrag.fahrer) + 1
  const red = redaktion[route.slug] ?? {}

  return (
    <div className="overlay-buehne">
      <div className="lower-third">
        <div className="lt-nr">{nummer(rosterEintrag.nr)}</div>
        <div className="lt-koerper">
          <div className="lt-name">{rosterEintrag.fahrer}</div>
          <div className="lt-zeile">
            {red.flagge && <span className="flagge">{red.flagge}</span>}
            <span>{rosterEintrag.team || red.nation || 'ASPL GT3'}</span>
            {position > 0 && (
              <span className="lt-pos">
                <span className="wmp">P{position}</span>
                <span className="wml">WM</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
