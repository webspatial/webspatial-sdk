import { UpdateUnlitMaterialProperties } from '../../JSBCommand'
import { SpatialUnlitMaterialOptions } from '../../types/types'
import { SpatialMaterial } from './SpatialMaterial'

export class SpatialUnlitMaterial extends SpatialMaterial<SpatialUnlitMaterialOptions> {
  constructor(
    public id: string,
    public options: SpatialUnlitMaterialOptions,
  ) {
    super(id, 'unlit')
  }

  updateProperties(properties: SpatialUnlitMaterialOptions) {
    return new UpdateUnlitMaterialProperties(this, properties).execute()
  }
}
