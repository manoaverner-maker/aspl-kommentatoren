import { useEffect, useMemo, useState } from 'react'
import StreckenUmriss from '../komponenten/StreckenUmriss.jsx'
import layouts from '../data/streckenlayout.json'
import kurvenDaten from '../data/streckenkurven.json'
import { suchNorm } from '../lib/format.js'

// Strecken-Atlas: alle ACC-Strecken mit realistischem Umriss + Kurvennamen.
export default function Strecken({ daten, kontext }) {
  const [q, setQ] = useState('')
  const [offen, setOffen] = useState(null)

  const kalenderIds = useMemo(() => new Set(kontext?.rennen.map((r) => r.streckeId) ?? []), [kontext])
  const liste = useMemo(() => {
    const n = suchNorm(q.trim())
    return [...daten.strecken]
      .filter((s) => !n || suchNorm(`${s.name} ${s.land} ${s.kurzname}`).includes(n))
      .sort((a, b) => a.kurzname.localeCompare(b.kurzname))
  }, [daten, q])

  const strecke = offen ? daten.streckenMap[offen] : null

  return (
    <>
      <div className="selektoren">
        <div className="suche-wrap" style={{ flex: '1 1 320px' }}>
          <span className="suche-lupe" aria-hidden="true">🔍</span>
          <input
            className="suche-feld"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Strecke suchen …"
            aria-label="Strecke suchen"
          />
        </div>
        <div className="feld" style={{ justifyContent: 'flex-end' }}>
          <span className="strecken-zaehler">{liste.length} ACC-Strecken</span>
        </div>
      </div>

      <main className="haupt" style={{ gridTemplateColumns: '1fr' }}>
        <div className="spalte">
          <div className="strecken-grid">
            {liste.map((s) => {
              const l = layouts[s.id]
              return (
                <button key={s.id} className="strecke-karte" onClick={() => setOffen(s.id)}>
                  <div className="sk-umriss">
                    {l ? <StreckenUmriss layout={l} /> : <div className="umriss-fehlt">Umriss folgt</div>}
                    {kalenderIds.has(s.id) && <span className="sk-badge">im Kalender</span>}
                  </div>
                  <div className="sk-info">
                    <div className="sk-name">
                      <span className="flagge">{s.flagge}</span> {s.kurzname}
                    </div>
                    <div className="sk-meta">
                      {s.laenge} · {s.kurven} Kurven
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </main>

      {strecke && (
        <StreckeDetail
          strecke={strecke}
          layout={layouts[strecke.id]}
          kurven={kurvenDaten[strecke.id]}
          onClose={() => setOffen(null)}
        />
      )}
    </>
  )
}

function StreckeDetail({ strecke, layout, kurven, onClose }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div className="modal-hg" onClick={onClose}>
      <div className="strecke-detail" onClick={(e) => e.stopPropagation()}>
        <button className="fk-schliessen" onClick={onClose} aria-label="Schließen">×</button>
        <div className="sd-kopf">
          <div className="strecke-titel">
            <span className="flagge">{strecke.flagge}</span>
            {strecke.kurzname}
          </div>
          <div className="strecke-land">
            {strecke.name} · {strecke.land}
          </div>
        </div>

        <div className="sd-body">
          <div className="sd-karte">
            {layout ? (
              <StreckenUmriss layout={layout} detail />
            ) : (
              <div className="umriss-fehlt gross">Umriss folgt</div>
            )}
          </div>

          <div className="sd-seite">
            <div className="kennzahlen">
              <div className="kennzahl">
                <div className="wert">{strecke.laenge ?? '—'}</div>
                <div className="etikett">Länge</div>
              </div>
              <div className="kennzahl">
                <div className="wert">{strecke.kurven ?? '—'}</div>
                <div className="etikett">Kurven</div>
              </div>
              <div className="kennzahl">
                <div className="wert" style={{ fontSize: 14 }}>{strecke.richtung ?? '—'}</div>
                <div className="etikett">Richtung</div>
              </div>
              <div className="kennzahl">
                <div className="wert">{strecke.eroeffnung ?? '—'}</div>
                <div className="etikett">Eröffnet</div>
              </div>
            </div>

            {kurven?.kurven?.length > 0 && (
              <div className="kurven-liste">
                <h3>Kurven</h3>
                <ul>
                  {kurven.kurven.map((k, i) => (
                    <li key={i}>{k}</li>
                  ))}
                </ul>
                {kurven.hinweis && <p className="kurven-hinweis">{kurven.hinweis}</p>}
              </div>
            )}
          </div>
        </div>

        {strecke.besonderheiten?.length > 0 && (
          <div className="sd-abschnitt">
            <h3>Besonderheiten</h3>
            <ul className="besonderheiten">
              {strecke.besonderheiten.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        {layout?.quelle && (
          <div className="sd-quelle">
            Umriss:{' '}
            <a href={layout.quelle.url} target="_blank" rel="noreferrer">
              {layout.quelle.title}
            </a>{' '}
            · {layout.quelle.license}
            {layout.quelle.author ? ` · ${layout.quelle.author}` : ''}
          </div>
        )}
      </div>
    </div>
  )
}
