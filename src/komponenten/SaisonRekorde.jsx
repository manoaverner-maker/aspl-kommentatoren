// Saison-Superlative — automatisch aus den Ergebnissen.
export default function SaisonRekorde({ rekorde, onFahrer }) {
  if (!rekorde) return null
  const zeilen = [
    { lab: 'Meiste Siege', r: rekorde.meisteSiege, wert: rekorde.meisteSiege?.siege },
    { lab: 'Meiste Poles', r: rekorde.meistePoles, wert: rekorde.meistePoles?.poles },
    { lab: 'Meiste Top-5', r: rekorde.meisteTop5, wert: rekorde.meisteTop5?.top5 },
    { lab: 'Längste Podestserie', r: rekorde.laengstePodestserie, wert: rekorde.laengstePodestserie?.streakMax },
    { lab: 'Bester Schnitt', r: rekorde.besterSchnitt, wert: rekorde.besterSchnitt ? 'P' + rekorde.besterSchnitt.schnitt.toFixed(1) : null },
  ].filter((z) => z.r && z.wert != null && z.wert !== 0 && z.wert !== '')

  if (!zeilen.length) return null

  return (
    <div className="karte">
      <div className="karte-kopf">
        <h2>📊 Saison-Rekorde</h2>
      </div>
      <div className="rekorde">
        {zeilen.map((z) => (
          <button key={z.lab} className="rekord-zeile" onClick={() => onFahrer?.(z.r.fahrer)}>
            <span className="rekord-lab">{z.lab}</span>
            <span className="rekord-fahrer">{z.r.fahrer}</span>
            <span className="rekord-wert">{z.wert}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
