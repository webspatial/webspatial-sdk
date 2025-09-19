import { SpatialObject } from '../../SpatialObject'
import { SpatialGeometryOptions, SpatialGeometryType } from '../../types/types'

export class SpatialGeometry extends SpatialObject {
  static type: SpatialGeometryType
  constructor(
    public id: string,
    public options: SpatialGeometryOptions,
  ) {
    super(id)
  }
}
