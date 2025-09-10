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
  ModelComponentOptions,
  SpatialBoxGeometryOptions,
  SpatialConeGeometryOptions,
  SpatialCylinderGeometryOptions,
  SpatialGeometryOptions,
  SpatialPlaneGeometryOptions,
  SpatialSceneCreationOptions,
  SpatialSphereGeometryOptions,
  SpatialUnlitMaterialOptions,
} from './types/types'
import { SpatializedDynamic3DElement } from './SpatializedDynamic3DElement'
import { SpatialEntity } from './reality/entity/SpatialEntity'
import {
  createModelComponent,
  createSpatialEntity,
  createSpatialGeometry,
  createSpatialUnlitMaterial,
} from './reality/realityCreator'
import {
  SpatialBoxGeometry,
  SpatialPlaneGeometry,
  SpatialSphereGeometry,
  SpatialConeGeometry,
  SpatialCylinderGeometry,
} from './reality'

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

  createEntity(name?: string): Promise<SpatialEntity> {
    return createSpatialEntity(name)
  }

  createBoxGeometry(options: SpatialBoxGeometryOptions = {}) {
    return createSpatialGeometry(SpatialBoxGeometry, options)
  }

  createPlaneGeometry(options: SpatialPlaneGeometryOptions = {}) {
    return createSpatialGeometry(SpatialPlaneGeometry, options)
  }

  createSphereGeometry(options: SpatialSphereGeometryOptions = {}) {
    return createSpatialGeometry(SpatialSphereGeometry, options)
  }

  createConeGeometry(options: SpatialConeGeometryOptions) {
    return createSpatialGeometry(SpatialConeGeometry, options)
  }

  createCylinderGeometry(options: SpatialCylinderGeometryOptions) {
    return createSpatialGeometry(SpatialCylinderGeometry, options)
  }

  createModelComponent(options: ModelComponentOptions) {
    return createModelComponent(options)
  }

  createUnlitMaterial(options: SpatialUnlitMaterialOptions) {
    return createSpatialUnlitMaterial(options)
  }

  initScene(
    name: string,
    callback: (pre: SpatialSceneCreationOptions) => SpatialSceneCreationOptions,
  ) {
    return initScene(name, callback)
  }
}
