import { UpdatePBRMaterialProperties } from '../../JSBCommand'
import { SpatialPBRMaterialOptions } from '../../types/types'
import { SpatialMaterial } from './SpatialMaterial'

export class SpatialPBRMaterial extends SpatialMaterial {
  constructor(
    public id: string,
    public options: SpatialPBRMaterialOptions,
  ) {
    super(id, 'pbr')
  }

  updateProperties(properties: Partial<SpatialPBRMaterialOptions>) {
    return new UpdatePBRMaterialProperties(this, properties).execute()
  }
}
