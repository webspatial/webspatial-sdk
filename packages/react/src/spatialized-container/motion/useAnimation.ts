import { useEffect, useMemo, useReducer, useRef } from 'react'
import type { CSSProperties } from 'react'
import type {
  SpatializedMotionConfig as CoreSpatializedMotionConfig,
  SpatializedMotionSegmentConfig as CoreSpatializedMotionSegmentConfig,
  SpatializedPlaybackApi,
  SpatializedVisualValues,
} from '@webspatial/core-sdk'
import { getMotionConfigSignature } from './motionConfigSignature'
import type { SpatializedMotionBinding } from './motionBindingTypes'
import { AnimationBinding } from './AnimationBinding'
import { valuesToMotionStyle } from './style'

/**
 * React-facing motion config accepted by `useAnimation()`.
 */
export type SpatializedMotionConfig = CoreSpatializedMotionConfig

/** Convenience alias for the segment-style authoring shape. */
export type SpatializedMotionSegmentConfig = CoreSpatializedMotionSegmentConfig

/**
 * Tuple returned by `useAnimation()`.
 */
export type UseAnimationResult = readonly [
  animation: SpatializedMotionBinding,
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
  const [, forceRender] = useReducer((n: number) => n + 1, 0)
  const bindingRef = useRef<AnimationBinding | null>(null)
  const destroyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!bindingRef.current) {
    bindingRef.current = new AnimationBinding(config, {
      onValuesChange: () => forceRender(),
      onStateChange: () => forceRender(),
    })
  }

  const binding = bindingRef.current

  useEffect(() => {
    binding.updateConfig(config)
  }, [binding, config, dataSignature])

  useEffect(() => {
    if (destroyTimerRef.current) {
      clearTimeout(destroyTimerRef.current)
      destroyTimerRef.current = null
    }
    return () => {
      const bindingToDestroy = binding
      destroyTimerRef.current = setTimeout(() => {
        if (bindingRef.current === bindingToDestroy) {
          bindingToDestroy.destroy()
          bindingRef.current = null
        }
        destroyTimerRef.current = null
      }, 0)
    }
  }, [binding])

  const api = useMemo(
    () => ({
      play: () => binding.play(),
      pause: () => binding.pause(),
      stop: () => binding.stop(),
      reset: () => binding.reset(),
      finish: () => binding.finish(),
      get isAnimating() {
        return binding.isAnimating
      },
      get isPaused() {
        return binding.isPaused
      },
      get finished() {
        return binding.finished
      },
      get playState() {
        return binding.playState
      },
    }),
    [binding],
  )

  const values: SpatializedVisualValues = binding.currentValues
  const style = valuesToMotionStyle(values)

  return [binding, api, style]
}

export type { SpatializedPlaybackApi as SpatializedPlaybackApi }
