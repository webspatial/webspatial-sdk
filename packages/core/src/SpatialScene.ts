import {
  SpatialSceneCreationOptions,
  SpatialSceneProperties,
} from './types/types'
import { SpatialSceneCreationOptionsInternal } from "./types/internal"
import {
  AddSpatializedElementToSpatialScene,
  GetSpatialSceneState,
  UpdateSceneConfig,
  UpdateSpatialSceneProperties,
} from './JSBCommand'

import { SpatializedElement } from './SpatializedElement'
import { SpatialObject } from './SpatialObject'
import { SpatialSceneState } from './types/internal'

let instance: SpatialScene

/**
 * Represents the spatial scene that contains all spatialized elements.
 * This class follows the singleton pattern - only one instance exists per application.
 * The scene manages the overall spatial environment properties and contains all spatial elements.
 */
export class SpatialScene extends SpatialObject {
  /**
   * Gets the singleton instance of the SpatialScene.
   * Creates a new instance if one doesn't exist yet.
   * @returns The singleton SpatialScene instance
   */
  static getInstance(): SpatialScene {
    if (!instance) {
      instance = new SpatialScene('')
    }
    return instance
  }

  /**
   * Updates the properties of the spatial scene.
   * This can include background settings, lighting, and other scene-wide properties.
   * @param properties Partial set of properties to update
   * @returns Promise resolving when the update is complete
   */
  async updateSpatialProperties(properties: Partial<SpatialSceneProperties>) {
    console.log('core SDK updateSpatialProperties: ', properties)
    return new UpdateSpatialSceneProperties(properties).execute()
  }

  /**
   * Adds a spatialized element to the scene.
   * This makes the element visible and interactive in the spatial environment.
   * @param element The SpatializedElement to add to the scene
   * @returns Promise resolving when the element is added
   */
  async addSpatializedElement(element: SpatializedElement) {
    return new AddSpatializedElementToSpatialScene(element).execute()
  }

  /**
   * Updates the scene creation configuration.
   * This allows changing scene parameters after initial creation.
   * @param config The new scene creation configuration
   * @returns Promise resolving when the update is complete
   */
  async updateSceneCreationConfig(config: SpatialSceneCreationOptionsInternal) {
    return new UpdateSceneConfig(config).execute()
  }

  /**
   * Gets the current state of the spatial scene.
   * This includes information about active elements and scene configuration.
   * @returns Promise resolving to the current SpatialSceneState
   */
  async getState(): Promise<SpatialSceneState> {
    return (await new GetSpatialSceneState().execute()).data.name
  }
}