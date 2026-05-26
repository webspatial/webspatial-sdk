import type { Spatialized2DElement } from '../../Spatialized2DElement'
import type { SpatialDivMotionConfig } from '../../types/spatialDivMotion'
import {
  SpatializedMotionController,
  type SpatializedMotionControllerOptions,
} from '../../spatialized/motion/SpatializedMotionController'

export type SpatialDivMotionControllerOptions = Omit<
  SpatializedMotionControllerOptions,
  'element'
> & {
  element?: Spatialized2DElement | null
}

/** @deprecated Alias of {@link SpatializedMotionController} for SpatialDiv (2D). */
export class SpatialDivMotionController extends SpatializedMotionController {
  constructor(
    config: SpatialDivMotionConfig,
    options: SpatialDivMotionControllerOptions = {},
  ) {
    super(config, 'spatialized2d', options)
  }

  override attachElement(element: Spatialized2DElement | null): void {
    super.attachElement(element)
  }
}
