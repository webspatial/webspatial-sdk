import { UpdateSpatializedStatic3DElementProperties } from './JSBCommand'
import { SpatializedElement } from './SpatializedElement'
import { SpatializedStatic3DElementProperties } from './types'

export class SpatializedStatic3DElement extends SpatializedElement {
  async updateProperties(
    properties: Partial<SpatializedStatic3DElementProperties>,
  ) {
    return new UpdateSpatializedStatic3DElementProperties(
      this,
      properties,
    ).execute()
  }
}
