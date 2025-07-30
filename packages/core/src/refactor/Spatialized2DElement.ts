import {
  AddSpatializedElementToSpatialized2DElement,
  UpdateSpatialized2DElementCorner,
  UpdateSpatialized2DElementMaterial,
  UpdateSpatialized2DElementProperties,
} from './JSBCommand'
import { SpatializedElement } from './SpatializedElement'
import {
  BackgroundMaterialType,
  CornerRadius,
  Spatialized2DElementProperties,
} from './types'

export class Spatialized2DElement extends SpatializedElement {
  constructor(
    id: string,
    readonly windowProxy: WindowProxy,
  ) {
    super(id)
  }

  async updateProperties(properties: Partial<Spatialized2DElementProperties>) {
    return new UpdateSpatialized2DElementProperties(this, properties).execute()
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
