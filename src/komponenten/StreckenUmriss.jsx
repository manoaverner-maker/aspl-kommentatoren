import { useEffect, useRef, useState } from 'react'

// Rendert einen Streckenumriss als "realistisches" Asphaltband auf Grün:
// breite Kante (Casing) + dunkler Asphalt + weiss gestrichelte Mittellinie,
// im Detail zusätzlich Start/Ziel-Markierung. Geometrie kommt aus
// streckenlayout.json (F1: ein Pfad; Wikimedia: ggf. mehrere Segment-Pieces).
export default function StreckenUmriss({ layout, detail = false }) {
  const ref = useRef(null)
  const [marker, setMarker] = useState(null)

  const vb = layout.viewBox.split(/\s+/).map(Number)
  const dim = Math.max(vb[2] || 0, vb[3] || 0) || 1000
  const casing = dim / 42
  const asphalt = dim / 66
  const mitte = Math.max(dim / 340, 0.6)

  const pieces = layout.pieces ?? [{ d: layout.d, transform: null }]
  const ohneTransform = !pieces[0].transform

  useEffect(() => {
    if (!detail || !ohneTransform || !ref.current) return
    try {
      const len = ref.current.getTotalLength()
      const p0 = ref.current.getPointAtLength(0)
      const p1 = ref.current.getPointAtLength(len * 0.03)
      setMarker({ x: p0.x, y: p0.y, ang: (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI })
    } catch {
      setMarker(null)
    }
  }, [layout, detail, ohneTransform])

  const strich = (extra) =>
    pieces.map((p, i) => (
      <path key={extra.key + i} d={p.d} transform={p.transform || undefined} {...extra.props} ref={i === 0 ? extra.ref : undefined} />
    ))

  return (
    <svg className="umriss" viewBox={layout.viewBox} preserveAspectRatio="xMidYMid meet" role="img">
      {strich({ key: 'c', props: { className: 'u-casing', style: { strokeWidth: casing } } })}
      {strich({ key: 'a', props: { className: 'u-asphalt', style: { strokeWidth: asphalt } }, ref })}
      {detail &&
        strich({
          key: 'm',
          props: { className: 'u-mitte', style: { strokeWidth: mitte, strokeDasharray: `${mitte * 3.5} ${mitte * 5.5}` } },
        })}
      {detail && marker && (
        <g transform={`translate(${marker.x} ${marker.y}) rotate(${marker.ang})`}>
          <rect className="u-start" x={-casing * 0.18} y={-casing * 0.62} width={casing * 0.36} height={casing * 1.24} rx={casing * 0.06} />
        </g>
      )}
    </svg>
  )
}
