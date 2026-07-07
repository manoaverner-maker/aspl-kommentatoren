// Winziger Hash-Router. Hash-Routing, damit GitHub Pages keine SPA-Rewrites
// braucht — auch die OBS-Overlay-URL (#/overlay/...) funktioniert so direkt.
import { useSyncExternalStore } from 'react'

function dec(s) {
  try {
    return decodeURIComponent(s ?? '')
  } catch {
    return s ?? ''
  }
}

export function parseHash() {
  const roh = window.location.hash.replace(/^#\/?/, '')
  const pfad = roh.split('?')[0]
  const teile = pfad.split('/').filter(Boolean).map(dec)

  if (teile[0] === 'overlay') {
    return { name: 'overlay', saisonId: teile[1], seriesId: teile[2], slug: teile[3] }
  }
  if (teile[0] === 'meisterschaft') return { name: 'meisterschaft' }
  return { name: 'grid' }
}

function abonniere(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

// Snapshot muss stabil sein (gleicher String -> gleicher Wert), damit
// useSyncExternalStore nicht endlos neu rendert.
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

export function overlayUrl(saisonId, seriesId, fahrerSlug) {
  const basis = window.location.href.split('#')[0]
  return `${basis}#/overlay/${encodeURIComponent(saisonId)}/${encodeURIComponent(
    seriesId
  )}/${encodeURIComponent(fahrerSlug)}`
}
