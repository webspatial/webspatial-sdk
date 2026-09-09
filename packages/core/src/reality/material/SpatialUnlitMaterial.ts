import { UpdateUnlitMaterialProperties } from '../../JSBCommand'
import { SpatialUnlitMaterialOptions } from '../../types/types'
import {
  SpatialMaterial,
  type SpatialMaterialUpdateOptions,
} from './SpatialMaterial'

export class SpatialUnlitMaterial extends SpatialMaterial {
  constructor(
    public id: string,
    public options: SpatialUnlitMaterialOptions,
  ) {
    super(id, 'unlit')
  }

  updateProperties(properties: SpatialMaterialUpdateOptions) {
    return new UpdateUnlitMaterialProperties(this, properties).execute()
  }
}
