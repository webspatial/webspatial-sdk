/**
 * Shared types for the portal document bridge.
 *
 * The bridge makes the hidden host-document placeholder stand in for the
 * spatial portal panel (child webview document) so document-level machinery
 * used by overlay libraries (Radix Dialog, Headless UI, floating-ui) keeps
 * working: dismissal listeners registered on the host document see events
 * that actually fired inside the portal document, retargeted onto the
 * placeholder.
 *
 * All mutable bridge state lives in a single `BridgeGlobalState` object
 * anchored on `globalThis` (see registry.ts) so duplicate SDK module
 * instances (HMR / linked SDK) share one registry and never double-patch
 * the host document.
 */

export interface PortalRegistration {
  portalDocument: Document
  windowProxy: WindowProxy
  /**
   * Lazy placeholder resolver. The host-side placeholder
   * (`portalInstanceObject.dom`) is a cache that can be null early and can
   * change identity across remounts, so the bridge never captures it.
   */
  getPlaceholder: () => HTMLElement | null
}

export interface MirroredEntry {
  type: string
  listener: EventListenerOrEventListenerObject
  capture: boolean
  passive: boolean | undefined
  once: boolean
  /** portal document -> remove the wrapped listener from that document */
  portalCleanups: Map<Document, () => void>
  /** Removes the host-side janitor used for `once` bookkeeping. */
  removeHostJanitor: (() => void) | null
  removed: boolean
}

export interface BridgeGlobalState {
  version: 1
  hostDocument: Document
  portals: Map<Document, PortalRegistration>
  /** type -> listener -> entries (max one per capture flag, DOM semantics) */
  listenerBook: Map<
    string,
    Map<EventListenerOrEventListenerObject, MirroredEntry[]>
  >
  originalAdd: Document['addEventListener'] | null
  originalRemove: Document['removeEventListener'] | null
  savedOwnAddDescriptor: PropertyDescriptor | null
  savedOwnRemoveDescriptor: PropertyDescriptor | null
  patched: boolean
  /**
   * Once armed (first spatialized portal container mount), the interception
   * patch stays installed even while zero portals are registered, so
   * dismissal listeners added before/between portal registrations (e.g. a
   * dialog whose own panel is the first portal and registers only after
   * async native element creation) are recorded and replay onto the next
   * portal. Fully reversed only by the test-hook reset.
   */
  armed: boolean
}

export function safeGetPlaceholder(
  reg: PortalRegistration,
): HTMLElement | null {
  try {
    return reg.getPlaceholder() ?? null
  } catch {
    return null
  }
}

export function devWarn(message: string, error?: unknown): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(`[WebSpatial] ${message}`, error ?? '')
  }
}
