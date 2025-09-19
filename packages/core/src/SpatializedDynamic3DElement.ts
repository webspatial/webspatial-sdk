import {
  AddEntityToDynamic3DCommand,
  SetParentForEntityCommand,
  UpdateSpatializedDynamic3DElementProperties,
} from './JSBCommand'
import { SpatialEntity } from './reality'
import { SpatializedElement } from './SpatializedElement'
import { SpatializedElementProperties } from './types/types'
export class SpatializedDynamic3DElement extends SpatializedElement {
  async addEntity(entity: SpatialEntity) {
    return new SetParentForEntityCommand(entity.id, this.id).execute()
  }
  async updateProperties(properties: Partial<SpatializedElementProperties>) {
    return new UpdateSpatializedDynamic3DElementProperties(
      this,
      properties,
    ).execute()
  }
}
