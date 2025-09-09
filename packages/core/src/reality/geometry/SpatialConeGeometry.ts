import {
  SpatialGeometryType,
  SpatialConeGeometryOptions,
} from '../../types/types'
import { SpatialGeometry } from './SpatialGeometry'

export class SpatialConeGeometry extends SpatialGeometry {
  static type: SpatialGeometryType = 'plane'
  constructor(
    public id: string,
    public options: SpatialConeGeometryOptions,
  ) {
    super(id, options)
  }
}
