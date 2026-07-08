import { createMirroredEvent } from './eventProxy'
import {
  BridgeGlobalState,
  MirroredEntry,
  PortalRegistration,
  devWarn,
} from './shared'

/**
 * Mirrors host-document listeners for dismissal-relevant event types onto
 * every active portal document, so libraries like Radix DismissableLayer
 * (which listen on the host `document`) observe events that actually fire
 * inside the portal panel.
 *
 * The mirror never re-dispatches events on the host document: React
 * synthetic events already cross the portal boundary, so a `dispatchEvent`
 * redispatch would double-fire handlers. Instead the original listener is
 * invoked directly with a proxied event whose `target` is remapped to the
 * host-side placeholder (see eventProxy.ts).
 */
export const MIRRORED_EVENT_TYPES: ReadonlySet<string> = new Set([
  'pointerdown',
  'pointerup',
  'click',
  'keydown',
  'focusin',
])

const PATCH_MARKER = '__webspatialPortalBridgePatch'

interface NormalizedOptions {
  capture: boolean
  passive: boolean | undefined
  once: boolean
  signal: AbortSignal | undefined
}

function normalizeOptions(
  options?: boolean | AddEventListenerOptions,
): NormalizedOptions {
  if (typeof options === 'boolean') {
    return {
      capture: options,
      passive: undefined,
      once: false,
      signal: undefined,
    }
  }
  return {
    capture: !!options?.capture,
    passive: options?.passive,
    once: !!options?.once,
    signal: options?.signal,
  }
}

function getEntries(
  state: BridgeGlobalState,
  type: string,
  listener: EventListenerOrEventListenerObject,
): MirroredEntry[] | undefined {
  return state.listenerBook.get(type)?.get(listener)
}

function pushEntry(state: BridgeGlobalState, entry: MirroredEntry): void {
  let byListener = state.listenerBook.get(entry.type)
  if (!byListener) {
    byListener = new Map()
    state.listenerBook.set(entry.type, byListener)
  }
  let entries = byListener.get(entry.listener)
  if (!entries) {
    entries = []
    byListener.set(entry.listener, entries)
  }
  entries.push(entry)
}

function deleteEntry(state: BridgeGlobalState, entry: MirroredEntry): void {
  const byListener = state.listenerBook.get(entry.type)
  const entries = byListener?.get(entry.listener)
  if (!entries) return
  const index = entries.indexOf(entry)
  if (index >= 0) entries.splice(index, 1)
  if (entries.length === 0) byListener!.delete(entry.listener)
  if (byListener && byListener.size === 0) state.listenerBook.delete(entry.type)
}

function invokeListener(
  listener: EventListenerOrEventListenerObject,
  event: Event,
  hostDocument: Document,
): void {
  try {
    if (typeof listener === 'function') {
      listener.call(hostDocument, event)
    } else {
      listener.handleEvent(event)
    }
  } catch (error) {
    // Mirror native EventTarget behavior: one throwing listener must not
    // break the others (or the bridge's own bookkeeping).
    devWarn('portal bridge: mirrored listener threw', error)
  }
}

export function removeMirroredEntry(
  state: BridgeGlobalState,
  entry: MirroredEntry,
  alsoRemoveHostOriginal: boolean,
): void {
  if (entry.removed) return
  entry.removed = true
  for (const cleanup of entry.portalCleanups.values()) cleanup()
  entry.portalCleanups.clear()
  entry.removeHostJanitor?.()
  entry.removeHostJanitor = null
  if (alsoRemoveHostOriginal && state.originalRemove) {
    state.originalRemove.call(
      state.hostDocument,
      entry.type,
      entry.listener,
      entry.capture,
    )
  }
  deleteEntry(state, entry)
}

export function attachWrappedToPortal(
  state: BridgeGlobalState,
  entry: MirroredEntry,
  reg: PortalRegistration,
): void {
  if (entry.removed || entry.portalCleanups.has(reg.portalDocument)) return
  const wrapped = (realEvent: Event) => {
    const proxied = createMirroredEvent(realEvent, reg, state)
    invokeListener(entry.listener, proxied, state.hostDocument)
    if (entry.once) {
      // Exactly-once across documents: the portal copy fired first, so the
      // not-yet-fired host original must be removed too.
      removeMirroredEntry(state, entry, true)
    }
  }
  // `once` is intentionally not passed through: entry teardown is
  // centralized so all portal copies and the host original stay in sync.
  reg.portalDocument.addEventListener(entry.type, wrapped, {
    capture: entry.capture,
    passive: entry.passive,
  })
  entry.portalCleanups.set(reg.portalDocument, () =>
    reg.portalDocument.removeEventListener(entry.type, wrapped, entry.capture),
  )
}

export function detachPortalFromEntries(
  state: BridgeGlobalState,
  portalDocument: Document,
): void {
  for (const byListener of state.listenerBook.values()) {
    for (const entries of byListener.values()) {
      for (const entry of entries) {
        const cleanup = entry.portalCleanups.get(portalDocument)
        if (cleanup) {
          cleanup()
          entry.portalCleanups.delete(portalDocument)
        }
      }
    }
  }
}

function maybeMirrorAdd(
  state: BridgeGlobalState,
  type: string,
  listener: EventListenerOrEventListenerObject | null,
  options?: boolean | AddEventListenerOptions,
): void {
  if (!MIRRORED_EVENT_TYPES.has(type) || listener == null) return
  const { capture, passive, once, signal } = normalizeOptions(options)
  if (signal?.aborted) return
  // DOM dedupe semantics: same (type, listener, capture) is a no-op for the
  // original add, so it must be a no-op for the mirror too.
  const existing = getEntries(state, type, listener)
  if (existing?.some(entry => entry.capture === capture)) return

  const entry: MirroredEntry = {
    type,
    listener,
    capture,
    passive,
    once,
    portalCleanups: new Map(),
    removeHostJanitor: null,
    removed: false,
  }
  pushEntry(state, entry)

  if (once) {
    // If the host copy fires first, the browser auto-removes it (`once`);
    // this janitor runs right after it in the same phase and clears the
    // portal mirrors so the listener can never fire a second time.
    const janitor = () => {
      entry.removeHostJanitor = null
      removeMirroredEntry(state, entry, false)
    }
    state.originalAdd!.call(state.hostDocument, type, janitor, {
      capture,
      once: true,
    })
    entry.removeHostJanitor = () => {
      state.originalRemove?.call(state.hostDocument, type, janitor, capture)
    }
  }

  if (signal) {
    signal.addEventListener(
      'abort',
      () => removeMirroredEntry(state, entry, false),
      {
        once: true,
      },
    )
  }

  for (const reg of state.portals.values()) {
    attachWrappedToPortal(state, entry, reg)
  }
}

function maybeMirrorRemove(
  state: BridgeGlobalState,
  type: string,
  listener: EventListenerOrEventListenerObject | null,
  options?: boolean | EventListenerOptions,
): void {
  if (!MIRRORED_EVENT_TYPES.has(type) || listener == null) return
  const capture = typeof options === 'boolean' ? options : !!options?.capture
  const entries = getEntries(state, type, listener)
  const entry = entries?.find(candidate => candidate.capture === capture)
  if (entry) removeMirroredEntry(state, entry, false)
}

export function isListenerMirrorInstalled(hostDocument: Document): boolean {
  return (
    (hostDocument.addEventListener as unknown as Record<string, unknown>)[
      PATCH_MARKER
    ] === true
  )
}

export function installListenerMirror(state: BridgeGlobalState): void {
  const doc = state.hostDocument
  // Belt-and-braces against double patching: shared globalThis state should
  // already prevent it, but a marker on the patched function protects
  // against a second bridge copy with divergent state (e.g. a future
  // version bump of the state shape).
  if (isListenerMirrorInstalled(doc)) return

  state.savedOwnAddDescriptor =
    Object.getOwnPropertyDescriptor(doc, 'addEventListener') ?? null
  state.savedOwnRemoveDescriptor =
    Object.getOwnPropertyDescriptor(doc, 'removeEventListener') ?? null
  state.originalAdd = doc.addEventListener
  state.originalRemove = doc.removeEventListener

  const patchedAdd = function (
    this: Document,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) {
    state.originalAdd!.call(
      this,
      type,
      listener as EventListenerOrEventListenerObject,
      options,
    )
    if (this !== state.hostDocument) return
    maybeMirrorAdd(state, type, listener, options)
  }
  const patchedRemove = function (
    this: Document,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ) {
    state.originalRemove!.call(
      this,
      type,
      listener as EventListenerOrEventListenerObject,
      options,
    )
    if (this !== state.hostDocument) return
    maybeMirrorRemove(state, type, listener, options)
  }
  ;(patchedAdd as unknown as Record<string, unknown>)[PATCH_MARKER] = true
  ;(patchedRemove as unknown as Record<string, unknown>)[PATCH_MARKER] = true

  Object.defineProperty(doc, 'addEventListener', {
    configurable: true,
    writable: true,
    value: patchedAdd,
  })
  Object.defineProperty(doc, 'removeEventListener', {
    configurable: true,
    writable: true,
    value: patchedRemove,
  })
}

export function teardownListenerMirror(state: BridgeGlobalState): void {
  // Drop remaining bookkeeping (janitors and any straggler portal copies).
  for (const byListener of [...state.listenerBook.values()]) {
    for (const entries of [...byListener.values()]) {
      for (const entry of [...entries]) {
        removeMirroredEntry(state, entry, false)
      }
    }
  }
  // Teardown only runs on a full bridge reset (test hook / realm change):
  // once armed, the interception stays installed across portal lifetimes
  // so the book keeps tracking adds AND removals. Clearing here is safe
  // because the patch is restored in the same step - with interception
  // gone, stale entries could never be kept accurate.
  state.listenerBook.clear()

  const doc = state.hostDocument
  if (state.savedOwnAddDescriptor) {
    Object.defineProperty(doc, 'addEventListener', state.savedOwnAddDescriptor)
  } else {
    delete (doc as Partial<Document>).addEventListener
  }
  if (state.savedOwnRemoveDescriptor) {
    Object.defineProperty(
      doc,
      'removeEventListener',
      state.savedOwnRemoveDescriptor,
    )
  } else {
    delete (doc as Partial<Document>).removeEventListener
  }
  state.savedOwnAddDescriptor = null
  state.savedOwnRemoveDescriptor = null
  state.originalAdd = null
  state.originalRemove = null
}
