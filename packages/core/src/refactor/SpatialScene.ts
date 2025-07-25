import { BackgroundMaterialType } from './types'
import {
  UpdateSpatialSceneCorner,
  UpdateSpatialSceneMaterialCommand,
} from './JSBCommand'
import { CornerRadius } from '../core'

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
}
