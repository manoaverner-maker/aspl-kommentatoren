import { useEffect, useState } from 'react'
import {
  findeKalender,
  findeErgebnis,
  punkteSystemVon,
  wertung,
  serienRoster,
  engstesDuell,
} from '../daten.js'
import { podium } from '../analyse.js'
import { naechstesRennen, rennZeitpunkt, restzeitText, formatDatum } from '../lib/status.js'
import { slug, nummer } from '../lib/format.js'

// OBS-Browser-Sources: transparenter Hintergrund, reduziert aufs Wesentliche.
// Typen: fahrer | standings | podium | duell | next.
// Optionen per Hash-Query: ?pos=rechts, ?hide=<sekunden>.
// Selbst-aktualisierend, weil die App die Daten periodisch neu lädt (App.jsx).
export default function Overlay({ route, daten, lade, redaktion }) {
  if (lade || !daten) return null

  const ergebnisObj = findeErgebnis(daten.ergebnisse, route.saisonId, route.seriesId)
  const kalenderObj = findeKalender(daten.kalender, route.saisonId, route.seriesId)
  const system = punkteSystemVon(kalenderObj, ergebnisObj)
  const pos = route.query.get('pos') === 'rechts' ? 'rechts' : 'links'
  const hide = Number(route.query.get('hide')) || 0

  let inhalt
  switch (route.typ) {
    case 'standings':
      inhalt = <Standings ergebnisObj={ergebnisObj} system={system} />
      break
    case 'podium':
      inhalt = <Podium ergebnisObj={ergebnisObj} streckeId={route.arg} streckenMap={daten.streckenMap} />
      break
    case 'duell':
      inhalt = <Duell ergebnisObj={ergebnisObj} system={system} />
      break
    case 'next':
      inhalt = <Next kalenderObj={kalenderObj} streckenMap={daten.streckenMap} />
      break
    case 'fahrer':
    default:
      inhalt = (
        <Fahrer ergebnisObj={ergebnisObj} system={system} slugArg={route.arg} redaktion={redaktion} />
      )
  }

  return (
    <Buehne pos={pos} hide={hide}>
      {inhalt}
    </Buehne>
  )
}

function Buehne({ pos, hide, children }) {
  const [sichtbar, setSichtbar] = useState(true)
  useEffect(() => {
    if (hide > 0) {
      const t = setTimeout(() => setSichtbar(false), hide * 1000)
      return () => clearTimeout(t)
    }
  }, [hide])
  if (!sichtbar) return null
  return <div className={'overlay-buehne' + (pos === 'rechts' ? ' pos-rechts' : '')}>{children}</div>
}

// ---- Fahrer-Lower-Third ---------------------------------------------------

function Fahrer({ ergebnisObj, system, slugArg, redaktion }) {
  const roster = serienRoster(ergebnisObj)
  const eintrag = roster.find((f) => slug(f.fahrer) === slugArg)
  if (!eintrag) return <div className="overlay-fehler">Fahrer nicht gefunden ({slugArg}).</div>
  const w = wertung(ergebnisObj, system).fahrer
  const position = w.findIndex((f) => f.fahrer === eintrag.fahrer) + 1
  const red = redaktion[slugArg] ?? {}
  return (
    <div className="lower-third">
      <div className="lt-nr">{nummer(eintrag.nr)}</div>
      <div className="lt-koerper">
        <div className="lt-name">{eintrag.fahrer}</div>
        <div className="lt-zeile">
          {red.flagge && <span className="flagge">{red.flagge}</span>}
          <span>{eintrag.team || red.nation || 'ASPL GT3'}</span>
          {position > 0 && (
            <span className="lt-pos">
              <span className="wmp">P{position}</span>
              <span className="wml">WM</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Standings-Ticker (Top 5) ---------------------------------------------

function Standings({ ergebnisObj, system }) {
  const w = wertung(ergebnisObj, system).fahrer.slice(0, 5)
  if (!w.length) return null
  return (
    <div className="ov-tafel">
      <div className="ov-bar">Fahrerwertung · Top 5</div>
      <div className="ov-rows">
        {w.map((f) => (
          <div className="ov-row" key={f.fahrer}>
            <span className={'ov-pos ' + posKlasse(f.position)}>{f.position}</span>
            <span className="ov-name">{f.fahrer}</span>
            <span className="ov-pts">{f.punkte}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Podium ---------------------------------------------------------------

function Podium({ ergebnisObj, streckeId, streckenMap }) {
  const p = podium(ergebnisObj, streckeId)
  if (!p.length) return null
  const s = streckenMap[streckeId]
  return (
    <div className="ov-tafel">
      <div className="ov-bar">
        {s?.flagge} {s?.kurzname ?? streckeId} · Podium
      </div>
      <div className="ov-rows">
        {p.map((e) => (
          <div className="ov-row" key={e.platz}>
            <span className={'ov-pos ' + posKlasse(e.platz)}>{e.platz}</span>
            <span className="ov-name">{e.fahrer}</span>
            {e.team && <span className="ov-team">{e.team}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Engstes Duell --------------------------------------------------------

function Duell({ ergebnisObj, system }) {
  const d = engstesDuell(wertung(ergebnisObj, system).fahrer)
  if (!d) return null
  return (
    <div className="ov-tafel ov-duell">
      <div className="ov-bar">⚔️ Engstes Duell</div>
      <div className="ov-duell-body">
        <div className="ovd-fahrer">
          <div className="ovd-name">P{d.vorne.position} {d.vorne.fahrer}</div>
          <div className="ovd-pkt">{d.vorne.punkte}</div>
        </div>
        <div className="ovd-mitte">
          <div className="ovd-abstand">{d.abstand}</div>
          <div className="ovd-lab">Pkt</div>
        </div>
        <div className="ovd-fahrer rechts">
          <div className="ovd-name">P{d.hinten.position} {d.hinten.fahrer}</div>
          <div className="ovd-pkt">{d.hinten.punkte}</div>
        </div>
      </div>
    </div>
  )
}

// ---- Nächstes Rennen ------------------------------------------------------

function Next({ kalenderObj, streckenMap }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 30000)
    return () => clearInterval(t)
  }, [])
  const r = naechstesRennen(kalenderObj, streckenMap)
  if (!r) return null
  const ziel = rennZeitpunkt(r, kalenderObj?.zeiten)
  return (
    <div className="ov-tafel ov-next">
      <div className="ov-bar">🏁 Nächstes Rennen</div>
      <div className="ov-next-body">
        <div className="ovn-strecke">
          {r.strecke.flagge} {r.runde} · {r.strecke.kurzname}
        </div>
        <div className="ovn-datum">{formatDatum(r.eff)}</div>
        {ziel && <div className="ovn-cd">{restzeitText(ziel)}</div>}
      </div>
    </div>
  )
}

function posKlasse(p) {
  return p === 1 ? 'p1' : p === 2 ? 'p2' : p === 3 ? 'p3' : ''
}
