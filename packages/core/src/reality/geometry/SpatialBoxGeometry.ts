import { SpatialBoxGeometryOptions, SpatialGeometryType } from '../../types/types'
import { SpatialGeometry } from './SpatialGeometry'

export class SpatialBoxGeometry extends SpatialGeometry {
  static type: SpatialGeometryType = 'box'
  constructor(
    public id: string,
    public options: SpatialBoxGeometryOptions,
  ) {
    super(id, options)
  }
}
