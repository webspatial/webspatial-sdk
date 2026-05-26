import type { SpatializedDynamic3DElement } from '../../SpatializedDynamic3DElement'
import type { SpatialDivMotionConfig } from '../../types/spatialDivMotion'
import {
  SpatializedMotionController,
  type SpatializedMotionControllerOptions,
} from '../../spatialized/motion/SpatializedMotionController'

export type Dynamic3DMotionControllerOptions = Omit<
  SpatializedMotionControllerOptions,
  'element'
> & {
  element?: SpatializedDynamic3DElement | null
}

/** @deprecated Alias of {@link SpatializedMotionController} for Dynamic3D Reality. */
export class Dynamic3DMotionController extends SpatializedMotionController {
  constructor(
    config: SpatialDivMotionConfig,
    options: Dynamic3DMotionControllerOptions = {},
  ) {
    super(config, 'dynamic3d', options)
  }

  override attachElement(element: SpatializedDynamic3DElement | null): void {
    super.attachElement(element)
  }
}
