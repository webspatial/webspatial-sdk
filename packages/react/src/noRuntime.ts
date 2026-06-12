// Redirect to empty module for treeshaking
export default {}

export const SpatialHelper = {}

/** Minimal `Vec3` shape for the web no-runtime bundle (see real type in `@webspatial/core-sdk`). */
export interface Vec3 {
  x: number
  y: number
  z: number
}

/**
 * Web bundle stub: no native WebSpatial runtime — capability checks are conservative.
 * Metrics/coordinate helpers stay available so plain-browser demos keep working.
 */
export function supports(name: string, _tokens?: readonly string[]): boolean {
  if (name === 'useMetrics' || name === 'convertCoordinate') {
    return true
  }
  return false
}

export class WebSpatialRuntimeError extends Error {
  public readonly capability: string

  constructor(capability: string, message?: string) {
    super(
      message ??
        `Capability "${capability}" is not supported in this WebSpatial runtime`,
    )
    this.name = 'WebSpatialRuntimeError'
    this.capability = capability
  }
}

export class Spatial {
  /**
   * Requests a session object from the browser
   * @returns The session or null if not available in the current browser
   * [TODO] discuss implications of this not being async
   */
  requestSession() {
    return null
  }
  /**
   * Checks if the current page is running in a spatial web environment.
   * This method detects if the application is running in a WebSpatial-compatible browser.
   * @returns True if running in a spatial web environment, false otherwise
   */
  runInSpatialWeb() {
    return false
  }
  /**
   * @returns true if web spatial is supported by this webpage
   */
  isSupported() {
    return false
  }
  /**
   * Gets the native version, format is "x.x.x"
   * @returns native version string, or null when runtime is unavailable
   */
  getNativeVersion() {
    return null
  }
  /**
   * Gets the client version, format is "x.x.x"
   * @returns client version string, or null when runtime is unavailable
   */
  getClientVersion() {
    return null
  }
}

export const version = undefined // no runtime so this should set undefined

export class SpatialScene {}

export function isSSREnv() {
  return false
}

export const PhysicalMetrics = {
  pointToPhysical: (point: number, options?: any) => {
    return point / 1360
  },
  physicalToPoint: (physical: number, options?: any) => {
    return physical * 1360
  },
  getValue: () => ({
    meterToPtUnscaled: 1360,
    meterToPtScaled: 1360,
  }),
  subscribe: (cb: any) => () => {},
}
// --- Web bundle: browser-only utilities (no native runtime needed) ---

type NoRuntimeMotionPlayState =
  | 'idle'
  | 'queued'
  | 'running'
  | 'paused'
  | 'finished'

interface NoRuntimeMotionConfig {
  duration: number
  tracks: Array<unknown>
  autoStart?: boolean
  loop?: boolean | { reverse?: boolean }
  playbackRate?: number
  delay?: number
  onStart?: () => void
  onComplete?: (values: Record<string, unknown>) => void
  onStop?: (values: Record<string, unknown>) => void
  onReset?: (values: Record<string, unknown>) => void
  onError?: (error: unknown) => void
}

let motionControllerId = 0

// Keep the no-runtime bundle self-contained: exports exist for build/runtime
// compatibility, but motion playback is intentionally a no-op on plain web.
export function normalizeMotionConfig(config: any): NoRuntimeMotionConfig {
  if (config && Array.isArray(config.tracks)) {
    return {
      duration: Number.isFinite(config.duration) ? config.duration : 0,
      tracks: config.tracks,
      autoStart: config.autoStart,
      loop: config.loop,
      playbackRate: config.playbackRate,
      delay: config.delay,
      onStart: config.onStart,
      onComplete: config.onComplete,
      onStop: config.onStop,
      onReset: config.onReset,
      onError: config.onError,
    }
  }

  return {
    duration:
      config && Number.isFinite(config.duration) ? Number(config.duration) : 0,
    tracks: [],
    autoStart: config?.autoStart,
    loop: config?.loop,
    playbackRate: config?.playbackRate,
    delay: config?.delay,
    onStart: config?.onStart,
    onComplete: config?.onComplete,
    onStop: config?.onStop,
    onReset: config?.onReset,
    onError: config?.onError,
  }
}

export function evaluateMotionTimeline(
  _config: NoRuntimeMotionConfig,
  _timeSec: number,
) {
  return {}
}

export function validateSpatializedMotionConfig(_config: unknown): void {}

export class SpatializedMotionController {
  readonly id = `__no_runtime_motion_${++motionControllerId}`

  private motionConfig: NoRuntimeMotionConfig
  private state: NoRuntimeMotionPlayState = 'idle'
  private destroyed = false
  private kind: 'spatialized2d' | 'static3d' | 'dynamic3d' | null = null

  constructor(config: any, options?: unknown) {
    void options
    this.motionConfig = normalizeMotionConfig(config)
  }

  get isDestroyed() {
    return this.destroyed
  }

  get targetKind() {
    return this.kind
  }

  get config() {
    return this.motionConfig
  }

  get isAnimating() {
    return false
  }

  get isPaused() {
    return false
  }

  get finished() {
    return this.state === 'finished'
  }

  get playState() {
    return this.state
  }

  updateConfig(config: any): void {
    this.motionConfig = normalizeMotionConfig(config)
  }

  attachElement(
    _element: unknown,
    targetKind?: 'spatialized2d' | 'static3d' | 'dynamic3d',
  ): void {
    this.kind = targetKind ?? this.kind
  }

  play(): void {
    if (this.destroyed) return
    this.state = 'idle'
  }

  pause(_keys?: unknown): void {}

  resume(_keys?: unknown): void {}

  stop(): void {
    if (this.destroyed) return
    this.state = 'idle'
    this.motionConfig.onStop?.({})
  }

  reset(): void {
    if (this.destroyed) return
    this.state = 'idle'
    this.motionConfig.onReset?.({})
  }

  finish(): void {
    if (this.destroyed) return
    this.state = 'finished'
    this.motionConfig.onComplete?.({})
  }

  destroy(): void {
    this.destroyed = true
    this.state = 'idle'
  }

  getSuppressedFields(): Set<string> | null {
    return null
  }

  handleMotionUnbind(): void {}
}

/** Compose position/rotation/scale into a 4x4 transform matrix.
 *  Uses browser-native DOMMatrix — works without the native runtime. */
export function composeSRT(
  position: { x: number; y: number; z: number },
  rotation: { x: number; y: number; z: number },
  scale: { x: number; y: number; z: number },
) {
  let m = new DOMMatrix()
  m = m.translate(position.x, position.y, position.z)
  m = m.rotate(rotation.x, rotation.y, rotation.z)
  m = m.scale(scale.x, scale.y, scale.z)
  return m
}
