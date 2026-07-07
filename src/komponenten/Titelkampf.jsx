// Titel-Rechner: selbstberechnet aus Punktestand + verbleibenden Rennen.
export default function Titelkampf({ szenario, onFahrer }) {
  if (!szenario) return null
  const { leader, verbleibend, entschieden, nochImRennen, klarBeimNaechsten, maxProRennen } = szenario

  return (
    <div className="karte titel-karte">
      <div className="karte-kopf">
        <h2>🏆 Titelkampf</h2>
        <span className="zaehler">{verbleibend} Rennen offen</span>
      </div>
      <div className="titel-body">
        {entschieden ? (
          <div className="titel-fix">
            🏆 Titel entschieden: <b>{leader.fahrer}</b> · {leader.punkte} Pkt
          </div>
        ) : (
          <>
            <div className="titel-leader">
              Führung: <b>{leader.fahrer}</b> · {leader.punkte} Pkt
            </div>
            {klarBeimNaechsten && (
              <div className="titel-klar">⚡ Kann beim nächsten Rennen den Titel klarmachen</div>
            )}
            <div className="titel-alive-lab">
              Rechnerisch noch im Titelrennen: {nochImRennen.length}
            </div>
            <div className="titel-alive">
              {nochImRennen.slice(0, 8).map((f) => (
                <button key={f.fahrer} className="titel-chip" onClick={() => onFahrer?.(f.fahrer)}>
                  {f.fahrer} <span className="tp">{f.punkte}</span>
                </button>
              ))}
              {nochImRennen.length > 8 && (
                <span className="titel-mehr">+{nochImRennen.length - 8} weitere</span>
              )}
            </div>
            <div className="titel-fuss">max. {maxProRennen} Pkt pro Rennen</div>
          </>
        )}
      </div>
    </div>
  )
}
