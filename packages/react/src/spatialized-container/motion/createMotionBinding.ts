import type {
  Spatialized2DElement,
  SpatializedDynamic3DElement,
  SpatializedMotionHandle,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
import type { SpatializedMotionBindingInternal } from './motionBindingTypes'
import type { SpatializedMotionTargetKind } from './targetKind'

export function createMotionBinding(
  controller: SpatializedMotionHandle,
): SpatializedMotionBindingInternal {
  const bindElement = (
    element:
      | Spatialized2DElement
      | SpatializedStatic3DElement
      | SpatializedDynamic3DElement
      | null,
    targetKind?: SpatializedMotionTargetKind,
  ) => {
    controller.attachElement(element, targetKind)
  }

  return {
    __kind: 'spatializedMotion',
    __motionObjectId: controller.id,
    get __animating() {
      return controller.isAnimating
    },
    get __suppressedFields() {
      return controller.getSuppressedFields()
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
