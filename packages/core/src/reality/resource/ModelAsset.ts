import { SpatialObject } from '../../SpatialObject'
import { ModelAssetOptions } from '../../types/types'

export class ModelAsset extends SpatialObject {
  constructor(
    public id: string,
    public options: ModelAssetOptions,
  ) {
    super(id)
  }
}
