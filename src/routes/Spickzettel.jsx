import Selektoren from '../komponenten/Selektoren.jsx'
import { slug, nummer } from '../lib/format.js'

// Druckbarer Aussprache-Spickzettel aller Fahrer der gewählten Series.
export default function Spickzettel({
  saisons,
  saisonId,
  seriesInSaison,
  seriesId,
  onSaison,
  onSeries,
  kontext,
  redaktion,
}) {
  const roster = kontext?.roster ?? []

  return (
    <>
      <div className="nur-bildschirm">
        <Selektoren
          saisons={saisons}
          saisonId={saisonId}
          seriesInSaison={seriesInSaison}
          seriesId={seriesId}
          onSaison={onSaison}
          onSeries={onSeries}
        >
          <button className="nav-knopf" onClick={() => window.print()}>
            🖨️ Drucken
          </button>
        </Selektoren>
      </div>

      <main className="haupt spick-haupt" style={{ gridTemplateColumns: '1fr' }}>
        <div className="spalte">
          <div className="karte">
            <div className="karte-kopf">
              <h2>🗣️ Aussprache-Spickzettel</h2>
              <span className="zaehler">{roster.length} Fahrer</span>
            </div>
            <div className="tabelle-scroll">
              <table className="feld-tabelle spick-tabelle">
                <thead>
                  <tr>
                    <th>Nr</th>
                    <th>Fahrer</th>
                    <th>Aussprache</th>
                    <th>Team</th>
                    <th>Spitzname</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((f) => {
                    const red = redaktion[slug(f.fahrer)] ?? {}
                    return (
                      <tr key={f.fahrer}>
                        <td className="zelle-nr">{nummer(f.nr)}</td>
                        <td className="fahrer">{f.fahrer}</td>
                        <td className={red.aussprache ? '' : 'leer-zelle'}>{red.aussprache || '—'}</td>
                        <td className="zelle-team">{f.team || '—'}</td>
                        <td className={red.spitzname ? '' : 'leer-zelle'}>{red.spitzname || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
