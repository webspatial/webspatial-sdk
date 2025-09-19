import { SpatialObject } from '../../SpatialObject'
import { ModelAssetOptions } from '../../types/types'

export class SpatialModelAsset extends SpatialObject {
  constructor(
    public id: string,
    public options: ModelAssetOptions,
  ) {
    super(id)
  }
}
