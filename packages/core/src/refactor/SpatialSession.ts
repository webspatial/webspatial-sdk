import { SpatialScene } from './SpatialScene'

/**
 * Session use to establish a connection to the spatial renderer of the system. All resources must be created by the session
 */
export class SpatialSession {
  getSpatialScene(): SpatialScene {
    return SpatialScene.getInstance()
  }
}
