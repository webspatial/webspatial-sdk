import {
  Spatialized2DElement,
  SpatializedDynamic3DElement,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
import type { SpatializedMotionKind } from '@webspatial/core-sdk'
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
}

type ResolvedSpatializedMotionElement =
  | HTMLElement
  | Spatialized2DElement
  | SpatializedStatic3DElement
  | SpatializedDynamic3DElement

/**
 * Resolves the runtime motion target kind from the resolved spatialized
 * element instance.
 *
 * @param element - The resolved runtime element candidate.
 * @returns The inferred motion kind, or `undefined` when the element is not a
 * supported motion target.
 */
function resolveSpatializedMotionKind(
  element: ResolvedSpatializedMotionElement,
): SpatializedMotionKind | undefined {
  if (element instanceof Spatialized2DElement) return 'spatialized2d'
  if (element instanceof SpatializedStatic3DElement) return 'static3d'
  if (element instanceof SpatializedDynamic3DElement) return 'dynamic3d'
  if (typeof HTMLElement !== 'undefined' && element instanceof HTMLElement) {
    return 'spatialized2d'
  }
  return undefined
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
