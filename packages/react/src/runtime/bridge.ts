import { detectSpatialRuntime } from './detect'
import { WebSpatialBootError } from './errors'

export type SpatialImplementation = typeof import('../spatial')
export type SpatialImplementationLoader = () => Promise<SpatialImplementation>
export type SpatialReadyListener = () => void
export type SpatialLoadErrorListener = (error: WebSpatialBootError) => void

let spatialImpl: SpatialImplementation | null = null
let loadPromise: Promise<SpatialImplementation | null> | null = null
let loadAttempt = 0
let spatialImplLoader: SpatialImplementationLoader = () => import('../spatial')

const readyListeners = new Set<SpatialReadyListener>()
const errorListeners = new Set<SpatialLoadErrorListener>()

function notifyReadyListeners(): void {
  for (const listener of [...readyListeners]) {
    listener()
  }
}

function notifyErrorListeners(error: WebSpatialBootError): void {
  for (const listener of [...errorListeners]) {
    listener(error)
  }
}

function toBootError(error: unknown, attempt: number): WebSpatialBootError {
  if (error instanceof WebSpatialBootError) {
    return error
  }
  return new WebSpatialBootError({ cause: error, attempt })
}

export function getSpatialImpl(): SpatialImplementation | null {
  return spatialImpl
}

export function isSpatialReady(): boolean {
  return spatialImpl !== null
}

export function subscribeSpatialReady(
  listener: SpatialReadyListener,
): () => void {
  readyListeners.add(listener)
  return () => {
    readyListeners.delete(listener)
  }
}

export function onSpatialLoadError(
  listener: SpatialLoadErrorListener,
): () => void {
  errorListeners.add(listener)
  return () => {
    errorListeners.delete(listener)
  }
}

export function loadSpatialImpl(): Promise<SpatialImplementation | null> {
  if (spatialImpl !== null) {
    return Promise.resolve(spatialImpl)
  }
  if (loadPromise !== null) {
    return loadPromise
  }

  // SSR / non-WebSpatial gating per spatial-lazy-load spec "Bridge singleton /
  // SSR safety" Scenario: bridge methods MUST resolve to `null` without
  // scheduling a network request when no spatial runtime is detectable.
  if (detectSpatialRuntime() === null) {
    return Promise.resolve(null)
  }

  const attempt = loadAttempt + 1
  loadAttempt = attempt

  loadPromise = spatialImplLoader()
    .then(impl => {
      spatialImpl = impl
      loadPromise = null
      notifyReadyListeners()
      return impl
    })
    .catch(error => {
      loadPromise = null
      const bootError = toBootError(error, attempt)
      notifyErrorListeners(bootError)
      throw bootError
    })

  return loadPromise
}

// Internal-only: the eager entry (`src/eager.ts`) calls this at module-
// evaluation time to preload the bridge with the statically-linked spatial
// implementation. After this call the bridge is permanently in the "ready"
// state for the page lifetime — `bootSpatial()` becomes a no-op (the
// `spatialImpl !== null` short-circuit at the top of `loadSpatialImpl()`
// handles this), `isSpatialReady()` returns `true`, and `useSpatialReady()`
// returns `true`. This is precisely the runtime contract the eager entry
// promises to consumers per the "Eager-mode entry for spatial-only consumers"
// Requirement.
//
// First call wins: subsequent calls with a different implementation are
// silently ignored so that mixing import roots (an unsupported but possible
// configuration; see "Mixed-import shape is not supported" Scenario) does
// NOT corrupt the bridge. The first preload sets the contract; later
// imports either match it (no-op) or are ignored (they would only happen
// if a consumer simultaneously imports the lazy and eager entries, which
// the migration guide explicitly forbids).
//
// This function is NOT re-exported from the default-entry public surface
// — it is an internal coupling between the bridge and the eager entry.
// The double-underscore prefix matches the test-only helpers below to
// signal "internal" without prefixing every export with `internal_`.
export function __internalSetSpatialImpl(impl: SpatialImplementation): void {
  if (spatialImpl !== null) return
  spatialImpl = impl
  loadAttempt = 1
  notifyReadyListeners()
}

export function __setSpatialImplLoaderForTests(
  loader: SpatialImplementationLoader,
): void {
  spatialImplLoader = loader
}

export function __getSpatialLoadAttemptForTests(): number {
  return loadAttempt
}

export function __getSpatialReadySubscriberCountForTests(): number {
  return readyListeners.size
}

export function __resetSpatialBridgeForTests(): void {
  spatialImpl = null
  loadPromise = null
  loadAttempt = 0
  readyListeners.clear()
  errorListeners.clear()
  spatialImplLoader = () => import('../spatial')
}
