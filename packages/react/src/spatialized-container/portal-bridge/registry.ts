import {
  detachPortalFromEntries,
  installListenerMirror,
  isListenerMirrorInstalled,
  attachWrappedToPortal,
  teardownListenerMirror,
} from './listenerMirror'
import { BridgeGlobalState, PortalRegistration } from './shared'

/**
 * Portal document bridge registry.
 *
 * Tracks every active spatial portal (host document, lazy placeholder
 * resolver, portal/windowProxy document) and orchestrates the host-document
 * patches: installed when the first portal registers, torn down when the
 * last one unregisters.
 *
 * State is anchored on `globalThis` (same approach as
 * `runtime/entryRegistry.ts`) rather than module scope: with HMR or a
 * linked SDK, two copies of this module can be evaluated in one realm, and
 * both must share one registry so the host document is never patched twice.
 */
const BRIDGE_KEY = '__WEBSPATIAL_PORTAL_BRIDGE__'

type BridgeGlobal = typeof globalThis & {
  [BRIDGE_KEY]?: BridgeGlobalState
}

function bridgeGlobal(): BridgeGlobal {
  return globalThis as BridgeGlobal
}

function getBridgeState(): BridgeGlobalState {
  const g = bridgeGlobal()
  let state = g[BRIDGE_KEY]
  // Rebuild when the realm's document changed identity (test environments
  // recreate `document` between files); the old document is gone along
  // with its patches.
  if (!state || state.version !== 1 || state.hostDocument !== document) {
    state = {
      version: 1,
      hostDocument: document,
      portals: new Map(),
      listenerBook: new Map(),
      originalAdd: null,
      originalRemove: null,
      savedOwnAddDescriptor: null,
      savedOwnRemoveDescriptor: null,
      patched: false,
      armed: false,
    }
    g[BRIDGE_KEY] = state
  }
  return state
}

/**
 * Installs the host-document listener interception eagerly, before any
 * portal finishes registering. Called from the spatialized portal
 * container's mount effect: child effects run before ancestor effects, so
 * arming there records dismissal listeners an ancestor overlay (e.g. Radix
 * DismissableLayer wrapping the panel) adds in the same commit — the
 * portal itself only registers with the bridge after async native element
 * creation, which would otherwise miss them.
 *
 * While armed with zero portals the patch is pass-through plus
 * bookkeeping; mirrors attach only to registered portal documents.
 * Idempotent and safe across duplicate SDK module instances.
 */
export function armPortalBridgeInterception(): void {
  const state = getBridgeState()
  if (!state.patched) {
    installListenerMirror(state)
    state.patched = isListenerMirrorInstalled(state.hostDocument)
  }
  state.armed = true
}

function disposeRegistration(
  state: BridgeGlobalState,
  reg: PortalRegistration,
): void {
  detachPortalFromEntries(state, reg.portalDocument)
}

function teardownHostPatches(state: BridgeGlobalState): void {
  if (!state.patched) return
  teardownListenerMirror(state)
  state.patched = false
}

/**
 * Registers a spatial portal with the bridge. Returns an idempotent
 * unregister function.
 */
export function registerPortalDocumentBridge(params: {
  windowProxy: WindowProxy
  getPlaceholder: () => HTMLElement | null
}): () => void {
  const { windowProxy, getPlaceholder } = params
  const portalDocument = windowProxy.document
  if (!portalDocument) return () => {}

  const state = getBridgeState()
  armPortalBridgeInterception()

  // Same portal document registered again (StrictMode double-mount /
  // remount race): dispose the stale registration first so wrapped
  // listeners are never duplicated.
  const stale = state.portals.get(portalDocument)
  if (stale) disposeRegistration(state, stale)

  const reg: PortalRegistration = {
    portalDocument,
    windowProxy,
    getPlaceholder,
  }
  state.portals.set(portalDocument, reg)

  // Replay listeners the host registered before this portal mounted.
  for (const byListener of state.listenerBook.values()) {
    for (const entries of byListener.values()) {
      for (const entry of entries) {
        attachWrappedToPortal(state, entry, reg)
      }
    }
  }

  let unregistered = false
  return () => {
    if (unregistered) return
    unregistered = true
    // A newer registration for the same document supersedes this one.
    if (state.portals.get(portalDocument) !== reg) return
    disposeRegistration(state, reg)
    state.portals.delete(portalDocument)
    // The interception patch intentionally stays armed after the last
    // portal unregisters (see armPortalBridgeInterception): listeners
    // registered between portal lifetimes must keep being recorded so the
    // next portal can replay them.
  }
}

export const __portalBridgeTest__ = {
  getState(): BridgeGlobalState | undefined {
    return bridgeGlobal()[BRIDGE_KEY]
  },
  getPortalCount(): number {
    return this.getState()?.portals.size ?? 0
  },
  isHostPatched(): boolean {
    return this.getState()?.patched ?? false
  },
  reset(): void {
    const state = this.getState()
    if (state) {
      for (const reg of [...state.portals.values()]) {
        disposeRegistration(state, reg)
      }
      state.portals.clear()
      teardownHostPatches(state)
      state.armed = false
    }
    delete bridgeGlobal()[BRIDGE_KEY]
  },
}
