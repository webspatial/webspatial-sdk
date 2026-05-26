import type { SpatializedStatic3DElement } from '../../SpatializedStatic3DElement'
import type { SpatialDivMotionConfig } from '../../types/spatialDivMotion'
import {
  SpatializedMotionController,
  type SpatializedMotionControllerOptions,
} from '../../spatialized/motion/SpatializedMotionController'

export type Static3DMotionControllerOptions = Omit<
  SpatializedMotionControllerOptions,
  'element'
> & {
  element?: SpatializedStatic3DElement | null
}

/** @deprecated Alias of {@link SpatializedMotionController} for Static3D Model. */
export class Static3DMotionController extends SpatializedMotionController {
  constructor(
    config: SpatialDivMotionConfig,
    options: Static3DMotionControllerOptions = {},
  ) {
    super(config, 'static3d', options)
  }

  override attachElement(element: SpatializedStatic3DElement | null): void {
    super.attachElement(element)
  }
}
