import {
  SpatialSceneCreationOptions,
  SpatialSceneProperties,
  SpatialSceneState,
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

let instance: SpatialScene

export class SpatialScene extends SpatialObject {
  static getInstance(): SpatialScene {
    if (!instance) {
      instance = new SpatialScene('')
    }
    return instance
  }

  async updateSpatialProperties(properties: Partial<SpatialSceneProperties>) {
    return new UpdateSpatialSceneProperties(properties).execute()
  }

  async addSpatializedElement(element: SpatializedElement) {
    return new AddSpatializedElementToSpatialScene(element).execute()
  }

  async updateSceneCreationConfig(config: SpatialSceneCreationOptionsInternal) {
    return new UpdateSceneConfig(config).execute()
  }

  async getState(): Promise<SpatialSceneState> {
    return (await new GetSpatialSceneState().execute()).data.name
  }
}
