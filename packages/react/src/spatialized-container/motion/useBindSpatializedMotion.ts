import type {
  Spatialized2DElement,
  SpatializedDynamic3DElement,
  SpatializedMotionKind,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'
import type {
  SpatializedMotionBindingInternal,
  TerminalOpacityOwner,
} from './motionBindingTypes'
import type { MotionFieldAuthoredInputs } from './plugins/types'

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

  /** The explicit React `style.opacity` value currently present on the node. */
  explicitStyleOpacity?: CSSProperties['opacity']

  /** Field-authored inputs collected from the currently bound React node. */
  authoredValues?: Partial<MotionFieldAuthoredInputs>

  /**
   * Receives suppression changes observed from the binding/controller pair.
   *
   * @param suppressedFields - The currently suppressed field set.
   */
  onSuppressedFieldsChange?: (suppressedFields: Set<string> | null) => void

  /**
   * Receives post-terminal opacity owner changes.
   *
   * @param owner - The layer that should remain responsible for visual opacity.
   */
  onTerminalOpacityOwnerChange?: (owner: TerminalOpacityOwner) => void
}

/**
 * Attaches a resolved runtime element to a spatialized motion binding and keeps
 * React-only ownership metadata synchronized without triggering rebinds.
 *
 * @param options - Binding lifecycle and metadata synchronization options.
 */
export function useBindSpatializedMotion({
  binding,
  element,
  kind,
  explicitStyleOpacity,
  authoredValues,
  onSuppressedFieldsChange,
  onTerminalOpacityOwnerChange,
}: UseBindSpatializedMotionOptions): void {
  const onSuppressedFieldsChangeRef = useRef(onSuppressedFieldsChange)
  onSuppressedFieldsChangeRef.current = onSuppressedFieldsChange
  const onTerminalOpacityOwnerChangeRef = useRef(onTerminalOpacityOwnerChange)
  onTerminalOpacityOwnerChangeRef.current = onTerminalOpacityOwnerChange

  useEffect(() => {
    if (!binding || !element) return

    binding.__setElement?.(element, kind)
    onSuppressedFieldsChangeRef.current?.(
      binding.__getSuppressedFields?.() ?? null,
    )
    onTerminalOpacityOwnerChangeRef.current?.(
      binding.__getTerminalOpacityOwner?.() ?? null,
    )

    return () => {
      binding.__onUnbind?.()
      for (const field of binding.__getSupportedMotionOwnershipFields?.() ??
        []) {
        binding.__setAuthoredFieldValue?.(field, undefined)
        binding.__setTerminalFieldOwner?.(field, null)
        binding.__setPreviousFieldSuppression?.(field, false)
      }
      binding.__setExplicitStyleOpacity?.(undefined)
      binding.__setTerminalOpacityOwner?.(null)
      onSuppressedFieldsChangeRef.current?.(null)
      onTerminalOpacityOwnerChangeRef.current?.(null)
    }
  }, [binding, element, kind])

  useEffect(() => {
    // Re-sync suppressed fields after every render without rebinding the element.
    // This lets callback identity change without triggering unbind/rebind.
    if (!binding) return

    const suppressedFields = binding.__getSuppressedFields?.() ?? null
    const authoredInputs: MotionFieldAuthoredInputs = {
      ...authoredValues,
      opacity: explicitStyleOpacity,
    }

    for (const field of binding.__getSupportedMotionOwnershipFields?.() ?? []) {
      const plugin = binding.__getMotionFieldPlugin?.(field)
      if (!plugin) continue

      const isSuppressed = suppressedFields?.has(field) ?? false
      const wasSuppressed =
        binding.__getPreviousFieldSuppression?.(field) ?? false

      if (isSuppressed) {
        // While native owns the field, only explicit React-authored input
        // should be cached for the eventual terminal handoff decision.
        binding.__setAuthoredFieldValue?.(
          field,
          plugin.captureAuthoredValue({
            authoredInputs,
          }),
        )
        binding.__setTerminalFieldOwner?.(field, null)
      } else if (wasSuppressed) {
        // The suppression release edge is the single handoff point.
        binding.__setTerminalFieldOwner?.(
          field,
          plugin.resolveTerminalOwner({
            authoredValue: binding.__getAuthoredFieldValue?.(field),
          }),
        )
      }

      binding.__setPreviousFieldSuppression?.(field, isSuppressed)
    }

    onSuppressedFieldsChangeRef.current?.(suppressedFields)
    onTerminalOpacityOwnerChangeRef.current?.(
      binding.__getTerminalOpacityOwner?.() ?? null,
    )
  })
}
