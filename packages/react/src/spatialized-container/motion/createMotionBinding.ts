import type {
  Spatialized2DElement,
  SpatializedDynamic3DElement,
  SpatializedMotionController,
  SpatializedMotionKind,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
import type { SpatializedMotionBindingInternal } from './motionBindingTypes'

export function createMotionBinding(
  controller: SpatializedMotionController,
): SpatializedMotionBindingInternal {
  const bindElement = (
    element:
      | HTMLElement
      | Spatialized2DElement
      | SpatializedStatic3DElement
      | SpatializedDynamic3DElement
      | null,
    targetKind?: SpatializedMotionKind,
  ) => {
    controller.attachElement(
      element as Parameters<SpatializedMotionController['attachElement']>[0],
      targetKind,
    )
  }

  return {
    __kind: 'spatializedMotion',
    __propName: 'xr-animation',
    __motionObjectId: controller.id,
    get __animating() {
      return controller.isAnimating
    },
    __getSuppressedFields() {
      return controller.getSuppressedFields()
    },
    __setElement: bindElement,
    __onUnbind: () => {
      controller.handleMotionUnbind()
    },
  }
}
