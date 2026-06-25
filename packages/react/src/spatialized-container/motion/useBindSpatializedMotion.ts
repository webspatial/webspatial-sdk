import type {
  Spatialized2DElement,
  SpatializedDynamic3DElement,
  SpatializedMotionKind,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
import { useEffect } from 'react'
import type { SpatializedMotionBindingInternal } from './motionBindingTypes'

/**
 * Options for binding a resolved runtime element to a spatialized motion
 * binding.
 */
interface UseBindSpatializedMotionOptions {
  /** The opaque motion binding returned by `useAnimation()`. */
  binding?: SpatializedMotionBindingInternal

  /** The resolved runtime element that should be attached to the binding. */
  element?:
    | HTMLElement
    | Spatialized2DElement
    | SpatializedStatic3DElement
    | SpatializedDynamic3DElement
    | null

  /** The resolved motion target kind for the attached element. */
  kind: SpatializedMotionKind
}

/**
 * Attaches a resolved runtime element to a spatialized motion binding.
 *
 * @param options - Binding lifecycle options.
 */
export function useBindSpatializedMotion({
  binding,
  element,
  kind,
}: UseBindSpatializedMotionOptions): void {
  useEffect(() => {
    if (!binding || !element) return

    binding.__setElement?.(element, kind)

    return () => {
      binding.__onUnbind?.()
    }
  }, [binding, element, kind])
}
