import { SpatialSceneProperties } from './types'
import {
  AddSpatializedElementToSpatialScene,
  UpdateSceneConfig,
  UpdateSpatialSceneProperties,
} from './JSBCommand'

import { SpatializedElement } from './SpatializedElement'
import { SpatialObject } from './SpatialObject'

export interface SpatialSceneOptions {
  defaultSize?: {
    width: number // Initial width of the window
    height: number // Initial height of the window
  }

  resizability?: {
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
  }
}

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

  async updateSceneConfig(config: SpatialSceneOptions) {
    return new UpdateSceneConfig(config).execute()
  }
}
