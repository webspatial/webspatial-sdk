import { SpatialSession } from './SpatialSession'

/**
 * Base object designed to be placed on navigator.spatial to mirror navigator.xr for webxr
 */
export class Spatial {
  requestSession() {
    return new SpatialSession()
  }

  isSupported() {
    return (window as any).WebSpatailEnabled
  }
}
