import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type {
  SpatializedMotionAuthorConfig as CoreSpatializedMotionAuthorConfig,
  SpatializedMotionSegmentConfig as CoreSpatializedMotionSegmentConfig,
  SpatializedPlaybackApi,
  SpatializedVisualValues,
} from '@webspatial/core-sdk'
import {
  evaluateMotionTimeline,
  normalizeMotionConfig,
  supports,
} from '@webspatial/core-sdk'
import { createMotionBinding } from './createMotionBinding'
import { getMotionConfigSignature } from './motionConfigSignature'
import type {
  MotionFieldMetadata,
  MotionFieldMetadataMap,
  SpatializedMotionBindingInternal,
} from './motionBindingTypes'
import { resolveMotionStyle } from './resolveMotionStyle'
import { useMotionController } from './useMotionController'
import type { MotionOwnershipField } from './plugins/types'

/**
 * React-facing motion config accepted by `useAnimation()`.
 */
export type SpatializedMotionConfig = CoreSpatializedMotionAuthorConfig

/** Convenience alias for the segment-style authoring shape. */
export type SpatializedMotionSegmentConfig = CoreSpatializedMotionSegmentConfig

/**
 * Tuple returned by `useAnimation()`.
 */
export type UseAnimationResult = readonly [
  animation: SpatializedMotionBindingInternal,
  api: SpatializedPlaybackApi,
  style: CSSProperties,
]

/**
 * Creates the target-agnostic spatialized motion tuple used by React
 * containers.
 *
 * @param config - The motion config to normalize and bind to a controller.
 * @returns The opaque binding, playback api, and React style outlet.
 */
export function useAnimation(
  config: SpatializedMotionConfig,
): UseAnimationResult {
  const dataSignature = getMotionConfigSignature(config)

  // Keep timeline normalization stable across callback-only renders.
  const normalizedTimelineConfig = useMemo(
    () => normalizeMotionConfig(config),
    [dataSignature],
  )
  const controllerConfig = useMemo(
    () => ({
      ...normalizedTimelineConfig,
      onStart: config.onStart,
      onComplete: config.onComplete,
      onStop: config.onStop,
      onReset: config.onReset,
      onError: config.onError,
    }),
    [
      normalizedTimelineConfig,
      config.onStart,
      config.onComplete,
      config.onStop,
      config.onReset,
      config.onError,
    ],
  )

  const [values, setValues] = useState<SpatializedVisualValues>(() =>
    evaluateMotionTimeline(normalizedTimelineConfig, 0),
  )
  /** React-only field metadata mirrored from the opaque motion binding. */
  const [fieldMetadata, setFieldMetadata] = useState<MotionFieldMetadataMap>({})
  const controller = useMotionController(controllerConfig, setValues)

  useEffect(() => {
    // Only idle bindings should adopt a new config immediately. Active sessions
    // keep their original snapshot until the next play().
    if (controller.playState !== 'idle') return
    setValues(evaluateMotionTimeline(normalizedTimelineConfig, 0))
  }, [controller, normalizedTimelineConfig])

  /**
   * Mirrors binding metadata into React state while avoiding no-op updates.
   *
   * @param field - The field whose metadata changed.
   * @param metadata - The latest metadata snapshot for the field.
   */
  const handleMotionFieldMetadataChange = (
    field: MotionOwnershipField,
    metadata: MotionFieldMetadata,
  ) => {
    setFieldMetadata(prev => {
      const current = prev[field]
      if (
        current?.authoredValue === metadata.authoredValue &&
        current?.terminalOwner === metadata.terminalOwner
      ) {
        return prev
      }
      return {
        ...prev,
        [field]: metadata,
      }
    })
  }

  const animation = useMemo(
    () =>
      createMotionBinding(controller, {
        onMotionFieldMetadataChange: handleMotionFieldMetadataChange,
      }),
    [controller],
  )
  /**
   * Resolves the current terminal owner for an ownership-managed field from the
   * binding plugin runtime without changing Core playback semantics.
   *
   * @param field - The field whose post-terminal owner should be resolved.
   * @returns The terminal owner decision for the field.
   */
  const resolveTerminalOwner = (field: MotionOwnershipField) => {
    if (!controller.getSuppressedFields()?.has(field)) {
      return null
    }
    const plugin = animation.__getMotionFieldPlugin?.(field)
    if (!plugin) {
      return animation.__getAuthoredFieldValue?.(field) !== undefined
        ? 'authored'
        : 'native'
    }
    return plugin.resolveTerminalOwner({
      authoredValue: animation.__getAuthoredFieldValue?.(field),
    })
  }
  const api = useMemo(
    () => ({
      play: () => {
        // A new play session clears any previous terminal owner choice.
        for (const field of animation.__getSupportedMotionOwnershipFields?.() ??
          []) {
          animation.__setTerminalFieldOwner?.(field, null)
        }
        controller.play()
      },
      pause: () => controller.pause(),
      resume: () => controller.resume(),
      stop: () => {
        // stop/reset/finish keep Core terminal semantics but also decide who
        // should own visual fields after native suppression is released.
        for (const field of animation.__getSupportedMotionOwnershipFields?.() ??
          []) {
          animation.__setTerminalFieldOwner?.(
            field,
            resolveTerminalOwner(field),
          )
        }
        controller.stop()
      },
      reset: () => {
        for (const field of animation.__getSupportedMotionOwnershipFields?.() ??
          []) {
          animation.__setTerminalFieldOwner?.(
            field,
            resolveTerminalOwner(field),
          )
        }
        controller.reset()
      },
      finish: () => {
        for (const field of animation.__getSupportedMotionOwnershipFields?.() ??
          []) {
          animation.__setTerminalFieldOwner?.(
            field,
            resolveTerminalOwner(field),
          )
        }
        controller.finish()
      },
      get isAnimating() {
        return controller.isAnimating
      },
      get isPaused() {
        return controller.isPaused
      },
      get finished() {
        return controller.finished
      },
      get playState() {
        return controller.playState
      },
    }),
    [animation, controller],
  )

  const style = resolveMotionStyle({
    values,
    targetKind: controller.targetKind,
    suppressedFields: controller.getSuppressedFields(),
    nativeElementSupported: supports('useAnimation', ['element']),
    fieldMetadata,
  })

  return [animation, api, style]
}

export type { SpatializedPlaybackApi as SpatializedPlaybackApi }
