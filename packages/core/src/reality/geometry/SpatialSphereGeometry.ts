import {
  SpatialGeometryType,
  SpatialSphereGeometryOptions,
} from '../../types/types'
import { SpatialGeometry } from './SpatialGeometry'

export class SpatialSphereGeometry extends SpatialGeometry {
  static type: SpatialGeometryType = 'SphereGeometry'
  constructor(
    public id: string,
    public options: SpatialSphereGeometryOptions,
  ) {
    super(id, options)
  }
}
