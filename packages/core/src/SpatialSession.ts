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
  ModelAssetOptions,
  SpatialBoxGeometryOptions,
  SpatialConeGeometryOptions,
  SpatialCylinderGeometryOptions,
  SpatialGeometryOptions,
  SpatialModelEntityCreationOptions,
  SpatialPlaneGeometryOptions,
  SpatialSceneCreationOptions,
  SpatialSphereGeometryOptions,
  SpatialUnlitMaterialOptions,
  SpatialEntityUserData,
} from './types/types'
import { SpatializedDynamic3DElement } from './SpatializedDynamic3DElement'
import { Attachment, AttachmentOptions, createAttachment } from './Attachment'
import { SpatialEntity } from './reality/entity/SpatialEntity'
import {
  createModelAsset,
  createModelComponent,
  createSpatialEntity,
  createSpatialGeometry,
  createSpatialModelEntity,
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
 * Session used to establish a connection to the spatial renderer of the system.
 * All spatial resources must be created through this session object.
 * This class serves as the main factory for creating spatial elements and geometries.
 */
export class SpatialSession {
  /**
   * Gets the singleton instance of the spatial scene.
   * The spatial scene is the root container for all spatial elements.
   * @returns The SpatialScene singleton instance
   */
  getSpatialScene(): SpatialScene {
    return SpatialScene.getInstance()
  }

  /**
   * Creates a new 2D element that can be spatialized in the 3D environment.
   * 2D elements represent HTML content that can be positioned in 3D space.
   * @returns Promise resolving to a new Spatialized2DElement instance
   */
  createSpatialized2DElement(): Promise<Spatialized2DElement> {
    return createSpatialized2DElement()
  }

  /**
   * Creates a new static 3D element with an optional model URL.
   * Static 3D elements represent pre-built 3D models that can be loaded from a URL.
   * @param modelURL Optional URL to the 3D model to load
   * @returns Promise resolving to a new SpatializedStatic3DElement instance
   */
  createSpatializedStatic3DElement(
    modelURL: string = '',
  ): Promise<SpatializedStatic3DElement> {
    return createSpatializedStatic3DElement(modelURL)
  }

  /**
   * Initializes the spatial scene with custom configuration.
   * This is a reference to the initScene function from scene-polyfill.
   */
  initScene = initScene

  /**
   * Creates a new dynamic 3D element that can be manipulated at runtime.
   * Dynamic 3D elements allow for programmatic creation and modification of 3D content.
   * @returns Promise resolving to a new SpatializedDynamic3DElement instance
   */
  createSpatializedDynamic3DElement(): Promise<SpatializedDynamic3DElement> {
    return createSpatializedDynamic3DElement()
  }

  createAttachment(options: AttachmentOptions): Promise<Attachment> {
    return createAttachment(options)
  }

  /**
   * Creates a new spatial entity with an optional name.
   * Entities are the basic building blocks for creating custom 3D content.
   * @param name Optional name for the entity
   * @returns Promise resolving to a new SpatialEntity instance
   */
  createEntity(userData?: SpatialEntityUserData): Promise<SpatialEntity> {
    return createSpatialEntity(userData)
  }

  /**
   * Creates a box geometry with optional configuration.
   * @param options Configuration options for the box geometry
   * @returns Promise resolving to a new SpatialBoxGeometry instance
   */
  createBoxGeometry(options: SpatialBoxGeometryOptions = {}) {
    return createSpatialGeometry(SpatialBoxGeometry, options)
  }

  /**
   * Creates a plane geometry with optional configuration.
   * @param options Configuration options for the plane geometry
   * @returns Promise resolving to a new SpatialPlaneGeometry instance
   */
  createPlaneGeometry(options: SpatialPlaneGeometryOptions = {}) {
    return createSpatialGeometry(SpatialPlaneGeometry, options)
  }

  /**
   * Creates a sphere geometry with optional configuration.
   * @param options Configuration options for the sphere geometry
   * @returns Promise resolving to a new SpatialSphereGeometry instance
   */
  createSphereGeometry(options: SpatialSphereGeometryOptions = {}) {
    return createSpatialGeometry(SpatialSphereGeometry, options)
  }

  /**
   * Creates a cone geometry with the specified configuration.
   * @param options Configuration options for the cone geometry
   * @returns Promise resolving to a new SpatialConeGeometry instance
   */
  createConeGeometry(options: SpatialConeGeometryOptions) {
    return createSpatialGeometry(SpatialConeGeometry, options)
  }

  /**
   * Creates a cylinder geometry with the specified configuration.
   * @param options Configuration options for the cylinder geometry
   * @returns Promise resolving to a new SpatialCylinderGeometry instance
   */
  createCylinderGeometry(options: SpatialCylinderGeometryOptions) {
    return createSpatialGeometry(SpatialCylinderGeometry, options)
  }

  /**
   * Creates a model component with the specified configuration.
   * Model components are used to add 3D model rendering capabilities to entities.
   * @param options Configuration options for the model component
   * @returns Promise resolving to a new ModelComponent instance
   */
  createModelComponent(options: ModelComponentOptions) {
    return createModelComponent(options)
  }

  /**
   * Creates an unlit material with the specified configuration.
   * Unlit materials don't respond to lighting in the scene.
   * @param options Configuration options for the unlit material
   * @returns Promise resolving to a new SpatialUnlitMaterial instance
   */
  createUnlitMaterial(options: SpatialUnlitMaterialOptions) {
    return createSpatialUnlitMaterial(options)
  }

  /**
   * Creates a model asset with the specified configuration.
   * Model assets represent 3D model resources that can be used by entities.
   * @param options Configuration options for the model asset
   * @returns Promise resolving to a new SpatialModelAsset instance
   */
  createModelAsset(options: ModelAssetOptions) {
    return createModelAsset(options)
  }

  /**
   * Creates a spatial model entity with the specified configuration.
   * This is a convenience method for creating an entity with a model component.
   * @param options Configuration options for the spatial model entity
   * @returns Promise resolving to a new SpatialModelEntity instance
   */
  createSpatialModelEntity(
    options: SpatialModelEntityCreationOptions,
    userData?: SpatialEntityUserData,
  ) {
    return createSpatialModelEntity(options, userData)
  }
}
