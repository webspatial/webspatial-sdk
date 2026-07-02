import type { SpatializedElement } from '@webspatial/core-sdk'
import { useEffect } from 'react'
import type { SpatializedMotionBinding } from './motionBindingTypes'

/**
 * Options for binding a resolved runtime element to a spatialized motion
 * binding.
 */
interface UseBindSpatializedMotionOptions {
  /** The opaque motion binding returned by `useAnimation()`. */
  binding?: SpatializedMotionBinding

  /** The resolved runtime element that should be attached to the binding. */
  element?: SpatializedElement | null
}

/**
 * Checks whether the resolved spatialized element can host motion.
 *
 * @param element - The resolved runtime element candidate.
 * @returns Whether the element is a supported motion target.
 */
function isSupportedSpatializedMotionElement(
  element: SpatializedElement,
): boolean {
  switch (element.kind) {
    case 'spatialized2d':
    case 'static3d':
    case 'dynamic3d':
      return true
    default:
      return false
  }
}

/**
 * Attaches a resolved runtime element to a spatialized motion binding.
 *
 * @param options - Binding lifecycle options.
 */
export function useBindSpatializedMotion({
  binding,
  element,
}: UseBindSpatializedMotionOptions): void {
  useEffect(() => {
    if (!binding || !element) return
    if (!isSupportedSpatializedMotionElement(element)) return

    binding.__setElement?.(element)

    return () => {
      binding.__onUnbind?.(element)
    }
  }, [binding, element])
}
