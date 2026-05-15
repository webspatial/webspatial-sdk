import { SpatialObject } from '../../SpatialObject'
import { SpatialTextureResourceOptions } from '../../types/types'
import { UpdateTexturePropertiesCommand } from '../../JSBCommand'

export class SpatialTextureResource extends SpatialObject {
  constructor(
    public id: string,
    public options: SpatialTextureResourceOptions,
  ) {
    super(id)
  }

  updateProperties(properties: Partial<SpatialTextureResourceOptions>) {
    return new UpdateTexturePropertiesCommand(this, properties).execute()
  }
}
