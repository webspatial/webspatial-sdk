import { SpatialObject } from '../SpatialObject'
import { SpatialGeometryCreationOptions } from '../types/types'

export class SpatialGeometry extends SpatialObject {
  constructor(
    public id: string,
    public options: SpatialGeometryCreationOptions,
  ) {
    super(id)
  }
}
