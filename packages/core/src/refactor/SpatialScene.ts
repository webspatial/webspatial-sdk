import { BackgroundMaterialType, SpatialSceneProperties } from './types'
import {
  AddSpatializedElementToSpatialScene,
  UpdateSpatialSceneProperties,
} from './JSBCommand'
import { CornerRadius } from '../core'
import { SpatializedElement } from './SpatializedElement'

let instance: SpatialScene

export class SpatialScene {
  static getInstance(): SpatialScene {
    if (!instance) {
      instance = new SpatialScene()
    }
    return instance
  }

  async updateSpatialProperties(properties: Partial<SpatialSceneProperties>) {
    return new UpdateSpatialSceneProperties(properties).execute()
  }

  async addSpatializedElement(element: SpatializedElement) {
    return new AddSpatializedElementToSpatialScene(element).execute()
  }
}
