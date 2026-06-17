import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type {
  SpatializedMotionConfig as CoreSpatializedMotionConfig,
  SpatializedMotionSegmentConfig as CoreSpatializedMotionSegmentConfig,
  SpatializedMotionTimelineConfig as CoreSpatializedMotionTimelineConfig,
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
import type { SpatializedMotionBindingInternal } from './motionBindingTypes'
import { resolveMotionStyle } from './resolveMotionStyle'
import { useMotionController } from './useMotionController'

/**
 * React-facing motion config accepted by `useAnimation()`.
 */
export type SpatializedMotionConfig =
  | CoreSpatializedMotionSegmentConfig
  | CoreSpatializedMotionConfig
  | CoreSpatializedMotionTimelineConfig

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
  /** Mirrors explicit React `style.opacity` captured on the binding. */
  const [explicitStyleOpacity, setExplicitStyleOpacity] = useState<
    CSSProperties['opacity'] | undefined
  >(undefined)
  /**
   * Tracks who should remain responsible for visual opacity after a terminal
   * command completes. Core still owns sampled values and callbacks.
   */
  const [terminalOpacityOwner, setTerminalOpacityOwner] = useState<
    'authored' | 'native' | null
  >(null)
  const controller = useMotionController(controllerConfig, setValues)

  useEffect(() => {
    // Only idle bindings should adopt a new config immediately. Active sessions
    // keep their original snapshot until the next play().
    if (controller.playState !== 'idle') return
    setValues(evaluateMotionTimeline(normalizedTimelineConfig, 0))
  }, [controller, normalizedTimelineConfig])
  const animation = useMemo(
    () =>
      createMotionBinding(controller, {
        onExplicitStyleOpacityChange: setExplicitStyleOpacity,
        onTerminalOpacityOwnerChange: setTerminalOpacityOwner,
      }),
    [controller],
  )
  /**
   * Resolves the current terminal owner for `opacity` from the binding plugin
   * runtime without changing Core playback semantics.
   */
  const resolveOpacityTerminalOwner = () => {
    if (!controller.getSuppressedFields()?.has('opacity')) {
      return null
    }
    const opacityPlugin = animation.__getMotionFieldPlugin?.('opacity')
    if (!opacityPlugin) {
      return animation.__getAuthoredFieldValue?.('opacity') !== undefined
        ? 'authored'
        : 'native'
    }
    return opacityPlugin.resolveTerminalOwner({
      authoredValue: animation.__getAuthoredFieldValue?.('opacity'),
    })
  }
  const api = useMemo(
    () => ({
      play: () => {
        // A new play session clears any previous terminal owner choice.
        animation.__setTerminalFieldOwner?.('opacity', null)
        controller.play()
      },
      pause: () => controller.pause(),
      resume: () => controller.resume(),
      stop: () => {
        // stop/reset/finish keep Core terminal semantics but also decide who
        // should own visual opacity after native suppression is released.
        animation.__setTerminalFieldOwner?.(
          'opacity',
          resolveOpacityTerminalOwner(),
        )
        controller.stop()
      },
      reset: () => {
        animation.__setTerminalFieldOwner?.(
          'opacity',
          resolveOpacityTerminalOwner(),
        )
        controller.reset()
      },
      finish: () => {
        animation.__setTerminalFieldOwner?.(
          'opacity',
          resolveOpacityTerminalOwner(),
        )
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
    explicitStyleOpacity,
    terminalOpacityOwner,
  })

  return [animation, api, style]
}

export type { SpatializedPlaybackApi as SpatializedPlaybackApi }
