import type {
  SpatializedElement,
  SpatializedMotionKind,
} from '@webspatial/core-sdk'

/**
 * Internal binding contract shared between React container wiring and the Core
 * motion controller for `xr-animation`.
 */
export interface SpatializedMotionBinding {
  /** Identifies the binding family for runtime guards. */
  readonly __kind: 'spatializedMotion'

  /**
   * Attaches or detaches the resolved runtime element from the binding.
   *
   * @param element - The resolved runtime element or `null` when detaching.
   * @param targetKind - The resolved motion target kind, if available.
   */
  __setElement: (
    element: SpatializedElement | null,
    targetKind?: SpatializedMotionKind,
  ) => void

  /** Performs unbind cleanup without forcing an extra `__setElement(null)` call. */
  __onUnbind?: () => void
}
