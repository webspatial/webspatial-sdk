import { SpatialObject } from '../../SpatialObject'
import { SpatialMaterialType } from '../../types/types'

export abstract class SpatialMaterial extends SpatialObject {
  constructor(
    public id: string,
    public type: SpatialMaterialType,
  ) {
    super(id)
    this.type = type
  }

  abstract updateProperties(properties: any): void
}
