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

/** Minimal `Vec3Like` shape for the web no-runtime bundle. */
export type Vec3Like = Vec3 | [number, number, number]

/** Normalize a Vec3Like ({x,y,z} or [x,y,z]) to a tuple — pure, no runtime needed. */
export function toVec3Tuple(
  v?: Vec3Like,
): [number, number, number] | undefined {
  if (v === undefined) return undefined
  if (Array.isArray(v)) return [v[0], v[1], v[2]]
  return [v.x, v.y, v.z]
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
