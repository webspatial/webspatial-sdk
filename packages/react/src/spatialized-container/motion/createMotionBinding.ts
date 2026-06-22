import type {
  Spatialized2DElement,
  SpatializedDynamic3DElement,
  SpatializedMotionController,
  SpatializedMotionKind,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
import type { CSSProperties } from 'react'
import type {
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
   * Caches the explicit React `style.opacity` value used for terminal handoff.
   */
  let explicitStyleOpacity: CSSProperties['opacity'] | undefined

  /**
   * Caches the explicit React `style.transform` value used for terminal handoff.
   */
  let explicitStyleTransform: CSSProperties['transform'] | undefined

  /**
   * Caches the owner that should remain responsible for visual opacity after
   * native suppression clears.
   */
  let terminalOpacityOwner: TerminalOpacityOwner = null

  /**
   * Caches the owner that should remain responsible for visual transform after
   * native suppression clears.
   */
  let terminalTransformOwner: TerminalTransformOwner = null

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
    __getAuthoredFieldValue(field) {
      return authoredFieldValues.get(field)
    },
    __setAuthoredFieldValue(field, value) {
      authoredFieldValues.set(field, value)
      if (field === 'opacity') {
        explicitStyleOpacity = value as CSSProperties['opacity'] | undefined
        options?.onExplicitStyleOpacityChange?.(explicitStyleOpacity)
      } else if (field === 'transform') {
        explicitStyleTransform = value as CSSProperties['transform'] | undefined
        options?.onExplicitStyleTransformChange?.(explicitStyleTransform)
      }
    },
    __getTerminalFieldOwner(field) {
      return terminalFieldOwners.get(field) ?? null
    },
    __setTerminalFieldOwner(field, owner) {
      terminalFieldOwners.set(field, owner)
      if (field === 'opacity') {
        terminalOpacityOwner = owner as TerminalOpacityOwner
        options?.onTerminalOpacityOwnerChange?.(terminalOpacityOwner)
      } else if (field === 'transform') {
        terminalTransformOwner = owner as TerminalTransformOwner
        options?.onTerminalTransformOwnerChange?.(terminalTransformOwner)
      }
    },
    __getPreviousFieldSuppression(field) {
      return previousFieldSuppression.get(field) ?? false
    },
    __setPreviousFieldSuppression(field, suppressed) {
      previousFieldSuppression.set(field, suppressed)
    },
    __getExplicitStyleOpacity() {
      return explicitStyleOpacity
    },
    __setExplicitStyleOpacity(opacity) {
      authoredFieldValues.set('opacity', opacity)
      explicitStyleOpacity = opacity
      options?.onExplicitStyleOpacityChange?.(opacity)
    },
    __getTerminalOpacityOwner() {
      return terminalOpacityOwner
    },
    __setTerminalOpacityOwner(owner) {
      terminalFieldOwners.set('opacity', owner)
      terminalOpacityOwner = owner
      options?.onTerminalOpacityOwnerChange?.(owner)
    },
    __getExplicitStyleTransform() {
      return explicitStyleTransform
    },
    __setExplicitStyleTransform(transform) {
      authoredFieldValues.set('transform', transform)
      explicitStyleTransform = transform
      options?.onExplicitStyleTransformChange?.(transform)
    },
    __getTerminalTransformOwner() {
      return terminalTransformOwner
    },
    __setTerminalTransformOwner(owner) {
      terminalFieldOwners.set('transform', owner)
      terminalTransformOwner = owner
      options?.onTerminalTransformOwnerChange?.(owner)
    },
    __setElement: bindElement,
    __onUnbind: () => {
      controller.handleMotionUnbind()
    },
  }
}
