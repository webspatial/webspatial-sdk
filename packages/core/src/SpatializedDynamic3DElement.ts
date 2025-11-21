import {
  AddEntityToDynamic3DCommand,
  SetParentForEntityCommand,
  UpdateSpatializedDynamic3DElementProperties,
} from './JSBCommand'
import { SpatialEntity } from './reality'
import { SpatializedElement } from './SpatializedElement'
import {
  SpatialEntityOrReality,
  SpatializedElementProperties,
} from './types/types'
export class SpatializedDynamic3DElement extends SpatializedElement {
  children: SpatialEntityOrReality[] = []
  constructor(id: string) {
    super(id)
  }

  async addEntity(entity: SpatialEntity) {
    const ans = new SetParentForEntityCommand(entity.id, this.id).execute()
    this.children.push(entity)
    entity.parent = this
    return ans
  }
  async updateProperties(properties: Partial<SpatializedElementProperties>) {
    return new UpdateSpatializedDynamic3DElementProperties(
      this,
      properties,
    ).execute()
  }
}
