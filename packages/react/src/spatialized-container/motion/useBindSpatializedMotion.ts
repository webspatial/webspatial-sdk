import type {
  SpatializedElement,
  SpatializedMotionKind,
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
  element?: SpatializedElement | null
}

/**
 * Resolves the runtime motion target kind from the resolved spatialized
 * element instance.
 *
 * @param element - The resolved runtime element candidate.
 * @returns The inferred motion kind, or `undefined` when the element is not a
 * supported motion target.
 */
function resolveSpatializedMotionKind(
  element: SpatializedElement,
): SpatializedMotionKind | undefined {
  switch (element.kind) {
    case 'spatialized2d':
    case 'static3d':
    case 'dynamic3d':
      return element.kind
    default:
      return undefined
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
    const kind = resolveSpatializedMotionKind(element)
    if (!kind) return

    binding.__setElement?.(element, kind)

    return () => {
      binding.__onUnbind?.()
    }
  }, [binding, element])
}
