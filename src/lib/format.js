// Kleine Text-Helfer. slug() ist bewusst identisch zur Version in
// scripts/redaktion-skeleton.mjs — die Schluessel in redaktion.json muessen
// exakt so aussehen wie das, was die App aus dem Fahrernamen erzeugt.

export function slug(name) {
  return String(name)
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Fuer die Blitzsuche: Gross/Klein- und Akzent-unabhaengig vergleichbar machen
export function suchNorm(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// "Lukas Knips" -> "LK" (Fallback-Avatar in der Fahrerkarte)
export function initialen(name) {
  const teile = String(name ?? '').trim().split(/[\s.]+/).filter(Boolean)
  if (!teile.length) return '?'
  if (teile.length === 1) return teile[0].slice(0, 2).toUpperCase()
  return (teile[0][0] + teile[teile.length - 1][0]).toUpperCase()
}

// Startnummer huebsch: null -> "—"
export function nummer(nr) {
  return nr == null ? '—' : String(nr)
}
