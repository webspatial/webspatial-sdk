import { SpatialSession } from './SpatialSession'
import { SpatialWebEvent } from './SpatialWebEvent'

/**
 * Base object designed to be placed on navigator.spatial to mirror navigator.xr for webxr.
 * This is the main entry point for the WebSpatial SDK, providing access to spatial capabilities.
 */
export class Spatial {
  /**
   * Requests a spatial session object from the browser.
   * This is the primary method to initialize spatial functionality.
   * @returns The SpatialSession instance or null if not available in the current browser
   * [TODO] discuss implications of this not being async
   */
  requestSession() {
    if (
      this.isSupported() &&
      this.getNativeVersion() === this.getClientVersion()
    ) {
      SpatialWebEvent.init()
      return new SpatialSession()
    } else {
      return null
    }
  }

  /**
   * Checks if the current page is running in a spatial web environment.
   * This method detects if the application is running in a WebSpatial-compatible browser.
   * @returns True if running in a spatial web environment, false otherwise
   */
  runInSpatialWeb() {
    if (navigator.userAgent.indexOf('WebSpatial/') > 0) {
      return true
    }
    return false
  }

  /**
   * Checks if WebSpatial is supported in the current environment.
   * Verifies compatibility between native and client versions.
   * @returns True if web spatial is supported by this webpage
   */
  isSupported() {
    // todo: enhance judgement
    return this.getNativeVersion() === this.getClientVersion()
  }

  /**
   * Gets the native WebSpatial version from the browser environment.
   * The version format follows semantic versioning (x.x.x).
   * @returns Native version string in format "x.x.x"
   */
  getNativeVersion() {
    if (window.__WebSpatialData && window.__WebSpatialData.getNativeVersion) {
      return window.__WebSpatialData.getNativeVersion()
    }
    return window.WebSpatailNativeVersion === 'PACKAGE_VERSION'
      ? this.getClientVersion()
      : window.WebSpatailNativeVersion
  }

  /**
   * Gets the client SDK version.
   * The version format follows semantic versioning (x.x.x).
   * @returns Client SDK version string in format "x.x.x"
   */
  getClientVersion() {
    // @ts-ignore
    return __WEBSPATIAL_CORE_SDK_VERSION__
  }
}
