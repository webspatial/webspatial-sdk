import { SpatialModelEntityCreationOptions } from '../../types/types'
import { SpatialEntity } from './SpatialEntity'

export class SpatialModelEntity extends SpatialEntity {
  constructor(
    public id: string,
    public options?: SpatialModelEntityCreationOptions,
  ) {
    super(id)
  }
}
