import { BackgroundMaterialType } from './types'
import {
  AddSpatializedElementToSpatialScene,
  UpdateSpatialSceneCorner,
  UpdateSpatialSceneMaterialCommand,
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

  async updateSpatialMaterial(material: BackgroundMaterialType) {
    return new UpdateSpatialSceneMaterialCommand(material).execute()
  }

  async updateSpatialCorner(cornerRadius: CornerRadius) {
    return new UpdateSpatialSceneCorner(cornerRadius).execute()
  }

  async addSpatializedElement(element: SpatializedElement) {
    return new AddSpatializedElementToSpatialScene(element).execute()
  }
}
