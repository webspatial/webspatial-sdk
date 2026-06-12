import type {
  Spatialized2DElement,
  SpatializedDynamic3DElement,
  SpatializedMotionKind,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
import { useEffect, useRef } from 'react'
import type { SpatializedMotionBindingInternal } from './motionBindingTypes'

interface UseBindSpatializedMotionOptions {
  binding?: SpatializedMotionBindingInternal
  element?:
    | HTMLElement
    | Spatialized2DElement
    | SpatializedStatic3DElement
    | SpatializedDynamic3DElement
    | null
  kind: SpatializedMotionKind
  onSuppressedFieldsChange?: (suppressedFields: Set<string> | null) => void
}

// Shared React binding lifecycle for spatialized2d/static3d/dynamic3d containers.
export function useBindSpatializedMotion({
  binding,
  element,
  kind,
  onSuppressedFieldsChange,
}: UseBindSpatializedMotionOptions): void {
  const onSuppressedFieldsChangeRef = useRef(onSuppressedFieldsChange)
  onSuppressedFieldsChangeRef.current = onSuppressedFieldsChange

  useEffect(() => {
    if (!binding || !element) return

    binding.__setElement?.(element, kind)
    onSuppressedFieldsChangeRef.current?.(
      binding.__getSuppressedFields?.() ?? null,
    )

    return () => {
      binding.__onUnbind?.()
      onSuppressedFieldsChangeRef.current?.(null)
    }
  }, [binding, element, kind])

  useEffect(() => {
    // Re-sync suppressed fields after every render without rebinding the element.
    // This lets callback identity change without triggering unbind/rebind.
    if (!onSuppressedFieldsChangeRef.current) return
    onSuppressedFieldsChangeRef.current(
      binding?.__getSuppressedFields?.() ?? null,
    )
  })
}
