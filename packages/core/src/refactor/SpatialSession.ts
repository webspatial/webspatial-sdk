import { SpatialScene } from './SpatialScene'
import { Spatialized2DElement } from './Spatialized2DElement'
import { createSpatialized2DElement } from './SpatializedElementCreator'
import { ping } from './internal-debug'

/**
 * Session use to establish a connection to the spatial renderer of the system. All resources must be created by the session
 */
export class SpatialSession {
  getSpatialScene(): SpatialScene {
    return SpatialScene.getInstance()
  }

  createSpatialized2DElement(): Promise<Spatialized2DElement> {
    return createSpatialized2DElement()
  }

  ping(): Promise<any> {
    return ping()
  }
}
