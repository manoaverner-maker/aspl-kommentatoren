// Streckeninfos zum aktuell gewaehlten Rennen — Daten kommen 1:1 aus dem
// strecken-Export der Hauptseite.
export default function Streckeninfo({ strecke }) {
  if (!strecke) return null
  return (
    <div className="karte">
      <div className="karte-kopf">
        <h2>Strecke</h2>
      </div>
      <div className="info-block">
        <div className="strecke-titel">
          <span className="flagge">{strecke.flagge}</span>
          <span>{strecke.kurzname}</span>
        </div>
        <div className="strecke-land">
          {strecke.name} · {strecke.land}
        </div>

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

        {strecke.besonderheiten?.length > 0 && (
          <ul className="besonderheiten">
            {strecke.besonderheiten.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
