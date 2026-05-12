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
