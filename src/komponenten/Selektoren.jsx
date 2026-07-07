// Gemeinsame Auswahl-Leiste (Saison / Series / optional Strecke). Wird von der
// Grid-Uebersicht und der Meisterschaft genutzt, damit die Auswahl beim
// Wechsel der Ansicht erhalten bleibt.
export default function Selektoren({
  saisons,
  saisonId,
  seriesInSaison,
  seriesId,
  onSaison,
  onSeries,
  strecken,
  streckeId,
  onStrecke,
  children,
}) {
  return (
    <div className="selektoren">
      <div className="feld">
        <label htmlFor="sel-saison">Saison</label>
        <select id="sel-saison" value={saisonId ?? ''} onChange={(e) => onSaison(e.target.value)}>
          {saisons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="feld">
        <label htmlFor="sel-series">Series</label>
        <select id="sel-series" value={seriesId ?? ''} onChange={(e) => onSeries(e.target.value)}>
          {seriesInSaison.map((s) => (
            <option key={s.seriesId} value={s.seriesId}>
              {s.seriesName}
              {s.comingSoon ? ' (bald)' : ''}
            </option>
          ))}
        </select>
      </div>

      {strecken && (
        <div className="feld">
          <label htmlFor="sel-strecke">Rennen / Strecke</label>
          <select
            id="sel-strecke"
            value={streckeId ?? ''}
            onChange={(e) => onStrecke(e.target.value)}
          >
            {strecken.length === 0 && <option value="">— keine Rennen —</option>}
            {strecken.map((r) => (
              <option key={r.streckeId} value={r.streckeId}>
                {r.runde} · {r.strecke.kurzname}
                {r.verschobenAuf ? ' (verschoben)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {children}
    </div>
  )
}
