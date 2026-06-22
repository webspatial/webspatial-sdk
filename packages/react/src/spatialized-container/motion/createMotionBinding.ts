import type {
  Spatialized2DElement,
  SpatializedDynamic3DElement,
  SpatializedMotionController,
  SpatializedMotionKind,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
import type { CSSProperties } from 'react'
import type {
  MotionFieldMetadata,
  SpatializedMotionBindingInternal,
  TerminalOpacityOwner,
  TerminalTransformOwner,
} from './motionBindingTypes'
import {
  getMotionFieldPlugin,
  getMotionOwnershipFields,
} from './plugins/registry'
import type { MotionOwnershipField, MotionTerminalOwner } from './plugins/types'

/**
 * React-only callbacks used to mirror binding metadata back into hook state.
 */
interface CreateMotionBindingOptions {
  /**
   * Receives unified field metadata updates captured on the binding.
   *
   * @param field - The field whose metadata changed.
   * @param metadata - The latest metadata snapshot for the field.
   */
  onMotionFieldMetadataChange?: (
    field: MotionOwnershipField,
    metadata: MotionFieldMetadata,
  ) => void

  /**
   * Receives explicit React `style.opacity` updates captured on the binding.
   *
   * @param opacity - The explicit React opacity value, if one exists.
   */
  onExplicitStyleOpacityChange?: (
    opacity: CSSProperties['opacity'] | undefined,
  ) => void

  /**
   * Receives post-terminal opacity owner updates captured on the binding.
   *
   * @param owner - The owner that should remain responsible for visual opacity.
   */
  onTerminalOpacityOwnerChange?: (owner: TerminalOpacityOwner) => void

  /**
   * Receives explicit React `style.transform` updates captured on the binding.
   *
   * @param transform - The explicit React transform value, if one exists.
   */
  onExplicitStyleTransformChange?: (
    transform: CSSProperties['transform'] | undefined,
  ) => void

  /**
   * Receives post-terminal transform owner updates captured on the binding.
   *
   * @param owner - The owner that should remain responsible for visual transform.
   */
  onTerminalTransformOwnerChange?: (owner: TerminalTransformOwner) => void
}

/**
 * Creates the opaque `xr-animation` binding object shared by React container
 * wiring and the Core motion controller.
 *
 * @param controller - The controller that owns runtime playback semantics.
 * @param options - Optional React-only metadata callbacks.
 * @returns The internal binding object consumed by React containers.
 */
export function createMotionBinding(
  controller: SpatializedMotionController,
  options?: CreateMotionBindingOptions,
): SpatializedMotionBindingInternal {
  /** Lists the ownership-managed fields enabled for this binding instance. */
  const supportedOwnershipFields = getMotionOwnershipFields()

  /** Stores the plugin selected for each ownership-managed field. */
  const fieldPlugins = new Map(
    supportedOwnershipFields.map(field => [field, getMotionFieldPlugin(field)]),
  )

  /** Caches authored values captured while native playback suppresses a field. */
  const authoredFieldValues = new Map<MotionOwnershipField, unknown>()

  /** Caches post-terminal ownership decisions by field. */
  const terminalFieldOwners = new Map<
    MotionOwnershipField,
    MotionTerminalOwner
  >()

  /** Caches whether a field was suppressed during the previous render pass. */
  const previousFieldSuppression = new Map<MotionOwnershipField, boolean>()

  /**
   * Returns the latest normalized metadata snapshot for a field.
   *
   * @param field - The field whose metadata should be read.
   * @returns The normalized metadata snapshot for the field.
   */
  const getMotionFieldMetadata = (
    field: MotionOwnershipField,
  ): MotionFieldMetadata => ({
    authoredValue: authoredFieldValues.get(field),
    terminalOwner: terminalFieldOwners.get(field) ?? null,
  })

  /**
   * Emits unified metadata and field-specific compatibility callbacks.
   *
   * @param field - The field whose metadata changed.
   */
  const emitMotionFieldMetadataChange = (field: MotionOwnershipField) => {
    const metadata = getMotionFieldMetadata(field)
    options?.onMotionFieldMetadataChange?.(field, metadata)
    if (field === 'opacity') {
      options?.onExplicitStyleOpacityChange?.(
        metadata.authoredValue as CSSProperties['opacity'] | undefined,
      )
      options?.onTerminalOpacityOwnerChange?.(
        metadata.terminalOwner as TerminalOpacityOwner,
      )
      return
    }
    if (field === 'transform') {
      options?.onExplicitStyleTransformChange?.(
        metadata.authoredValue as CSSProperties['transform'] | undefined,
      )
      options?.onTerminalTransformOwnerChange?.(
        metadata.terminalOwner as TerminalTransformOwner,
      )
    }
  }

  /**
   * Forwards the resolved runtime element into the Core controller.
   *
   * @param element - The resolved runtime element or `null`.
   * @param targetKind - The resolved motion target kind, if known.
   */
  const bindElement = (
    element:
      | HTMLElement
      | Spatialized2DElement
      | SpatializedStatic3DElement
      | SpatializedDynamic3DElement
      | null,
    targetKind?: SpatializedMotionKind,
  ) => {
    controller.attachElement(
      element as Parameters<SpatializedMotionController['attachElement']>[0],
      targetKind,
    )
  }

  return {
    __kind: 'spatializedMotion',
    __propName: 'xr-animation',
    __motionObjectId: controller.id,
    get __animating() {
      return controller.isAnimating
    },
    __getSuppressedFields() {
      return controller.getSuppressedFields()
    },
    __getSupportedMotionOwnershipFields() {
      return supportedOwnershipFields
    },
    __getMotionFieldPlugin(field) {
      return fieldPlugins.get(field) ?? null
    },
    __getMotionFieldMetadata(field) {
      return getMotionFieldMetadata(field)
    },
    __setMotionFieldMetadata(field, metadata) {
      if ('authoredValue' in metadata) {
        authoredFieldValues.set(field, metadata.authoredValue)
      }
      if ('terminalOwner' in metadata) {
        terminalFieldOwners.set(field, metadata.terminalOwner ?? null)
      }
      emitMotionFieldMetadataChange(field)
    },
    __getAuthoredFieldValue(field) {
      return getMotionFieldMetadata(field).authoredValue
    },
    __setAuthoredFieldValue(field, value) {
      authoredFieldValues.set(field, value)
      emitMotionFieldMetadataChange(field)
    },
    __getTerminalFieldOwner(field) {
      return getMotionFieldMetadata(field).terminalOwner
    },
    __setTerminalFieldOwner(field, owner) {
      terminalFieldOwners.set(field, owner)
      emitMotionFieldMetadataChange(field)
    },
    __getPreviousFieldSuppression(field) {
      return previousFieldSuppression.get(field) ?? false
    },
    __setPreviousFieldSuppression(field, suppressed) {
      previousFieldSuppression.set(field, suppressed)
    },
    __getExplicitStyleOpacity() {
      return getMotionFieldMetadata('opacity').authoredValue as
        | CSSProperties['opacity']
        | undefined
    },
    __setExplicitStyleOpacity(opacity) {
      authoredFieldValues.set('opacity', opacity)
      emitMotionFieldMetadataChange('opacity')
    },
    __getTerminalOpacityOwner() {
      return getMotionFieldMetadata('opacity')
        .terminalOwner as TerminalOpacityOwner
    },
    __setTerminalOpacityOwner(owner) {
      terminalFieldOwners.set('opacity', owner)
      emitMotionFieldMetadataChange('opacity')
    },
    __getExplicitStyleTransform() {
      return getMotionFieldMetadata('transform').authoredValue as
        | CSSProperties['transform']
        | undefined
    },
    __setExplicitStyleTransform(transform) {
      authoredFieldValues.set('transform', transform)
      emitMotionFieldMetadataChange('transform')
    },
    __getTerminalTransformOwner() {
      return getMotionFieldMetadata('transform')
        .terminalOwner as TerminalTransformOwner
    },
    __setTerminalTransformOwner(owner) {
      terminalFieldOwners.set('transform', owner)
      emitMotionFieldMetadataChange('transform')
    },
    __setElement: bindElement,
    __onUnbind: () => {
      controller.handleMotionUnbind()
    },
  }
}
