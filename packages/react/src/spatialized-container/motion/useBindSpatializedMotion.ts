import type {
  Spatialized2DElement,
  SpatializedDynamic3DElement,
  SpatializedMotionKind,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'
import type {
  MotionFieldMetadata,
  SpatializedMotionBindingInternal,
  TerminalOpacityOwner,
  TerminalTransformOwner,
} from './motionBindingTypes'
import type {
  MotionFieldAuthoredInputs,
  MotionOwnershipField,
} from './plugins/types'

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

  /** The current React `style` object rendered on the bound node. */
  style?: CSSProperties

  /** Additional authored React props available to descriptor input readers. */
  authoredProps?: Record<string, unknown>

  /**
   * Receives suppression changes observed from the binding/controller pair.
   *
   * @param suppressedFields - The currently suppressed field set.
   */
  onSuppressedFieldsChange?: (suppressedFields: Set<string> | null) => void

  /**
   * Receives unified field metadata updates mirrored from the binding.
   *
   * @param field - The field whose metadata changed.
   * @param metadata - The latest field metadata snapshot.
   */
  onMotionFieldMetadataChange?: (
    field: MotionOwnershipField,
    metadata: MotionFieldMetadata,
  ) => void

  /**
   * Receives post-terminal opacity owner changes.
   *
   * @param owner - The layer that should remain responsible for visual opacity.
   */
  onTerminalOpacityOwnerChange?: (owner: TerminalOpacityOwner) => void

  /**
   * Receives post-terminal transform owner changes.
   *
   * @param owner - The layer that should remain responsible for visual transform.
   */
  onTerminalTransformOwnerChange?: (owner: TerminalTransformOwner) => void
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
  style,
  authoredProps,
  onSuppressedFieldsChange,
  onMotionFieldMetadataChange,
  onTerminalOpacityOwnerChange,
  onTerminalTransformOwnerChange,
}: UseBindSpatializedMotionOptions): void {
  const onSuppressedFieldsChangeRef = useRef(onSuppressedFieldsChange)
  onSuppressedFieldsChangeRef.current = onSuppressedFieldsChange
  const onMotionFieldMetadataChangeRef = useRef(onMotionFieldMetadataChange)
  onMotionFieldMetadataChangeRef.current = onMotionFieldMetadataChange
  const onTerminalOpacityOwnerChangeRef = useRef(onTerminalOpacityOwnerChange)
  onTerminalOpacityOwnerChangeRef.current = onTerminalOpacityOwnerChange
  const onTerminalTransformOwnerChangeRef = useRef(
    onTerminalTransformOwnerChange,
  )
  onTerminalTransformOwnerChangeRef.current = onTerminalTransformOwnerChange

  /**
   * Emits the latest metadata snapshot for a field through both the new unified
   * callback and the temporary field-specific compatibility callbacks.
   *
   * @param currentBinding - The binding whose metadata should be read.
   * @param field - The field whose metadata changed.
   */
  const emitMotionFieldMetadataChange = (
    currentBinding: SpatializedMotionBindingInternal,
    field: MotionOwnershipField,
  ) => {
    const metadata = currentBinding.__getMotionFieldMetadata?.(field) ?? {
      authoredValue: currentBinding.__getAuthoredFieldValue?.(field),
      terminalOwner: currentBinding.__getTerminalFieldOwner?.(field) ?? null,
    }
    onMotionFieldMetadataChangeRef.current?.(field, metadata)
    if (field === 'opacity') {
      onTerminalOpacityOwnerChangeRef.current?.(
        metadata.terminalOwner as TerminalOpacityOwner,
      )
      return
    }
    if (field === 'transform') {
      onTerminalTransformOwnerChangeRef.current?.(
        metadata.terminalOwner as TerminalTransformOwner,
      )
    }
  }

  /**
   * Emits metadata snapshots for all ownership-managed fields in stable field
   * order.
   *
   * @param currentBinding - The binding whose field metadata should be emitted.
   */
  const emitAllMotionFieldMetadataChanges = (
    currentBinding: SpatializedMotionBindingInternal,
  ) => {
    for (const field of currentBinding.__getSupportedMotionOwnershipFields?.() ??
      []) {
      emitMotionFieldMetadataChange(currentBinding, field)
    }
  }

  useEffect(() => {
    if (!binding || !element) return

    binding.__setElement?.(element, kind)
    emitAllMotionFieldMetadataChanges(binding)
    onSuppressedFieldsChangeRef.current?.(
      binding.__getSuppressedFields?.() ?? null,
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
      binding.__setExplicitStyleTransform?.(undefined)
      binding.__setTerminalTransformOwner?.(null)
      emitAllMotionFieldMetadataChanges(binding)
      onSuppressedFieldsChangeRef.current?.(null)
    }
  }, [binding, element, kind])

  useEffect(() => {
    // Re-sync suppressed fields after every render without rebinding the element.
    // This lets callback identity change without triggering unbind/rebind.
    if (!binding) return

    const suppressedFields = binding.__getSuppressedFields?.() ?? null
    const authoredInputs: MotionFieldAuthoredInputs = {
      style,
      props: authoredProps,
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
          plugin.readAuthoredValue({
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

    emitAllMotionFieldMetadataChanges(binding)
    onSuppressedFieldsChangeRef.current?.(suppressedFields)
  })
}
