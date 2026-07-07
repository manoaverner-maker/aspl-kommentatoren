import { useState } from 'react'

// "Naechster Fakt" — zieht zufaellig aus Strecken-Besonderheiten UND befuellten
// Fahrer-Fun-Facts. Vermeidet die direkte Wiederholung des letzten Fakts.
export default function ZufallsFakt({ fakten }) {
  const [aktuell, setAktuell] = useState(() => (fakten.length ? zufall(fakten, -1) : -1))

  function naechster() {
    if (fakten.length <= 1) return
    setAktuell((i) => zufall(fakten, i))
  }

  const fakt = aktuell >= 0 ? fakten[aktuell] : null

  return (
    <div className="karte">
      <div className="karte-kopf">
        <h2>🎲 Zufalls-Fakt</h2>
        <span className="zaehler">{fakten.length}</span>
      </div>
      <div className="fakt-box">
        {fakt ? (
          <>
            <div className="fakt-text">{fakt.text}</div>
            <div className="fakt-quelle">{fakt.quelle}</div>
          </>
        ) : (
          <div className="fakt-text" style={{ color: 'var(--text-schwach)' }}>
            Noch keine Fakten hinterlegt.
          </div>
        )}
        <button className="knopf-voll" onClick={naechster} disabled={fakten.length <= 1}>
          🎲 Nächster Fakt
        </button>
      </div>
    </div>
  )
}

// zufaelliger Index != vorheriger (ohne Math.random-Bias-Sorge: nur UI-Deko)
function zufall(liste, vermeide) {
  if (liste.length <= 1) return 0
  let i = vermeide
  while (i === vermeide) i = Math.floor(Math.random() * liste.length)
  return i
}
