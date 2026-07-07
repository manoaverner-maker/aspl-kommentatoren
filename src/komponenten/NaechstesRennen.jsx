import { useEffect, useState } from 'react'
import { naechstesRennen, rennZeitpunkt, formatDatum, restzeitText } from '../lib/status.js'

// "Nächstes Rennen"-Karte mit Countdown. Zeiten kommen aus dem Kalender.
export default function NaechstesRennen({ kalenderObj, streckenMap }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const rennen = naechstesRennen(kalenderObj, streckenMap)
  if (!rennen) return null
  const ziel = rennZeitpunkt(rennen, kalenderObj?.zeiten)
  const zeiten = kalenderObj?.zeiten
  const zielLabel = rennen.startzeit ? `Start ${rennen.startzeit}` : zeiten?.quali ? `Quali ${zeiten.quali}` : ''

  return (
    <div className="karte next-karte">
      <div className="karte-kopf">
        <h2>🏁 Nächstes Rennen</h2>
        {rennen.status === 'verschoben' && <span className="zaehler warn">verschoben</span>}
      </div>
      <div className="next-body">
        <div className="next-strecke">
          <span className="flagge">{rennen.strecke.flagge}</span> {rennen.runde} · {rennen.strecke.kurzname}
        </div>
        <div className="next-datum">
          {formatDatum(rennen.eff)}
          {rennen.dauer ? ' · ' + rennen.dauer : ''}
        </div>
        {ziel && (
          <div className="next-countdown">
            <span className="cd-zahl">{restzeitText(ziel)}</span>
            {zielLabel && <span className="cd-lab">bis {zielLabel}</span>}
          </div>
        )}
        {zeiten && !rennen.startzeit && (
          <div className="next-zeiten">
            <span>Training {zeiten.training}</span>
            <span>Quali {zeiten.quali}</span>
            <span>Start {zeiten.rennstart}</span>
          </div>
        )}
      </div>
    </div>
  )
}
