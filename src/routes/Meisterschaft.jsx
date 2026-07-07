import { useMemo } from 'react'
import Selektoren from '../komponenten/Selektoren.jsx'
import EngstesDuell from '../komponenten/EngstesDuell.jsx'
import { engstesDuell } from '../daten.js'

// Meisterschaftsstand: Fahrer- und (bei Team-Series) Teamwertung. Zahlen kommen
// aus derselben Rechenlogik wie die Hauptseite (src/punkte.js).
export default function Meisterschaft({
  saisons,
  saisonId,
  seriesInSaison,
  seriesId,
  onSaison,
  onSeries,
  kontext,
  onFahrer,
}) {
  const duell = useMemo(() => (kontext ? engstesDuell(kontext.wertung.fahrer) : null), [kontext])
  if (!kontext) return null

  const { fahrer, teams } = kontext.wertung
  const teamSerie = kontext.teamSerie && teams.length > 0

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
          {duell && (
            <div style={{ maxWidth: 380 }}>
              <EngstesDuell duell={duell} onFahrer={onFahrer} />
            </div>
          )}

          <div className={teamSerie ? 'meister-grid' : ''}>
            <div className="karte">
              <div className="karte-kopf">
                <h2>Fahrerwertung</h2>
                <span className="zaehler">{fahrer.length} Fahrer</span>
              </div>
              <div className="tabelle-scroll">
                {fahrer.length === 0 ? (
                  <div className="leer-zustand">Noch keine Ergebnisse in dieser Series.</div>
                ) : (
                  <table className="wertung-tabelle">
                    <thead>
                      <tr>
                        <th className="pos">#</th>
                        <th>Fahrer</th>
                        {teamSerie && <th>Team</th>}
                        <th className="r">Siege</th>
                        <th className="r">Pkt</th>
                        <th className="r">Rück.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fahrer.map((f) => (
                        <tr
                          key={f.fahrer}
                          className={'klickbar ' + platzKlasse(f.position)}
                          onClick={() => onFahrer(f.fahrer)}
                        >
                          <td className="pos">{f.position}</td>
                          <td className="name">{f.fahrer}</td>
                          {teamSerie && <td className="rueck">{f.team || '—'}</td>}
                          <td className="r">{f.siege}</td>
                          <td className="r pkt">{f.punkte}</td>
                          <td className="r rueck">{f.rueckstand > 0 ? '−' + f.rueckstand : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {teamSerie && (
              <div className="karte">
                <div className="karte-kopf">
                  <h2>Teamwertung</h2>
                  <span className="zaehler">{teams.length} Teams</span>
                </div>
                <div className="tabelle-scroll">
                  <table className="wertung-tabelle">
                    <thead>
                      <tr>
                        <th className="pos">#</th>
                        <th>Team</th>
                        <th className="r">Siege</th>
                        <th className="r">Pkt</th>
                        <th className="r">Rück.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((t) => (
                        <tr key={t.team} className={platzKlasse(t.position)}>
                          <td className="pos">{t.position}</td>
                          <td className="name">{t.team}</td>
                          <td className="r">{t.siege}</td>
                          <td className="r pkt">{t.punkte}</td>
                          <td className="r rueck">{t.rueckstand > 0 ? '−' + t.rueckstand : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

function platzKlasse(pos) {
  return pos === 1 ? 'p1' : pos === 2 ? 'p2' : pos === 3 ? 'p3' : ''
}
