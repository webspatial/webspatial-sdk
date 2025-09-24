import {
  AddEntityToDynamic3DCommand,
  SetParentForEntityCommand,
  UpdateSpatializedDynamic3DElementProperties,
} from './JSBCommand'
import { SpatialEntity } from './reality'
import { SpatializedElement } from './SpatializedElement'
import { SpatializedElementProperties } from './types/types'
export class SpatializedDynamic3DElement extends SpatializedElement {
  rootEntity: SpatialEntity
  constructor(id: string) {
    super(id)
    this.rootEntity = new SpatialEntity(id, { name: 'rootEntity' })
  }

  async addEntity(entity: SpatialEntity) {
    const ans = new SetParentForEntityCommand(entity.id, this.id).execute()
    this.rootEntity.children.push(entity)
    entity.parent = this.rootEntity
    return ans
  }
  async updateProperties(properties: Partial<SpatializedElementProperties>) {
    return new UpdateSpatializedDynamic3DElementProperties(
      this,
      properties,
    ).execute()
  }
}
