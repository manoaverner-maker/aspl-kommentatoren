// Automatischer Storyline-Hinweis: die zwei Fahrer mit dem kleinsten
// Punkteabstand in der aktuellen Wertung.
export default function EngstesDuell({ duell, onFahrer }) {
  if (!duell) return null
  const { vorne, hinten, abstand } = duell
  return (
    <div className="karte">
      <div className="karte-kopf">
        <h2>⚔️ Engstes Duell</h2>
      </div>
      <div className="duell">
        <div className="duell-paar">
          <button className="duell-fahrer" onClick={() => onFahrer(vorne.fahrer)}>
            <div className="name">
              P{vorne.position} · {vorne.fahrer}
            </div>
            <div className="pkt">{subZeile(vorne)}</div>
          </button>
          <span className="duell-vs">VS</span>
          <button className="duell-fahrer" style={{ textAlign: 'right' }} onClick={() => onFahrer(hinten.fahrer)}>
            <div className="name">
              P{hinten.position} · {hinten.fahrer}
            </div>
            <div className="pkt">{subZeile(hinten)}</div>
          </button>
        </div>
        <div className="duell-abstand">
          <div className="zahl">{abstand}</div>
          <div className="txt">Punkte Abstand</div>
        </div>
      </div>
    </div>
  )
}

function subZeile(f) {
  if (f.team) return `${f.punkte} Pkt · ${f.team}`
  if (f.siege > 0) return `${f.punkte} Pkt · ${f.siege}× Sieg`
  return `${f.punkte} Pkt`
}
