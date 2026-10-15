import type { CommandResult } from '../../platform-adapter/interface'
import { SpatialObject } from '../../SpatialObject'
import type { SpatialMaterialType } from '../../types/types'

/**
 * Native material handle. `O` is the create/update property bag for that
 * material kind (unlit, PBR, and any later type). Collections can use the
 * default `SpatialMaterial` (i.e. `SpatialMaterial<object>`).
 */
export abstract class SpatialMaterial<
  O extends object = object,
> extends SpatialObject {
  constructor(
    public id: string,
    public type: SpatialMaterialType,
  ) {
    super(id)
    this.type = type
  }

  abstract updateProperties(properties: O): Promise<CommandResult>
}
