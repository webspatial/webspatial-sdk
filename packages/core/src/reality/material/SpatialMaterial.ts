import type { CommandResult } from '../../platform-adapter/interface'
import { SpatialObject } from '../../SpatialObject'
import type {
  SpatialMaterialType,
  SpatialPBRMaterialOptions,
} from '../../types/types'

/** Property bag for material updates. PBR is a superset of unlit; every field is optional. */
export type SpatialMaterialUpdateOptions = SpatialPBRMaterialOptions

export abstract class SpatialMaterial extends SpatialObject {
  constructor(
    public id: string,
    public type: SpatialMaterialType,
  ) {
    super(id)
    this.type = type
  }

  abstract updateProperties(
    properties: SpatialMaterialUpdateOptions,
  ): Promise<CommandResult>
}
