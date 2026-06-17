import type {
  Spatialized2DElement,
  SpatializedDynamic3DElement,
  SpatializedMotionKind,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'
import type { CSSProperties } from 'react'
import type {
  MotionFieldPlugin,
  MotionOwnershipField,
  MotionTerminalOwner,
} from './plugins/types'

/**
 * Describes which layer owns visual `opacity` after native 2D suppression
 * clears.
 */
export type TerminalOpacityOwner = MotionTerminalOwner

/**
 * Internal binding contract shared between React container wiring and the Core
 * motion controller for `xr-animation`.
 */
export interface SpatializedMotionBindingInternal {
  /** Identifies the binding family for runtime guards. */
  readonly __kind: 'spatializedMotion'
  /** Stores the JSX prop name used to attach the binding. */
  readonly __propName: 'xr-animation'
  /** Exposes the controller-backed motion object id. */
  readonly __motionObjectId: string
  /** Reflects whether the bound controller is currently animating. */
  get __animating(): boolean
  /** Returns the fields currently suppressed by active native playback. */
  __getSuppressedFields(): Set<string> | null

  /**
   * Returns the ownership-managed field list supported by this binding
   * instance.
   */
  __getSupportedMotionOwnershipFields?(): readonly MotionOwnershipField[]

  /**
   * Returns the ownership plugin registered for a field.
   *
   * @param field - The field whose plugin should be resolved.
   */
  __getMotionFieldPlugin?(field: MotionOwnershipField): MotionFieldPlugin | null

  /**
   * Returns the authored value cached for a field during suppression.
   *
   * @param field - The field whose cached authored value should be returned.
   */
  __getAuthoredFieldValue?(field: MotionOwnershipField): unknown

  /**
   * Updates the authored value cached for a field during suppression.
   *
   * @param field - The field whose authored value should be updated.
   * @param value - The authored value captured for the field.
   */
  __setAuthoredFieldValue?(field: MotionOwnershipField, value: unknown): void

  /**
   * Returns the post-terminal owner cached for a field.
   *
   * @param field - The field whose owner should be returned.
   */
  __getTerminalFieldOwner?(field: MotionOwnershipField): MotionTerminalOwner

  /**
   * Updates the post-terminal owner cached for a field.
   *
   * @param field - The field whose owner should be updated.
   * @param owner - The layer that should remain responsible for the field.
   */
  __setTerminalFieldOwner?(
    field: MotionOwnershipField,
    owner: MotionTerminalOwner,
  ): void

  /**
   * Returns whether the field was suppressed on the previous render pass.
   *
   * @param field - The field whose previous suppression state should be read.
   */
  __getPreviousFieldSuppression?(field: MotionOwnershipField): boolean

  /**
   * Updates the previous-render suppression state cached for a field.
   *
   * @param field - The field whose previous suppression state should be stored.
   * @param suppressed - Whether the field is currently suppressed.
   */
  __setPreviousFieldSuppression?(
    field: MotionOwnershipField,
    suppressed: boolean,
  ): void

  /**
   * Returns the cached explicit React `style.opacity` value captured for
   * terminal handoff decisions.
   */
  __getExplicitStyleOpacity?(): CSSProperties['opacity'] | undefined

  /**
   * Updates the cached explicit React `style.opacity` value used by terminal
   * handoff logic.
   *
   * @param opacity - The explicit React opacity value, if one exists.
   */
  __setExplicitStyleOpacity?(
    opacity: CSSProperties['opacity'] | undefined,
  ): void

  /**
   * Returns the cached owner that should remain responsible for visual opacity
   * after suppression clears.
   */
  __getTerminalOpacityOwner?(): TerminalOpacityOwner

  /**
   * Updates the cached post-terminal opacity owner.
   *
   * @param owner - The layer that should remain responsible for visual opacity.
   */
  __setTerminalOpacityOwner?(owner: TerminalOpacityOwner): void

  /**
   * Attaches or detaches the resolved runtime element from the binding.
   *
   * @param element - The resolved runtime element or `null` when detaching.
   * @param targetKind - The resolved motion target kind, if available.
   */
  __setElement?: (
    element:
      | HTMLElement
      | Spatialized2DElement
      | SpatializedStatic3DElement
      | SpatializedDynamic3DElement
      | null,
    targetKind?: SpatializedMotionKind,
  ) => void

  /** Performs unbind cleanup without forcing an extra `__setElement(null)` call. */
  __onUnbind?: () => void
}
