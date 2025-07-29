import {
  UpdateSpatializedElementProperties,
  UpdateSpatializedElementTransform,
} from './JSBCommand'
import { SpatialObject } from './SpatialObject'
import { SpatializedElementProperties, SpatialTransform } from './types'

export class SpatializedElement extends SpatialObject {
  async updateProperties(properties: Partial<SpatializedElementProperties>) {
    return new UpdateSpatializedElementProperties(this, properties).execute()
  }

  async updateTransform(transform: Partial<SpatialTransform>) {
    return new UpdateSpatializedElementTransform(this, transform).execute()
  }
}
