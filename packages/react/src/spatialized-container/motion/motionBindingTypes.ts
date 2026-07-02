import type { SpatializedElement } from '@webspatial/core-sdk'

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
   */
  __setElement: (element: SpatializedElement | null) => void

  /**
   * Performs owner-aware unbind cleanup without forcing an extra
   * `__setElement(null)` call.
   *
   * @param element - The runtime element owned by the cleanup effect.
   */
  __onUnbind?: (element: SpatializedElement) => void
}
