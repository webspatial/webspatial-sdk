import {
  SpatialEntityUserData,
  SpatialModelEntityCreationOptions,
} from '../../types/types'
import { SetMaterialsOnEntityCommand } from '../../JSBCommand'
import { SpatialMaterial } from '../material/SpatialMaterial'
import { SpatialEntity } from './SpatialEntity'

export class SpatialModelEntity extends SpatialEntity {
  constructor(
    public id: string,
    public options?: SpatialModelEntityCreationOptions,
    public userData?: SpatialEntityUserData,
  ) {
    super(id, userData)
  }

  async setMaterials(materials: SpatialMaterial[]) {
    return new SetMaterialsOnEntityCommand(this.id, materials).execute()
  }
}
