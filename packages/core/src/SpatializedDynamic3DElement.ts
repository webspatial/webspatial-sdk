import { AddEntityToDynamic3DCommand, UpdateSpatializedDynamic3DElementProperties } from './JSBCommand'
import { SpatialEntity } from './reality'
import { SpatializedElement } from './SpatializedElement'
import { Spatialized2DElementProperties } from './types/types'
export class SpatializedDynamic3DElement extends SpatializedElement {

  async addEntity(entity: SpatialEntity) {
    return new AddEntityToDynamic3DCommand(this, entity).execute()
  }
  async updateProperties(properties: Partial<Spatialized2DElementProperties>) {
    return new UpdateSpatializedDynamic3DElementProperties(
      this,
      properties,
    ).execute()
  }
}
