import { UpdateUnlitMaterialProperties } from '../../JSBCommand'
import { SpatialUnlitMaterialCreationOptions } from '../../types/types'
import { SpatialMaterial } from './SpatialMaterial'

export class SpatialUnlitMaterial extends SpatialMaterial {
  constructor(
    public id: string,
    public options: SpatialUnlitMaterialCreationOptions,
  ) {
    super(id, 'unlit')
  }

  updateProperties(properties: Partial<SpatialUnlitMaterialCreationOptions>) {
    return new UpdateUnlitMaterialProperties(this, properties).execute()
  }
}
