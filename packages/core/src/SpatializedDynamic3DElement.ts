import { UpdateSpatializedDynamic3DElementProperties } from './JSBCommand'
import { SpatializedElement } from './SpatializedElement'
import { Spatialized2DElementProperties } from './types/types'
export class SpatializedDynamic3DElement extends SpatializedElement {
  async updateProperties(properties: Partial<Spatialized2DElementProperties>) {
    return new UpdateSpatializedDynamic3DElementProperties(
      this,
      properties,
    ).execute()
  }
}
