import { useMemo, useState } from 'react'
import Selektoren from '../komponenten/Selektoren.jsx'
import Blitzsuche from '../komponenten/Blitzsuche.jsx'
import Streckeninfo from '../komponenten/Streckeninfo.jsx'
import EngstesDuell from '../komponenten/EngstesDuell.jsx'
import ZufallsFakt from '../komponenten/ZufallsFakt.jsx'
import { startfeld, engstesDuell, faktenTopf } from '../daten.js'
import { nummer } from '../lib/format.js'

export default function GridUebersicht({
  daten,
  saisons,
  saisonId,
  seriesInSaison,
  seriesId,
  streckeId,
  onSaison,
  onSeries,
  onStrecke,
  kontext,
  redaktion,
  onFahrer,
}) {
  const strecke = daten.streckenMap[streckeId]
  const feld = startfeld(kontext.ergebnisObj, streckeId)
  const hatErgebnisse = feld.length > 0
  const zeilen = hatErgebnisse ? feld : kontext.roster

  const duell = useMemo(() => engstesDuell(kontext.wertung.fahrer), [kontext])
  const fakten = useMemo(
    () => faktenTopf(kontext.kalenderObj, daten.streckenMap, kontext.ergebnisObj, redaktion),
    [kontext, daten, redaktion]
  )

  return (
    <>
      <Selektoren
        saisons={saisons}
        saisonId={saisonId}
        seriesInSaison={seriesInSaison}
        seriesId={seriesId}
        onSaison={onSaison}
        onSeries={onSeries}
        strecken={kontext.rennen}
        streckeId={streckeId}
        onStrecke={onStrecke}
      >
        <Blitzsuche roster={kontext.roster} teamSerie={kontext.teamSerie} onWahl={onFahrer} />
      </Selektoren>

      <main className="haupt">
        <div className="spalte">
          <div className="karte">
            <div className="karte-kopf">
              <h2>Startfeld · {strecke?.kurzname ?? '—'}</h2>
              <span className="zaehler">{zeilen.length} Fahrer</span>
            </div>
            {!hatErgebnisse && zeilen.length > 0 && (
              <div className="tabelle-hinweis">
                Noch keine Ergebnisse für dieses Rennen — gezeigt wird das bisherige
                Saison-Startfeld (alphabetisch).
              </div>
            )}
            <div className="tabelle-scroll">
              {zeilen.length > 0 ? (
                <StartfeldTabelle
                  key={streckeId + '-' + hatErgebnisse}
                  zeilen={zeilen}
                  teamSerie={kontext.teamSerie}
                  hatErgebnisse={hatErgebnisse}
                  onFahrer={onFahrer}
                />
              ) : (
                <div className="leer-zustand">Keine Fahrerdaten vorhanden.</div>
              )}
            </div>
          </div>
        </div>

        <div className="spalte">
          <Streckeninfo strecke={strecke} />
          <EngstesDuell duell={duell} onFahrer={onFahrer} />
          <ZufallsFakt fakten={fakten} />
        </div>
      </main>
    </>
  )
}

// ---- sortierbare Startfeld-Tabelle ---------------------------------------

function numVergleich(x, y) {
  if (x == null && y == null) return 0
  if (x == null) return 1
  if (y == null) return -1
  return x - y
}

function einzelVergleich(feld, a, b) {
  switch (feld) {
    case 'fahrer':
      return (a.fahrer || '').localeCompare(b.fahrer || '')
    case 'team':
      return (a.team || 'zzz').localeCompare(b.team || 'zzz')
    case 'fahrzeug':
      return (a.fahrzeug || 'zzz').localeCompare(b.fahrzeug || 'zzz')
    case 'nr':
      return numVergleich(a.nr, b.nr)
    case 'quali':
      return numVergleich(a.quali, b.quali)
    case 'platz':
    default:
      return numVergleich(a.platz, b.platz)
  }
}

function posKlasse(platz) {
  return platz === 1 ? 'p1' : platz === 2 ? 'p2' : platz === 3 ? 'p3' : ''
}

function StartfeldTabelle({ zeilen, teamSerie, hatErgebnisse, onFahrer }) {
  const [sortF, setSortF] = useState(hatErgebnisse ? 'platz' : 'fahrer')
  const [richtung, setRichtung] = useState('asc')

  function sortiere(feld) {
    if (feld === sortF) setRichtung((r) => (r === 'asc' ? 'desc' : 'asc'))
    else {
      setSortF(feld)
      setRichtung('asc')
    }
  }

  const sortiert = useMemo(() => {
    const dir = richtung === 'asc' ? 1 : -1
    return [...zeilen].sort((a, b) => dir * einzelVergleich(sortF, a, b))
  }, [zeilen, sortF, richtung])

  const Kopf = ({ feld, label, klasse }) => (
    <th className={'sortierbar' + (klasse ? ' ' + klasse : '')} onClick={() => sortiere(feld)}>
      {label}
      {sortF === feld && <span className="pfeil">{richtung === 'asc' ? '▲' : '▼'}</span>}
    </th>
  )

  return (
    <table className="feld-tabelle">
      <thead>
        <tr>
          {hatErgebnisse && <Kopf feld="platz" label="Pos" />}
          <Kopf feld="nr" label="Nr" />
          <Kopf feld="fahrer" label="Fahrer" />
          {teamSerie && <Kopf feld="team" label="Team" />}
          <Kopf feld="fahrzeug" label="Fahrzeug" />
          {hatErgebnisse && <Kopf feld="quali" label="Quali" />}
        </tr>
      </thead>
      <tbody>
        {sortiert.map((r, i) => (
          <tr key={r.fahrer + '-' + i} onClick={() => onFahrer(r.fahrer)}>
            {hatErgebnisse && <td className={'zelle-pos ' + posKlasse(r.platz)}>{r.platz}</td>}
            <td className="zelle-nr">{nummer(r.nr)}</td>
            <td className="fahrer">{r.fahrer}</td>
            {teamSerie && <td className="zelle-team">{r.team || '—'}</td>}
            <td className="zelle-auto">{r.fahrzeug || '—'}</td>
            {hatErgebnisse && (
              <td className="zelle-quali">
                {r.quali ? (
                  <span className={'pole-chip' + (r.quali === 1 ? ' pole' : '')}>
                    {r.quali === 1 ? 'POLE' : 'Q' + r.quali}
                  </span>
                ) : (
                  '—'
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
