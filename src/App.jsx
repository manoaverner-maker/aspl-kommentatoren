import { useCallback, useEffect, useMemo, useState } from 'react'
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
import Vergleich from './routes/Vergleich.jsx'
import OverlaySteuerung from './routes/OverlaySteuerung.jsx'
import Strecken from './routes/Strecken.jsx'
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

function standText(stand, _takt) {
  if (!stand) return ''
  const min = Math.floor((Date.now() - stand) / 60000)
  if (min < 1) return 'gerade eben'
  if (min === 1) return 'vor 1 Min'
  if (min < 60) return `vor ${min} Min`
  return `vor ${Math.floor(min / 60)} Std`
}

export default function App() {
  const route = useRoute()
  const [zustand, setZustand] = useState({ lade: true, fehler: null, daten: null })
  const [saisonId, setSaisonId] = useState(null)
  const [seriesId, setSeriesId] = useState(null)
  const [streckeId, setStreckeId] = useState(null)
  const [offenerFahrer, setOffenerFahrer] = useState(null)
  const [takt, setTakt] = useState(0)

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

  // Auto-Refresh: neu eingetragene Ergebnisse ohne Reload übernehmen.
  // Auswahl (Saison/Series/Strecke) bleibt erhalten.
  const refresh = useCallback(() => {
    ladeAlleDaten()
      .then((daten) => setZustand((z) => (z.daten ? { ...z, daten } : z)))
      .catch(() => {
        /* offline & kein Puffer — aktuellen Stand behalten */
      })
  }, [])

  useEffect(() => {
    if (zustand.lade || zustand.fehler) return
    const timer = setInterval(refresh, 3 * 60 * 1000)
    const takter = setInterval(() => setTakt((t) => t + 1), 30 * 1000)
    const beiSichtbar = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', beiSichtbar)
    return () => {
      clearInterval(timer)
      clearInterval(takter)
      document.removeEventListener('visibilitychange', beiSichtbar)
    }
  }, [zustand.lade, zustand.fehler, refresh])

  const daten = zustand.daten

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
  const seriesInSaison = useMemo(() => serien.filter((s) => s.saisonId === saisonId), [serien, saisonId])

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

  // ---- Overlay: eigene, transparente Ansicht --------------------------------
  if (route.name === 'overlay') {
    return <Overlay route={route} daten={daten} lade={zustand.lade} redaktion={redaktion} />
  }

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

  const gemeinsam = {
    saisons,
    saisonId,
    seriesInSaison,
    seriesId,
    onSaison: wechsleSaison,
    onSeries: wechsleSeries,
    kontext,
    streckenMap: daten.streckenMap,
    onFahrer: setOffenerFahrer,
  }

  return (
    <div className="app">
      <Kopf route={route} />

      {route.name === 'meisterschaft' ? (
        <Meisterschaft {...gemeinsam} />
      ) : route.name === 'vergleich' ? (
        <Vergleich {...gemeinsam} />
      ) : route.name === 'overlays' ? (
        <OverlaySteuerung {...gemeinsam} />
      ) : route.name === 'strecken' ? (
        <Strecken daten={daten} kontext={kontext} />
      ) : (
        <GridUebersicht
          {...gemeinsam}
          daten={daten}
          streckeId={streckeId}
          onStrecke={setStreckeId}
          redaktion={redaktion}
        />
      )}

      {offenerFahrer && kontext && (
        <Fahrerkarte
          key={offenerFahrer + saisonId + seriesId}
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
        {daten?.ausCache && <span className="offline-badge">⚠ offline · Puffer</span>}
        <span className="stand">
          Stand {standText(daten?.stand, takt)}
          <button className="mini-refresh" onClick={refresh} title="Jetzt aktualisieren">
            ⟳
          </button>
        </span>
      </footer>
    </div>
  )
}

function Kopf({ route }) {
  const knopf = (name, hash, label) => (
    <button className={'nav-knopf' + (route.name === name ? ' aktiv' : '')} onClick={() => gehe(hash)}>
      {label}
    </button>
  )
  return (
    <header className="kopf">
      <div className="marke">
        <span className="aspl">ASPL</span>
        <span className="sub">Kommentatoren-Cockpit</span>
      </div>
      <nav className="kopf-nav">
        {knopf('grid', '#/', '🏁 Startfeld')}
        {knopf('meisterschaft', '#/meisterschaft', '🏆 Meisterschaft')}
        {knopf('vergleich', '#/vergleich', '⚔️ Vergleich')}
        {knopf('strecken', '#/strecken', '🗺️ Strecken')}
        {knopf('overlays', '#/overlays', '📺 Overlays')}
      </nav>
    </header>
  )
}
