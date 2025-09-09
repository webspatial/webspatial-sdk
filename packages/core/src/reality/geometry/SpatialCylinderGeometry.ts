import {
  SpatialGeometryType,
  SpatialCylinderGeometryOptions,
} from '../../types/types'
import { SpatialGeometry } from './SpatialGeometry'

export class SpatialCylinderGeometry extends SpatialGeometry {
  static type: SpatialGeometryType = 'plane'
  constructor(
    public id: string,
    public options: SpatialCylinderGeometryOptions,
  ) {
    super(id, options)
  }
}
