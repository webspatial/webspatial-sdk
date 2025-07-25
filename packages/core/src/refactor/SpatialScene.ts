import { BackgroundMaterialType } from './types'
import { UpdateSpatialSceneMaterialCommand } from './JSBCommand'

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
}
