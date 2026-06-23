import type { SpatialObject } from './SpatialObject'

const trackedObjects = new Map<SpatialObject, string>()
const trackedWindowProxies = new Map<WindowProxy, string>()

let installed = false
let observedHref = ''
let routePollTimer: ReturnType<typeof setInterval> | undefined

function getCurrentHref(): string {
  return typeof window === 'undefined' ? '' : window.location.href
}

function cleanupTrackedSpatialObjects(currentHref = getCurrentHref()) {
  const objects = [...trackedObjects.entries()]
    .filter(([, ownerHref]) => ownerHref !== currentHref)
    .map(([object]) => object)
    .reverse()
  const windowProxies = [...trackedWindowProxies.entries()]
    .filter(([, ownerHref]) => ownerHref !== currentHref)
    .map(([windowProxy]) => windowProxy)
    .reverse()

  for (const object of objects) {
    trackedObjects.delete(object)
  }
  for (const windowProxy of windowProxies) {
    trackedWindowProxies.delete(windowProxy)
  }

  stopRoutePollIfIdle()

  for (const windowProxy of windowProxies) {
    closeWindowProxy(windowProxy)
  }

  for (const object of objects) {
    if (object.isDestroyed) continue
    object.destroy().catch(() => {})
  }
}

function closeWindowProxy(windowProxy: WindowProxy) {
  try {
    windowProxy.close()
  } catch {}
}

function onRouteChange() {
  const currentHref = getCurrentHref()
  if (currentHref === observedHref) return
  observedHref = currentHref
  cleanupTrackedSpatialObjects(currentHref)
}

function startRoutePoll() {
  if (routePollTimer !== undefined || typeof window === 'undefined') return
  routePollTimer = setInterval(() => {
    const currentHref = getCurrentHref()
    if (currentHref === observedHref) return
    observedHref = currentHref
    cleanupTrackedSpatialObjects(currentHref)
  }, 250)
}

function stopRoutePollIfIdle() {
  if (
    trackedObjects.size > 0 ||
    trackedWindowProxies.size > 0 ||
    routePollTimer === undefined
  )
    return
  clearInterval(routePollTimer)
  routePollTimer = undefined
}

function installRouteCleanup() {
  if (installed || typeof window === 'undefined') return
  installed = true
  observedHref = getCurrentHref()
  window.addEventListener('hashchange', onRouteChange)
  window.addEventListener('popstate', onRouteChange)
}

export function prepareSpatialRouteLifetime(): string {
  installRouteCleanup()
  return getCurrentHref()
}

export function trackSpatialRouteObject(
  object: SpatialObject,
  ownerHref = getCurrentHref(),
) {
  installRouteCleanup()
  if (ownerHref !== getCurrentHref()) {
    object.destroy().catch(() => {})
    return
  }
  trackedObjects.set(object, ownerHref)
  startRoutePoll()
}

export function untrackSpatialRouteObject(object: SpatialObject) {
  trackedObjects.delete(object)
  stopRoutePollIfIdle()
}

export function trackSpatialRouteWindowProxy(
  windowProxy: WindowProxy | null,
  ownerHref = getCurrentHref(),
) {
  if (!windowProxy) return
  installRouteCleanup()
  if (ownerHref !== getCurrentHref()) {
    closeWindowProxy(windowProxy)
    return
  }
  trackedWindowProxies.set(windowProxy, ownerHref)
  startRoutePoll()
}

export function untrackSpatialRouteWindowProxy(
  windowProxy: WindowProxy | null,
) {
  if (!windowProxy) return
  trackedWindowProxies.delete(windowProxy)
  stopRoutePollIfIdle()
}

export function __resetSpatialRouteCleanupForTests() {
  trackedObjects.clear()
  trackedWindowProxies.clear()
  if (routePollTimer !== undefined) {
    clearInterval(routePollTimer)
    routePollTimer = undefined
  }
  if (installed && typeof window !== 'undefined') {
    window.removeEventListener('hashchange', onRouteChange)
    window.removeEventListener('popstate', onRouteChange)
  }
  installed = false
  observedHref = ''
}
