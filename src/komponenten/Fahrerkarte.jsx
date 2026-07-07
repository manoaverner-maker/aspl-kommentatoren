import { useEffect, useState } from 'react'
import { fahrerDetails } from '../daten.js'
import { formKurve, talkingPoints } from '../analyse.js'
import { slug, nummer } from '../lib/format.js'
import { overlayUrl } from '../lib/router.js'
import FormChips from './FormChips.jsx'

// Grosse Detailkarte. Kennzahlen + Form + Auto-Talking-Points werden live aus
// den Ergebnissen berechnet; redaktionelle Felder kommen aus redaktion.json;
// die Notizen speichert der Kommentator pro Fahrer lokal (localStorage).
export default function Fahrerkarte({
  fahrerName,
  saisonId,
  seriesId,
  kontext,
  streckenMap,
  redaktion,
  onClose,
}) {
  const [kopiert, setKopiert] = useState(false)
  const details = fahrerDetails(kontext.ergebnisObj, kontext.system, fahrerName)
  const red = redaktion[slug(fahrerName)] ?? {}
  const url = overlayUrl('fahrer', saisonId, seriesId, slug(fahrerName))
  const form = formKurve(kontext.rennen, kontext.ergebnisObj, fahrerName, 5)
  const tps = talkingPoints(details, kontext.wertung.fahrer, form)

  // Persönliche Notiz je Fahrer (bleibt lokal erhalten — nie automatisch gelöscht)
  const notizKey = `aspl_notiz_${saisonId}_${seriesId}_${slug(fahrerName)}`
  const [notiz, setNotiz] = useState(() => {
    try {
      return localStorage.getItem(notizKey) || ''
    } catch {
      return ''
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(notizKey, notiz)
    } catch {
      /* ignore */
    }
  }, [notizKey, notiz])

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  function aufStreamZeigen() {
    window.open(url, 'aspl-overlay', 'width=960,height=360')
  }
  async function kopiereUrl() {
    try {
      await navigator.clipboard.writeText(url)
      setKopiert(true)
      setTimeout(() => setKopiert(false), 1600)
    } catch {
      window.prompt('Overlay-URL für OBS:', url)
    }
  }

  const stats = [
    { lab: 'WM-Pos', wert: details.position ? 'P' + details.position : '—', hero: true },
    { lab: 'Punkte', wert: details.punkte },
    { lab: 'Rückstand', wert: details.rueckstand > 0 ? '−' + details.rueckstand : '—' },
    { lab: 'Siege', wert: details.siege },
    { lab: 'Podien', wert: details.podien },
    { lab: 'Poles', wert: details.poles },
    { lab: 'Rennen', wert: details.rennen },
  ]

  const redFelder = [
    { k: 'Spitzname', v: red.spitzname },
    { k: 'Aussprache', v: red.aussprache },
    { k: 'Fun Fact', v: red.funfact },
    { k: 'Rivalität', v: red.rivalitaet },
  ]

  return (
    <div className="modal-hg" onClick={onClose}>
      <div className="fahrerkarte" onClick={(e) => e.stopPropagation()}>
        <div className="fk-kopf">
          <div className="fk-nr">{nummer(details.nr)}</div>
          <div className="fk-titel">
            <div className="fk-name">{fahrerName}</div>
            <div className="fk-unter">
              {details.team && <span>{details.team}</span>}
              {details.fahrzeug && <span>{details.fahrzeug}</span>}
              {(red.flagge || red.nation) && (
                <span>
                  {red.flagge && <span className="flagge">{red.flagge} </span>}
                  {red.nation}
                </span>
              )}
            </div>
          </div>
          <button className="fk-schliessen" onClick={onClose} aria-label="Schließen">
            ×
          </button>
        </div>

        <div className="fk-stats">
          {stats.map((s) => (
            <div className="fk-stat" key={s.lab}>
              <div className={'zahl' + (s.hero ? ' hero' : '')}>{s.wert}</div>
              <div className="lab">{s.lab}</div>
            </div>
          ))}
        </div>

        {form.length > 0 && (
          <div className="fk-formzeile">
            <span className="fk-form-lab">Form (zuletzt)</span>
            <FormChips form={form} />
          </div>
        )}

        {tps.length > 0 && (
          <div className="fk-abschnitt">
            <h3>⚡ Auto-Storylines</h3>
            <ul className="talking-points">
              {tps.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        {details.ergebnisse.length > 0 && (
          <div className="fk-abschnitt">
            <h3>Ergebnisse diese Saison</h3>
            <div className="ergebnis-punkte">
              {details.ergebnisse.map((e) => (
                <span
                  key={e.streckeId}
                  className={'ep' + (e.platz === 1 ? ' sieg' : e.platz <= 3 ? ' podium' : '')}
                >
                  <span className="strk">{streckenMap[e.streckeId]?.kurzname ?? e.streckeId}</span>
                  <span className="plz">P{e.platz}</span>
                  {e.quali === 1 && <span title="Pole">🏁</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="fk-abschnitt">
          <h3>Redaktion · Kommentar-Notizen</h3>
          <div className="redaktion-grid">
            {redFelder.map((f) => (
              <div className="red-feld" key={f.k}>
                <div className="k">{f.k}</div>
                <div className={'v' + (f.v ? '' : ' leer')}>{f.v || 'noch offen'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="fk-abschnitt">
          <h3>📝 Eigene Notiz (nur auf diesem Gerät)</h3>
          <textarea
            className="fk-notiz"
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
            placeholder="Schnelle Notiz während des Rennens …"
            rows={3}
          />
        </div>

        <div className="fk-aktionen">
          <button className="knopf-voll" onClick={aufStreamZeigen}>
            📺 Auf Stream zeigen
          </button>
          <button className="knopf-voll sekundaer" onClick={kopiereUrl}>
            {kopiert ? '✓ URL kopiert' : '🔗 Overlay-URL für OBS kopieren'}
          </button>
        </div>
      </div>
    </div>
  )
}
