import {
  AddSpatializedElementToSpatialized2DElement,
  UpdateSpatialized2DElementCorner,
  UpdateSpatialized2DElementMaterial,
} from './JSBCommand'
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

  async updateSpatialCorner(cornerRadius: CornerRadius) {
    return new UpdateSpatialized2DElementCorner(this, cornerRadius).execute()
  }

  async addSpatializedElement(element: SpatializedElement) {
    return new AddSpatializedElementToSpatialized2DElement(
      this,
      element,
    ).execute()
  }
}
