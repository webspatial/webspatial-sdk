import { initScene } from './scene-polyfill'
import { SpatialScene } from './SpatialScene'
import { Spatialized2DElement } from './Spatialized2DElement'
import { createSpatialized2DElement } from './SpatializedElementCreator'
import { createSpatializedStatic3DElement } from './SpatializedElementCreator'
import { SpatializedStatic3DElement } from './SpatializedStatic3DElement'
import { SpatialSceneCreationOptions } from './types/types'

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

  createSpatializedStatic3DElement(
    modelURL: string = '',
  ): Promise<SpatializedStatic3DElement> {
    return createSpatializedStatic3DElement(modelURL)
  }

  initScene = initScene
}
