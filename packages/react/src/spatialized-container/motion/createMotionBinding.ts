import type {
  Spatialized2DElement,
  SpatializedDynamic3DElement,
  SpatializedMotionHandle,
  SpatializedMotionKind,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
import type { Dynamic3DMotionBindingInternal } from './dynamic3dMotionBindingTypes'
import type { SpatializedMotionBindingInternal } from './motionBindingTypes'
import type { Static3DMotionBindingInternal } from './static3dMotionBindingTypes'

export function createMotionBinding(
  kind: SpatializedMotionKind,
  controller: SpatializedMotionHandle,
  nativeCapable: boolean,
):
  | SpatializedMotionBindingInternal
  | Static3DMotionBindingInternal
  | Dynamic3DMotionBindingInternal
  | undefined {
  if (!nativeCapable) return undefined

  const base = {
    __motionObjectId: controller.id,
    get __animating() {
      return controller.nativeSessionAnimating
    },
    get __suppressedFields() {
      return controller.getSuppressedFields()
    },
    __getSuppressedFields() {
      return controller.getSuppressedFields()
    },
    __onUnbind: () => {
      controller.handleMotionUnbind()
    },
  }

  switch (kind) {
    case 'spatialized2d':
      return {
        ...base,
        __kind: 'spatializedMotion' as const,
        __setElement: (element: Spatialized2DElement | null) => {
          controller.attachElement(element)
        },
      }
    case 'static3d':
      return {
        ...base,
        __kind: 'static3dMotion' as const,
        __setElement: (element: SpatializedStatic3DElement) => {
          controller.attachElement(element)
        },
      }
    case 'dynamic3d':
      return {
        ...base,
        __kind: 'dynamic3dMotion' as const,
        __setElement: (element: SpatializedDynamic3DElement) => {
          controller.attachElement(element)
        },
      }
  }
}
