import { UpdateSpatialized2DElementMaterial } from './JSBCommand'
import { SpatializedElement } from './SpatializedElement'
import { BackgroundMaterialType, CornerRadius } from './types'

export class Spatialized2DElement extends SpatializedElement {
  constructor(
    id: string,
    readonly windowProxy: WindowProxy,
  ) {
    super(id)
  }

  async updateSpatialMaterial(material: BackgroundMaterialType) {
    return new UpdateSpatialized2DElementMaterial(this, material).execute()
  }
}
