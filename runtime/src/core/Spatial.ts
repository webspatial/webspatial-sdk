import { SpatialSession } from './SpatialSession'

/**
 * Base object designed to be placed on navigator.spatial to mirror navigator.xr for webxr
 */
export class Spatial {
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

  isSupported() {
    return (window as any).WebSpatailEnabled
  }

  getNativeVersion() {
    return (window as any).WebSpatailNativeVersion
  }

  getClientVersion() {
    return '0.0.1'
  }
}
