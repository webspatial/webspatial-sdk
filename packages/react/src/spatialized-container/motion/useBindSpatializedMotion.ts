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

export function useBindSpatializedMotion({
  binding,
  element,
  kind,
  onSuppressedFieldsChange,
}: UseBindSpatializedMotionOptions): void {
  const suppressedFieldsChangeRef = useRef(onSuppressedFieldsChange)
  suppressedFieldsChangeRef.current = onSuppressedFieldsChange

  useEffect(() => {
    if (!binding || !element) return

    binding.__setElement?.(element, kind)
    suppressedFieldsChangeRef.current?.(
      binding.__getSuppressedFields?.() ?? null,
    )

    return () => {
      binding.__onUnbind?.()
      suppressedFieldsChangeRef.current?.(null)
    }
  }, [binding, element, kind])

  useEffect(() => {
    if (!suppressedFieldsChangeRef.current) return
    suppressedFieldsChangeRef.current(
      binding?.__getSuppressedFields?.() ?? null,
    )
  })
}
