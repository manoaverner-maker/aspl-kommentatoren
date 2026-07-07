import { useEffect, useMemo, useRef, useState } from 'react'
import { suchNorm, nummer } from '../lib/format.js'

// Immer sichtbares Suchfeld: filtert live nach Name ODER Startnummer, ganz
// ohne Enter. Fokus liegt beim Laden direkt hier. Pfeiltasten + Enter waehlen,
// Escape leert.
export default function Blitzsuche({ roster, teamSerie, onWahl }) {
  const [q, setQ] = useState('')
  const [mark, setMark] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  const treffer = useMemo(() => {
    const text = q.trim()
    if (!text) return []
    const nText = suchNorm(text)
    return roster
      .filter(
        (f) => suchNorm(f.fahrer).includes(nText) || (f.nr != null && String(f.nr).includes(text))
      )
      .slice(0, 12)
  }, [q, roster])

  useEffect(() => {
    setMark(0)
  }, [q])

  function waehle(name) {
    onWahl(name)
    setQ('')
  }

  function tasten(e) {
    if (!treffer.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setMark((m) => Math.min(m + 1, treffer.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setMark((m) => Math.max(m - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (treffer[mark]) waehle(treffer[mark].fahrer)
    } else if (e.key === 'Escape') {
      setQ('')
    }
  }

  return (
    <div className="suche-wrap">
      <span className="suche-lupe" aria-hidden="true">🔍</span>
      <input
        ref={ref}
        className="suche-feld"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={tasten}
        placeholder="Fahrer oder Startnummer suchen …"
        aria-label="Blitzsuche nach Fahrer oder Startnummer"
        autoComplete="off"
        spellCheck="false"
      />
      {treffer.length > 0 && (
        <div className="treffer" role="listbox">
          {treffer.map((t, i) => (
            <button
              key={t.fahrer}
              type="button"
              role="option"
              aria-selected={i === mark}
              className={'treffer-zeile' + (i === mark ? ' markiert' : '')}
              onMouseEnter={() => setMark(i)}
              onClick={() => waehle(t.fahrer)}
            >
              <span className="treffer-nr">{nummer(t.nr)}</span>
              <span className="treffer-name">{t.fahrer}</span>
              {teamSerie && t.team && <span className="treffer-team">{t.team}</span>}
            </button>
          ))}
        </div>
      )}
      {q.trim() && treffer.length === 0 && (
        <div className="treffer">
          <div className="treffer-leer">Kein Fahrer gefunden.</div>
        </div>
      )}
    </div>
  )
}
