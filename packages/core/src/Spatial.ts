import { SpatialSession } from './SpatialSession'
import { SpatialWebEvent } from './SpatialWebEvent'

/**
 * Base object designed to be placed on navigator.spatial to mirror navigator.xr for webxr.
 * This is the main entry point for the WebSpatial SDK, providing access to spatial capabilities.
 */
export class Spatial {
  private wsAppShellVersionFromUA: string | null | undefined

  /**
   * Requests a spatial session object from the browser.
   * This is the primary method to initialize spatial functionality.
   * @returns The SpatialSession instance or null if not available in the current browser
   * [TODO] discuss implications of this not being async
   */
  requestSession() {
    if (this.runInSpatialWeb()) {
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
    if (navigator.userAgent.indexOf('WebSpatial/') >= 0) {
      return true
    }
    return false
  }

  getShellVersionFromUA(): string | null {
    if (this.wsAppShellVersionFromUA !== undefined) {
      return this.wsAppShellVersionFromUA
    }
    if (
      typeof navigator === 'undefined' ||
      typeof navigator.userAgent !== 'string'
    ) {
      this.wsAppShellVersionFromUA = null
      return null
    }

    const match = navigator.userAgent.match(
      /WSAppShell\/(\d+(?:\.\d+){2}(?:[-+][0-9A-Za-z.-]+)*)/,
    )
    this.wsAppShellVersionFromUA = match ? match[1] : '1.3.0'
    return this.wsAppShellVersionFromUA
  }

  /** @deprecated
   * Checks if WebSpatial is supported in the current environment.
   * Verifies compatibility between native and client versions.
   * @returns True if web spatial is supported by this webpage
   */
  isSupported() {
    return true
  }

  /** @deprecated
   * Gets the native WebSpatial version from the browser environment.
   * The version format follows semantic versioning (x.x.x).
   * @returns Native version string in format "x.x.x"
   */
  getNativeVersion() {
    if (window.__WebSpatialData && window.__WebSpatialData.getNativeVersion) {
      return window.__WebSpatialData.getNativeVersion()
    }
    return window.WebSpatailNativeVersion === 'WS_SHELL_VERSION'
      ? this.getClientVersion()
      : window.WebSpatailNativeVersion
  }

  /** @deprecated
   * Gets the client SDK version.
   * The version format follows semantic versioning (x.x.x).
   * @returns Client SDK version string in format "x.x.x"
   */
  getClientVersion() {
    // @ts-ignore
    return __WEBSPATIAL_CORE_SDK_VERSION__
  }
}
