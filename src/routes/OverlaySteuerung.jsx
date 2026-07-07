import { useEffect, useMemo, useState } from 'react'
import Selektoren from '../komponenten/Selektoren.jsx'
import { overlayUrl } from '../lib/router.js'
import { slug, nummer } from '../lib/format.js'

// Steuerpult für die OBS-Overlays: URLs zum Kopieren + Öffnen.
export default function OverlaySteuerung({
  saisons,
  saisonId,
  seriesInSaison,
  seriesId,
  onSaison,
  onSeries,
  kontext,
  streckenMap,
}) {
  const rennenMitErgebnis = kontext.rennen.filter((r) => kontext.ergebnisObj?.strecken?.[r.streckeId]?.length)
  const standardFahrer = kontext.wertung.fahrer[0]?.fahrer ?? kontext.roster[0]?.fahrer ?? ''
  const standardStreckeId = rennenMitErgebnis[rennenMitErgebnis.length - 1]?.streckeId ?? ''

  const [pos, setPos] = useState('links')
  const [hide, setHide] = useState('')
  const [fahrer, setFahrer] = useState(standardFahrer)
  const [strecke, setStrecke] = useState(standardStreckeId)

  // Bei Saison-/Series-Wechsel gültige Defaults setzen
  useEffect(() => {
    setFahrer(standardFahrer)
    setStrecke(standardStreckeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saisonId, seriesId])

  const opts = useMemo(() => {
    const o = {}
    if (pos === 'rechts') o.pos = 'rechts'
    if (hide && Number(hide) > 0) o.hide = String(Number(hide))
    return o
  }, [pos, hide])

  const eintraege = [
    {
      key: 'fahrer',
      titel: 'Fahrer-Karte',
      beschreibung: 'Startnummer, Name, Team, WM-Position',
      picker: (
        <select value={fahrer} onChange={(e) => setFahrer(e.target.value)}>
          {kontext.roster.map((f) => (
            <option key={f.fahrer} value={f.fahrer}>
              {nummer(f.nr)} · {f.fahrer}
            </option>
          ))}
        </select>
      ),
      url: overlayUrl('fahrer', saisonId, seriesId, slug(fahrer), opts),
    },
    {
      key: 'standings',
      titel: 'Standings-Ticker',
      beschreibung: 'Top 5 der Fahrerwertung',
      url: overlayUrl('standings', saisonId, seriesId, null, opts),
    },
    {
      key: 'duell',
      titel: 'Engstes Duell',
      beschreibung: 'Die zwei engsten Rivalen',
      url: overlayUrl('duell', saisonId, seriesId, null, opts),
    },
    {
      key: 'next',
      titel: 'Nächstes Rennen',
      beschreibung: 'Strecke + Countdown',
      url: overlayUrl('next', saisonId, seriesId, null, opts),
    },
    {
      key: 'podium',
      titel: 'Podium (Ergebnis)',
      beschreibung: 'P1–P3 eines Rennens',
      picker:
        rennenMitErgebnis.length > 0 ? (
          <select value={strecke} onChange={(e) => setStrecke(e.target.value)}>
            {rennenMitErgebnis.map((r) => (
              <option key={r.streckeId} value={r.streckeId}>
                {r.runde} · {r.strecke.kurzname}
              </option>
            ))}
          </select>
        ) : (
          <span className="hinweis-inline">noch kein Rennen mit Ergebnis</span>
        ),
      url: rennenMitErgebnis.length ? overlayUrl('podium', saisonId, seriesId, strecke, opts) : null,
    },
  ]

  return (
    <>
      <Selektoren
        saisons={saisons}
        saisonId={saisonId}
        seriesInSaison={seriesInSaison}
        seriesId={seriesId}
        onSaison={onSaison}
        onSeries={onSeries}
      />

      <main className="haupt" style={{ gridTemplateColumns: '1fr' }}>
        <div className="spalte">
          <div className="karte">
            <div className="karte-kopf">
              <h2>📺 OBS-Overlays</h2>
            </div>
            <div className="info-block">
              <p className="ovs-intro">
                Jede URL als <b>Browser-Source</b> in OBS einbinden — transparenter Hintergrund, kein
                Rand. Die Overlays aktualisieren sich selbst, wenn neue Ergebnisse eingetragen werden.
              </p>

              <div className="ovs-optionen">
                <div className="feld">
                  <label>Position</label>
                  <select value={pos} onChange={(e) => setPos(e.target.value)}>
                    <option value="links">unten links</option>
                    <option value="rechts">unten rechts</option>
                  </select>
                </div>
                <div className="feld">
                  <label>Auto-ausblenden (Sek., 0 = nie)</label>
                  <input
                    className="ovs-hide"
                    type="number"
                    min="0"
                    value={hide}
                    placeholder="0"
                    onChange={(e) => setHide(e.target.value)}
                  />
                </div>
              </div>

              <div className="ovs-liste">
                {eintraege.map((e) => (
                  <OverlayZeile key={e.key} {...e} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

function OverlayZeile({ titel, beschreibung, picker, url }) {
  const [kopiert, setKopiert] = useState(false)
  async function kopiere() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setKopiert(true)
      setTimeout(() => setKopiert(false), 1600)
    } catch {
      window.prompt('Overlay-URL:', url)
    }
  }
  return (
    <div className="ovs-zeile">
      <div className="ovs-info">
        <div className="ovs-titel">{titel}</div>
        <div className="ovs-desc">{beschreibung}</div>
      </div>
      {picker && <div className="ovs-picker">{picker}</div>}
      <input className="ovs-url" readOnly value={url ?? '—'} onFocus={(e) => e.target.select()} />
      <button className="ovs-btn" disabled={!url} onClick={kopiere}>
        {kopiert ? '✓' : 'Kopieren'}
      </button>
      <button className="ovs-btn sek" disabled={!url} onClick={() => url && window.open(url, '_blank', 'width=960,height=360')}>
        Öffnen
      </button>
    </div>
  )
}
