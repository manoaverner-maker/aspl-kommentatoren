// Erzeugt src/data/streckenlayout.json (Streckenumrisse) aus offenen Quellen.
// EINMAL laufen lassen (braucht Netz); das Ergebnis ist statisch und wird
// committet, sodass die App offline bleibt.
//
//   F1-/GP-Strecken: bacinger/f1-circuits (GeoJSON, MIT) — echte Geo-Koordinaten
//   übrige ACC-Strecken: Wikimedia Commons (SVG, CC) — Umriss + Quellenangabe
//
// Aufruf:  node scripts/strecken-layout.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..')
const zielDatei = join(wurzel, 'src', 'data', 'streckenlayout.json')
const UA = 'ASPL-Kommentatoren-Cockpit/1.0 (track outline; mailto:manoa.verner@gmail.com)'

const schlaf = (ms) => new Promise((r) => setTimeout(r, ms))

async function get(url, versuch = 0) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' } })
  if (r.status === 429 && versuch < 5) {
    await schlaf(3000 * (versuch + 1)) // Rate-Limit → warten und erneut
    return get(url, versuch + 1)
  }
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`)
  await schlaf(250) // höflich bleiben
  return r.text()
}

// ---- F1-GeoJSON: LineString (lng,lat) → normalisierter SVG-Pfad -------------
const F1 = {
  imola: 'it-1953', barcelona: 'es-1991', redbullring: 'at-1969',
  nuerburgring: 'de-1927', monza: 'it-1922', silverstone: 'gb-1948',
  spa: 'be-1925', hungaroring: 'hu-1986', zandvoort: 'nl-1948',
  suzuka: 'jp-1962', kyalami: 'za-1961', cota: 'us-2012',
  indianapolis: 'us-1909', watkinsglen: 'us-1956', paulricard: 'fr-1969',
}

function geoZuPfad(coords) {
  const latM = coords.reduce((s, c) => s + c[1], 0) / coords.length
  const k = Math.cos((latM * Math.PI) / 180)
  const pts = coords.map(([lng, lat]) => [lng * k, -lat]) // y invertiert (Screen)
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const spanX = maxX - minX || 1, spanY = maxY - minY || 1
  const pad = 60, groesse = 1000
  const skala = (groesse - 2 * pad) / Math.max(spanX, spanY)
  const offX = pad + ((groesse - 2 * pad) - spanX * skala) / 2
  const offY = pad + ((groesse - 2 * pad) - spanY * skala) / 2
  const norm = pts.map(([x, y]) => [
    +(offX + (x - minX) * skala).toFixed(1),
    +(offY + (y - minY) * skala).toFixed(1),
  ])
  const d = norm.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ') + ' Z'
  return { d, viewBox: `0 0 ${groesse} ${groesse}` }
}

async function ausF1(id) {
  const gj = JSON.parse(await get(`https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/${id}.geojson`))
  const g = gj.features[0].geometry
  const coords = g.type === 'LineString' ? g.coordinates : g.coordinates.flat()
  const { d, viewBox } = geoZuPfad(coords)
  return { source: 'f1-circuits', d, viewBox, quelle: { title: gj.features[0].properties.Name, url: 'https://github.com/bacinger/f1-circuits', license: 'MIT' } }
}

// ---- Wikimedia-SVG: Haupt-Streckenpfad extrahieren -------------------------
// Commons-Dateinamen (Special:FilePath löst zur Datei auf)
const WIKI = {
  lagunaseca: 'Laguna_Seca.svg',
  bathurst: 'Mount Panorama street racing circuit in Australia.svg',
  brandshatch: 'Brands Hatch 2003.svg',
  donington: 'Donington Park short.svg',
  misano: 'Misano World Circuit.svg',
  oultonpark: 'Oulton_Park.svg',
  snetterton: 'Snetterton circuit layout.svg',
  zolder: 'Circuit Zolder-2002.svg',
  valencia: 'Valencia (Ricardo Tormo) track map.svg',
  nordschleife: 'Nürburgring - Nordschleife.svg',
}

function viewBoxVon(svg) {
  const vb = svg.match(/viewBox="([^"]+)"/)
  if (vb) return vb[1]
  const w = svg.match(/\bwidth="([\d.]+)/)
  const h = svg.match(/\bheight="([\d.]+)/)
  return w && h ? `0 0 ${w[1]} ${h[1]}` : '0 0 1000 1000'
}

// Alle nicht-textigen Pfade mit Stützpunkt-Zahl + Transform-Kette einsammeln
function sammlePfade(svg) {
  const tokens = [...svg.matchAll(/<g\b[^>]*?>|<\/g>|<path\b[^>]*?>/g)]
  const stack = []
  const pfade = []
  for (const t of tokens) {
    const s = t[0]
    if (s === '</g>') { stack.pop(); continue }
    if (s.startsWith('<g')) {
      stack.push((s.match(/transform="([^"]*)"/) || [])[1] || '')
      continue
    }
    const d = (s.match(/\bd="([^"]+)"/) || [])[1]
    if (!d) continue
    const style = (s.match(/style="([^"]*)"/) || [])[1] || ''
    if (/font-size|font-family/.test(style)) continue
    const nums = (d.match(/-?\d*\.?\d+/g) || []).length
    if (nums < 12) continue
    const ownTr = (s.match(/transform="([^"]*)"/) || [])[1] || ''
    const transform = [...stack, ownTr].filter(Boolean).join(' ') || null
    const stroked = /fill\s*:\s*none/.test(style) || /\bstroke\s*:/.test(style)
    pfade.push({ d, transform, nums, score: nums * (stroked ? 1 : 0.55) })
  }
  return pfade
}

// Manche Commons-SVGs zeichnen die Strecke aus mehreren Segmenten (statt einem
// Pfad) — für diese alle grossen Segmente kombinieren.
const SEGMENTIERT = new Set(['snetterton'])

async function commonsAttribution(datei) {
  try {
    const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata|url&titles=${encodeURIComponent('File:' + datei)}`
    const j = JSON.parse(await get(api))
    const page = Object.values(j.query.pages)[0]
    const ex = page.imageinfo?.[0]?.extmetadata ?? {}
    const strip = (h) => (h ? String(h).replace(/<[^>]+>/g, '').trim() : '')
    return {
      author: strip(ex.Artist?.value) || 'Wikimedia Commons',
      license: strip(ex.LicenseShortName?.value) || 'CC',
      url: page.imageinfo?.[0]?.descriptionurl || `https://commons.wikimedia.org/wiki/File:${datei}`,
    }
  } catch {
    return { author: 'Wikimedia Commons', license: 'CC', url: `https://commons.wikimedia.org/wiki/File:${datei}` }
  }
}

async function ausWiki(id, datei) {
  const svg = await get(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(datei)}`)
  const pfade = sammlePfade(svg)
  if (!pfade.length) throw new Error('kein Pfad gefunden')
  let pieces
  if (SEGMENTIERT.has(id)) {
    pieces = pfade.filter((p) => p.nums >= 50).map((p) => ({ d: p.d, transform: p.transform }))
  } else {
    const best = pfade.reduce((a, b) => (b.score > a.score ? b : a))
    pieces = [{ d: best.d, transform: best.transform }]
  }
  const attr = await commonsAttribution(datei)
  return {
    source: 'wikimedia',
    pieces,
    viewBox: viewBoxVon(svg),
    quelle: { title: datei.replace(/_/g, ' ').replace(/\.svg$/, ''), url: attr.url, license: attr.license, author: attr.author },
  }
}

// ---- Lauf ------------------------------------------------------------------
const ergebnis = {}
const fehler = []

for (const [id, f1id] of Object.entries(F1)) {
  try {
    ergebnis[id] = await ausF1(f1id)
    console.log(`✓ ${id} (f1:${f1id}) ${ergebnis[id].d.length} chars`)
  } catch (e) {
    fehler.push(`${id}: ${e.message}`)
    console.log(`✗ ${id} — ${e.message}`)
  }
}
for (const [id, datei] of Object.entries(WIKI)) {
  try {
    ergebnis[id] = await ausWiki(id, datei)
    console.log(`✓ ${id} (wiki:${datei}) pieces=${ergebnis[id].pieces.length}`)
  } catch (e) {
    fehler.push(`${id}: ${e.message}`)
    console.log(`✗ ${id} — ${e.message}`)
  }
}

mkdirSync(dirname(zielDatei), { recursive: true })
writeFileSync(zielDatei, JSON.stringify(ergebnis, null, 2) + '\n', 'utf8')
console.log(`\n${Object.keys(ergebnis).length} Strecken geschrieben, ${fehler.length} Fehler`)
if (fehler.length) console.log(fehler.join('\n'))
