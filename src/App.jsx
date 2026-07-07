import { useEffect, useMemo, useState } from 'react'
import { useRoute, gehe } from './lib/router.js'
import {
  ladeAlleDaten,
  serienListe,
  findeKalender,
  findeErgebnis,
  rennenListe,
  punkteSystemVon,
  istTeamSerie,
  startfeld,
  wertung,
  serienRoster,
} from './daten.js'
import redaktion from './data/redaktion.json'
import GridUebersicht from './routes/GridUebersicht.jsx'
import Meisterschaft from './routes/Meisterschaft.jsx'
import Overlay from './routes/Overlay.jsx'
import Fahrerkarte from './komponenten/Fahrerkarte.jsx'

// Standard-Strecke: das juengste Rennen mit Ergebnissen, sonst das erste Rennen
function standardStrecke(kalenderObj, ergebnisObj, streckenMap) {
  const rennen = rennenListe(kalenderObj, streckenMap)
  for (let i = rennen.length - 1; i >= 0; i--) {
    if (startfeld(ergebnisObj, rennen[i].streckeId).length) return rennen[i].streckeId
  }
  return rennen[0]?.streckeId ?? null
}

export default function App() {
  const route = useRoute()
  const [zustand, setZustand] = useState({ lade: true, fehler: null, daten: null })
  const [saisonId, setSaisonId] = useState(null)
  const [seriesId, setSeriesId] = useState(null)
  const [streckeId, setStreckeId] = useState(null)
  const [offenerFahrer, setOffenerFahrer] = useState(null)

  // Overlay-Route -> Body transparent halten, sonst dunkel
  useEffect(() => {
    document.body.classList.toggle('overlay-modus', route.name === 'overlay')
  }, [route.name])

  // Daten einmalig laden
  useEffect(() => {
    let aktiv = true
    ladeAlleDaten()
      .then((daten) => {
        if (!aktiv) return
        const serien = serienListe(daten.kalender)
        const erste = serien.find((s) => !s.comingSoon) ?? serien[0]
        setZustand({ lade: false, fehler: null, daten })
        if (erste) {
          setSaisonId(erste.saisonId)
          setSeriesId(erste.seriesId)
          const k = findeKalender(daten.kalender, erste.saisonId, erste.seriesId)
          const e = findeErgebnis(daten.ergebnisse, erste.saisonId, erste.seriesId)
          setStreckeId(standardStrecke(k, e, daten.streckenMap))
        }
      })
      .catch((fehler) => aktiv && setZustand({ lade: false, fehler, daten: null }))
    return () => {
      aktiv = false
    }
  }, [])

  const daten = zustand.daten

  // Abgeleitete Sicht der aktuell gewaehlten Saison+Series
  const kontext = useMemo(() => {
    if (!daten || !saisonId || !seriesId) return null
    const kalenderObj = findeKalender(daten.kalender, saisonId, seriesId)
    const ergebnisObj = findeErgebnis(daten.ergebnisse, saisonId, seriesId)
    const system = punkteSystemVon(kalenderObj, ergebnisObj)
    return {
      kalenderObj,
      ergebnisObj,
      system,
      teamSerie: istTeamSerie(ergebnisObj),
      rennen: rennenListe(kalenderObj, daten.streckenMap),
      wertung: wertung(ergebnisObj, system),
      roster: serienRoster(ergebnisObj),
    }
  }, [daten, saisonId, seriesId])

  const serien = useMemo(() => (daten ? serienListe(daten.kalender) : []), [daten])
  const saisons = useMemo(() => {
    const m = new Map()
    serien.forEach((s) => m.set(s.saisonId, s.saisonName))
    return [...m.entries()].map(([id, name]) => ({ id, name }))
  }, [serien])
  const seriesInSaison = useMemo(
    () => serien.filter((s) => s.saisonId === saisonId),
    [serien, saisonId]
  )

  function wechsleSaison(neueSaison) {
    const ziel = serien.find((s) => s.saisonId === neueSaison && s.seriesId === seriesId)
      ? seriesId
      : serien.find((s) => s.saisonId === neueSaison)?.seriesId
    setSaisonId(neueSaison)
    setSeriesId(ziel)
    setOffenerFahrer(null)
    const k = findeKalender(daten.kalender, neueSaison, ziel)
    const e = findeErgebnis(daten.ergebnisse, neueSaison, ziel)
    setStreckeId(standardStrecke(k, e, daten.streckenMap))
  }
  function wechsleSeries(neueSeries) {
    setSeriesId(neueSeries)
    setOffenerFahrer(null)
    const k = findeKalender(daten.kalender, saisonId, neueSeries)
    const e = findeErgebnis(daten.ergebnisse, saisonId, neueSeries)
    setStreckeId(standardStrecke(k, e, daten.streckenMap))
  }

  // ---- Overlay: eigene, minimalistische Ansicht (transparenter Hintergrund) --
  if (route.name === 'overlay') {
    return <Overlay route={route} daten={daten} lade={zustand.lade} redaktion={redaktion} />
  }

  // ---- Lade- / Fehlerzustand ------------------------------------------------
  if (zustand.lade) {
    return (
      <div className="app">
        <Kopf route={route} />
        <div className="zentrier">
          <div className="status-box">
            <div className="spin" />
            <h2>Renndaten werden geladen …</h2>
            <p>Direkt von der ASPL-Hauptseite.</p>
          </div>
        </div>
      </div>
    )
  }
  if (zustand.fehler) {
    return (
      <div className="app">
        <Kopf route={route} />
        <div className="zentrier">
          <div className="status-box">
            <h2>⚠️ Daten nicht erreichbar</h2>
            <p>
              Die Renndaten der Hauptseite konnten nicht geladen werden. Besteht eine
              Internetverbindung? Ist die Hauptseite online?
            </p>
            <code>{String(zustand.fehler.message || zustand.fehler)}</code>
            <p style={{ marginTop: 14 }}>
              <button className="knopf-voll" onClick={() => window.location.reload()}>
                🔄 Erneut versuchen
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Kopf route={route} />

      {route.name === 'meisterschaft' ? (
        <Meisterschaft
          saisons={saisons}
          saisonId={saisonId}
          seriesInSaison={seriesInSaison}
          seriesId={seriesId}
          onSaison={wechsleSaison}
          onSeries={wechsleSeries}
          kontext={kontext}
          onFahrer={setOffenerFahrer}
        />
      ) : (
        <GridUebersicht
          daten={daten}
          saisons={saisons}
          saisonId={saisonId}
          seriesInSaison={seriesInSaison}
          seriesId={seriesId}
          streckeId={streckeId}
          onSaison={wechsleSaison}
          onSeries={wechsleSeries}
          onStrecke={setStreckeId}
          kontext={kontext}
          redaktion={redaktion}
          onFahrer={setOffenerFahrer}
        />
      )}

      {offenerFahrer && kontext && (
        <Fahrerkarte
          fahrerName={offenerFahrer}
          saisonId={saisonId}
          seriesId={seriesId}
          kontext={kontext}
          streckenMap={daten.streckenMap}
          redaktion={redaktion}
          onClose={() => setOffenerFahrer(null)}
        />
      )}

      <footer className="fuss">
        <span>ASPL Kommentatoren-Cockpit · intern</span>
        <span className="basis">Daten: {daten?.basis}</span>
      </footer>
    </div>
  )
}

function Kopf({ route }) {
  return (
    <header className="kopf">
      <div className="marke">
        <span className="aspl">ASPL</span>
        <span className="sub">Kommentatoren-Cockpit</span>
      </div>
      <nav className="kopf-nav">
        <button
          className={'nav-knopf' + (route.name === 'grid' ? ' aktiv' : '')}
          onClick={() => gehe('#/')}
        >
          🏁 Startfeld
        </button>
        <button
          className={'nav-knopf' + (route.name === 'meisterschaft' ? ' aktiv' : '')}
          onClick={() => gehe('#/meisterschaft')}
        >
          🏆 Meisterschaft
        </button>
      </nav>
    </header>
  )
}
