// Redirect to empty module for treeshaking
export default {}

export const SpatialHelper = {}

export class Spatial {
  /**
   * Requests a session object from the browser
   * @returns The session or null if not availible in the current browser
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
   * @returns native version string
   */
  getNativeVersion() {
    return null
  }
  /**
   * Gets the client version, format is "x.x.x"
   * @returns client version string
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
  point2physical: () => 0,
  physical2point: () => 0,
}
