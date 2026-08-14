import { SpatialObject } from '../../SpatialObject'
import { ModelAssetOptions, ModelAnimationClipData } from '../../types/types'

export class SpatialModelAsset extends SpatialObject {
  /**
   * Animation clips embedded in the loaded model, as reported by the native
   * runtime. Empty when the asset has no animations or the runtime predates
   * clip discovery.
   */
  readonly animations: readonly ModelAnimationClipData[]

  constructor(
    public id: string,
    public options: ModelAssetOptions,
    animations: ModelAnimationClipData[] = [],
  ) {
    super(id)
    this.animations = animations
  }
}
