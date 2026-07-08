// Winziger Hash-Router. Hash-Routing, damit GitHub Pages keine SPA-Rewrites
// braucht — auch die OBS-Overlay-URLs (#/overlay/...) funktionieren so direkt.
import { useSyncExternalStore } from 'react'

const OVERLAY_TYPEN = ['fahrer', 'standings', 'podium', 'duell', 'next']

function dec(s) {
  try {
    return decodeURIComponent(s ?? '')
  } catch {
    return s ?? ''
  }
}

function hashQuery(roh) {
  return new URLSearchParams(roh.split('?')[1] || '')
}

export function parseHash() {
  const roh = window.location.hash.replace(/^#\/?/, '')
  const teile = roh.split('?')[0].split('/').filter(Boolean).map(dec)
  const query = hashQuery(roh)

  if (teile[0] === 'overlay') {
    if (OVERLAY_TYPEN.includes(teile[1])) {
      return { name: 'overlay', typ: teile[1], saisonId: teile[2], seriesId: teile[3], arg: teile[4], query }
    }
    // Alt-Schema #/overlay/<saison>/<series>/<slug> = Fahrer-Overlay
    return { name: 'overlay', typ: 'fahrer', saisonId: teile[1], seriesId: teile[2], arg: teile[3], query }
  }
  if (teile[0] === 'meisterschaft') return { name: 'meisterschaft', query }
  if (teile[0] === 'vergleich') return { name: 'vergleich', query }
  if (teile[0] === 'overlays') return { name: 'overlays', query }
  if (teile[0] === 'strecken') return { name: 'strecken', query }
  return { name: 'grid', query }
}

function abonniere(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
function snapshot() {
  return window.location.hash
}

export function useRoute() {
  useSyncExternalStore(abonniere, snapshot)
  return parseHash()
}

export function gehe(hash) {
  window.location.hash = hash
}

// Baut eine Overlay-URL. Erhält einen evtl. gesetzten ?daten=-Override (steht
// in location.search vor dem #) automatisch mit — praktisch fuer lokale Tests.
export function overlayUrl(typ, saisonId, seriesId, arg, opts) {
  const basis = window.location.href.split('#')[0]
  let u = `${basis}#/overlay/${typ}/${encodeURIComponent(saisonId)}/${encodeURIComponent(seriesId)}`
  if (arg != null && arg !== '') u += `/${encodeURIComponent(arg)}`
  const q = new URLSearchParams(opts || {}).toString()
  if (q) u += `?${q}`
  return u
}
