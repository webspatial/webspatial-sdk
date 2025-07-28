import { UpdateSpatializedElementProperties } from './JSBCommand'
import { SpatialObject } from './SpatialObject'
import { SpatializedElementProperties } from './types'

export class SpatializedElement extends SpatialObject {
  async updateProperties(properties: SpatializedElementProperties) {
    return new UpdateSpatializedElementProperties(this, properties).execute()
  }
}
