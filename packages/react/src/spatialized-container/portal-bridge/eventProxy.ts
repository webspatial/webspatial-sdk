import {
  BridgeGlobalState,
  PortalRegistration,
  safeGetPlaceholder,
} from './shared'

/**
 * Wraps a real event that fired inside a portal document so a host-document
 * listener sees it as if it happened on the host-side placeholder element.
 *
 * A Proxy (rather than Object.create) is used because event fields like
 * `key`, `clientX`, or `pointerId` are branded prototype accessors: reading
 * them must happen with the real event as receiver, and methods like
 * `preventDefault` must be invoked with the real event as `this`.
 * `Reflect.get(realEvent, prop)` + per-property bound-function caching
 * handles both uniformly.
 *
 * Known Phase-1 limitation: on device the portal document lives in another
 * realm, so `proxied instanceof hostWindow.MouseEvent` is false, and
 * `isTrusted` reflects the real portal event (true for real user input).
 */
export function createMirroredEvent(
  realEvent: Event,
  reg: PortalRegistration,
  state: BridgeGlobalState,
): Event {
  const boundCache = new Map<PropertyKey, unknown>()

  const composedPathOverride = (): EventTarget[] => {
    const placeholder = safeGetPlaceholder(reg)
    if (!placeholder) return realEvent.composedPath()
    const path: EventTarget[] = []
    let current: Node | null = placeholder
    while (current) {
      path.push(current)
      current = current.parentNode
    }
    const hostWindow = state.hostDocument.defaultView
    if (path[path.length - 1] === state.hostDocument && hostWindow) {
      path.push(hostWindow)
    }
    return path
  }

  return new Proxy(realEvent, {
    get(target, prop) {
      if (prop === 'target' || prop === 'srcElement') {
        return safeGetPlaceholder(reg) ?? Reflect.get(target, prop)
      }
      if (prop === 'currentTarget') {
        return state.hostDocument
      }
      if (prop === 'composedPath') {
        return composedPathOverride
      }
      const value = Reflect.get(target, prop)
      if (typeof value === 'function') {
        let bound = boundCache.get(prop)
        if (bound === undefined) {
          bound = (value as (...args: unknown[]) => unknown).bind(target)
          boundCache.set(prop, bound)
        }
        return bound
      }
      return value
    },
    set(target, prop, value) {
      return Reflect.set(target, prop, value)
    },
  }) as Event
}
