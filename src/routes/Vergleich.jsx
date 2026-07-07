import { useEffect, useMemo, useState } from 'react'
import Selektoren from '../komponenten/Selektoren.jsx'
import FormChips from '../komponenten/FormChips.jsx'
import { fahrerDetails } from '../daten.js'
import { direktvergleich, formKurve } from '../analyse.js'
import { nummer } from '../lib/format.js'

// Head-to-Head: zwei Fahrer direkt gegenüberstellen.
export default function Vergleich({
  saisons,
  saisonId,
  seriesInSaison,
  seriesId,
  onSaison,
  onSeries,
  kontext,
  streckenMap,
  onFahrer,
}) {
  const roster = kontext?.roster ?? []
  const wertung = kontext?.wertung.fahrer ?? []
  const [a, setA] = useState(wertung[0]?.fahrer ?? '')
  const [b, setB] = useState(wertung[1]?.fahrer ?? '')

  // Beim Wechsel der Series sinnvolle Defaults (Top 2) setzen
  useEffect(() => {
    setA(wertung[0]?.fahrer ?? '')
    setB(wertung[1]?.fahrer ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saisonId, seriesId])

  const dA = useMemo(() => (a ? fahrerDetails(kontext.ergebnisObj, kontext.system, a) : null), [a, kontext])
  const dB = useMemo(() => (b ? fahrerDetails(kontext.ergebnisObj, kontext.system, b) : null), [b, kontext])
  const formA = useMemo(() => formKurve(kontext.rennen, kontext.ergebnisObj, a, 5), [a, kontext])
  const formB = useMemo(() => formKurve(kontext.rennen, kontext.ergebnisObj, b, 5), [b, kontext])
  const vgl = useMemo(() => direktvergleich(kontext.rennen, kontext.ergebnisObj, a, b), [a, b, kontext])

  const zeilen = [
    { lab: 'WM-Position', a: dA?.position, b: dB?.position, besserKlein: true, fmt: (v) => (v ? 'P' + v : '—') },
    { lab: 'Punkte', a: dA?.punkte, b: dB?.punkte },
    { lab: 'Siege', a: dA?.siege, b: dB?.siege },
    { lab: 'Podien', a: dA?.podien, b: dB?.podien },
    { lab: 'Poles', a: dA?.poles, b: dB?.poles },
    { lab: 'Rennen', a: dA?.rennen, b: dB?.rennen, neutral: true },
  ]

  const auswahl = (wert, setter, ausser) => (
    <select value={wert} onChange={(e) => setter(e.target.value)}>
      {roster.map((f) => (
        <option key={f.fahrer} value={f.fahrer} disabled={f.fahrer === ausser}>
          {f.fahrer}
          {f.nr != null ? ` · #${f.nr}` : ''}
        </option>
      ))}
    </select>
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
      />

      <main className="haupt" style={{ gridTemplateColumns: '1fr' }}>
        <div className="spalte">
          {roster.length < 2 ? (
            <div className="karte">
              <div className="leer-zustand">Zu wenige Fahrer für einen Vergleich.</div>
            </div>
          ) : (
            <div className="karte">
              <div className="karte-kopf">
                <h2>⚔️ Head-to-Head</h2>
                <span className="zaehler">
                  Direkte Duelle: {vgl.aVorn} : {vgl.bVorn}
                </span>
              </div>

              <div className="vgl-kopf">
                <div className="vgl-seite">
                  {auswahl(a, setA, b)}
                  <button className="vgl-name" onClick={() => onFahrer(a)}>
                    <span className="vgl-nr">{nummer(dA?.nr)}</span> {a}
                  </button>
                  <FormChips form={formA} />
                </div>
                <div className="vgl-vs">VS</div>
                <div className="vgl-seite rechts">
                  {auswahl(b, setB, a)}
                  <button className="vgl-name" onClick={() => onFahrer(b)}>
                    {b} <span className="vgl-nr">{nummer(dB?.nr)}</span>
                  </button>
                  <FormChips form={formB} />
                </div>
              </div>

              <table className="vgl-tabelle">
                <tbody>
                  {zeilen.map((z) => {
                    const aBesser = !z.neutral && z.a != null && z.b != null && (z.besserKlein ? z.a < z.b : z.a > z.b)
                    const bBesser = !z.neutral && z.a != null && z.b != null && (z.besserKlein ? z.b < z.a : z.b > z.a)
                    const fmt = z.fmt ?? ((v) => (v ?? '—'))
                    return (
                      <tr key={z.lab}>
                        <td className={'vgl-a' + (aBesser ? ' besser' : '')}>{fmt(z.a)}</td>
                        <td className="vgl-lab">{z.lab}</td>
                        <td className={'vgl-b' + (bBesser ? ' besser' : '')}>{fmt(z.b)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="fk-abschnitt">
                <h3>Rennen für Rennen</h3>
                <table className="vgl-rennen">
                  <tbody>
                    {vgl.zeilen.map((z) => {
                      const aVorn = z.a != null && z.b != null && z.a < z.b
                      const bVorn = z.a != null && z.b != null && z.b < z.a
                      return (
                        <tr key={z.streckeId}>
                          <td className={'vgl-a' + (aVorn ? ' besser' : '')}>{z.a != null ? 'P' + z.a : '—'}</td>
                          <td className="vgl-lab">
                            {z.runde} · {streckenMap[z.streckeId]?.kurzname ?? z.streckeId}
                          </td>
                          <td className={'vgl-b' + (bVorn ? ' besser' : '')}>{z.b != null ? 'P' + z.b : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
