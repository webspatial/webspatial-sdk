import type { CommandResult } from '../../platform-adapter/interface'
import { SpatialObject } from '../../SpatialObject'
import type {
  SpatialMaterialType,
  SpatialPBRMaterialOptions,
  SpatialUnlitMaterialOptions,
} from '../../types/types'

export abstract class SpatialMaterial extends SpatialObject {
  constructor(
    public id: string,
    public type: SpatialMaterialType,
  ) {
    super(id)
    this.type = type
  }

  abstract updateProperties(
    properties: Partial<
      SpatialUnlitMaterialOptions & SpatialPBRMaterialOptions
    >,
  ): Promise<CommandResult>
}
