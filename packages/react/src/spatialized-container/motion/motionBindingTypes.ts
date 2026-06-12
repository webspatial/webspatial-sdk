import type {
  Spatialized2DElement,
  SpatializedDynamic3DElement,
  SpatializedMotionKind,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'

/** Internal binding surface for Portal (2D `xr-animation`). */
export interface SpatializedMotionBindingInternal {
  readonly __kind: 'spatializedMotion'
  readonly __propName: 'xr-animation'
  readonly __motionObjectId: string
  get __animating(): boolean
  __getSuppressedFields(): Set<string> | null
  __setElement?: (
    element:
      | HTMLElement
      | Spatialized2DElement
      | SpatializedStatic3DElement
      | SpatializedDynamic3DElement
      | null,
    targetKind?: SpatializedMotionKind,
  ) => void
  __onUnbind?: () => void
}
