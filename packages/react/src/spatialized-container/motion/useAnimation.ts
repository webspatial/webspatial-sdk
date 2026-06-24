import { useEffect, useMemo, useReducer, useRef } from 'react'
import type { CSSProperties } from 'react'
import type {
  SpatializedMotionAuthorConfig as CoreSpatializedMotionAuthorConfig,
  SpatializedMotionSegmentConfig as CoreSpatializedMotionSegmentConfig,
  SpatializedPlaybackApi,
  SpatializedVisualValues,
} from '@webspatial/core-sdk'
import { supports } from '@webspatial/core-sdk'
import { createMotionBinding } from './createMotionBinding'
import { getMotionConfigSignature } from './motionConfigSignature'
import type {
  MotionFieldMetadataMap,
  SpatializedMotionBindingInternal,
} from './motionBindingTypes'
import { resolveMotionStyle } from './resolveMotionStyle'
import type { MotionOwnershipField } from './plugins/types'
import type { AnimationBinding } from './AnimationBinding'

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
  const [, forceRender] = useReducer((n: number) => n + 1, 0)
  const bindingRef = useRef<AnimationBinding | null>(null)
  const destroyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!bindingRef.current) {
    bindingRef.current = createMotionBinding(config, {
      onValuesChange: () => forceRender(),
      onStateChange: () => forceRender(),
      onMotionFieldMetadataChange: () => forceRender(),
      onExplicitStyleOpacityChange: () => forceRender(),
      onTerminalOpacityOwnerChange: () => forceRender(),
      onExplicitStyleTransformChange: () => forceRender(),
      onTerminalTransformOwnerChange: () => forceRender(),
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

  const fieldMetadata: MotionFieldMetadataMap = {}
  for (const field of binding.__getSupportedMotionOwnershipFields?.() ?? []) {
    fieldMetadata[field] = binding.__getMotionFieldMetadata?.(field)
  }

  const resolveTerminalOwner = (field: MotionOwnershipField) => {
    if (!binding.__getSuppressedFields?.()?.has(field)) {
      return null
    }
    const plugin = binding.__getMotionFieldPlugin?.(field)
    if (!plugin) {
      return binding.__getAuthoredFieldValue?.(field) !== undefined
        ? 'authored'
        : 'native'
    }
    return plugin.resolveTerminalOwner({
      authoredValue: binding.__getAuthoredFieldValue?.(field),
    })
  }

  const api = useMemo(
    () => ({
      play: () => {
        for (const field of binding.__getSupportedMotionOwnershipFields?.() ??
          []) {
          binding.__setTerminalFieldOwner?.(field, null)
        }
        binding.play()
      },
      pause: () => binding.pause(),
      resume: () => binding.resume(),
      stop: () => {
        for (const field of binding.__getSupportedMotionOwnershipFields?.() ??
          []) {
          binding.__setTerminalFieldOwner?.(field, resolveTerminalOwner(field))
        }
        binding.stop()
      },
      reset: () => {
        for (const field of binding.__getSupportedMotionOwnershipFields?.() ??
          []) {
          binding.__setTerminalFieldOwner?.(field, resolveTerminalOwner(field))
        }
        binding.reset()
      },
      finish: () => {
        for (const field of binding.__getSupportedMotionOwnershipFields?.() ??
          []) {
          binding.__setTerminalFieldOwner?.(field, resolveTerminalOwner(field))
        }
        binding.finish()
      },
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
  const style = resolveMotionStyle({
    values,
    targetKind: binding.targetKind,
    suppressedFields: binding.__getSuppressedFields?.(),
    nativeElementSupported: supports('useAnimation', ['element']),
    fieldMetadata,
  })

  return [binding, api, style]
}

export type { SpatializedPlaybackApi as SpatializedPlaybackApi }
