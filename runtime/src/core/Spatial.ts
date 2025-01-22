import { SpatialSession } from './SpatialSession'

/**
 * Base object designed to be placed on navigator.spatial to mirror navigator.xr for webxr
 */
export class Spatial {
  /**
   * Requests a session object from the browser
   * @returns The session or null if not availible in the current browser
   * [TODO] discuss implications of this not being async
   */
  requestSession() {
    if (
      this.isSupported() &&
      this.getNativeVersion() === this.getClientVersion()
    ) {
      return new SpatialSession()
    } else {
      return null
    }
  }

  /**
   * @returns true if web spatial is supported by this webpage
   */
  isSupported() {
    return (
      (window as any).WebSpatailEnabled &&
      this.getNativeVersion() === this.getClientVersion()
    )
  }

  /**
   * Gets the native version, format is "x.x.x"
   * @returns native version string
   */
  getNativeVersion() {
    return (window as any).WebSpatailNativeVersion
  }

  /**
   * Gets the client version, format is "x.x.x"
   * @returns client version string
   */
  getClientVersion() {
    return '0.0.1'
  }
}
