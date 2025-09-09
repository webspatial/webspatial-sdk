import { initScene } from './scene-polyfill'
import { SpatialScene } from './SpatialScene'
import { Spatialized2DElement } from './Spatialized2DElement'
import {
  createSpatialized2DElement,
  createSpatializedDynamic3DElement,
} from './SpatializedElementCreator'
import { createSpatializedStatic3DElement } from './SpatializedElementCreator'
import { SpatializedStatic3DElement } from './SpatializedStatic3DElement'
import {
  SpatialGeometryCreationOptions,
  SpatialSceneCreationOptions,
} from './types/types'
import { SpatializedDynamic3DElement } from './SpatializedDynamic3DElement'
import { SpatialEntity } from './reality/SpatialEntity'
import { SpatialGeometry } from './reality/SpatialGeometry'
import {
  createSpatialEntity,
  createSpatialGeometry,
} from './reality/realityCreator'

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

  createSpatializedDynamic3DElement(): Promise<SpatializedDynamic3DElement> {
    return createSpatializedDynamic3DElement()
  }

  createSpatialEntity(name?: string): Promise<SpatialEntity> {
    return createSpatialEntity(name)
  }
  createSpatialGeometry(
    options: SpatialGeometryCreationOptions = {},
  ): Promise<SpatialGeometry> {
    return createSpatialGeometry(options)
  }

  initScene(
    name: string,
    callback: (pre: SpatialSceneCreationOptions) => SpatialSceneCreationOptions,
  ) {
    return initScene(name, callback)
  }
}
