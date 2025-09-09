import {
  SpatialGeometryType,
  SpatialPlaneGeometryOptions,
} from '../../types/types'
import { SpatialGeometry } from './SpatialGeometry'

export class SpatialPlaneGeometry extends SpatialGeometry {
  static type: SpatialGeometryType = 'plane'
  constructor(
    public id: string,
    public options: SpatialPlaneGeometryOptions,
  ) {
    super(id, options)
  }
}
