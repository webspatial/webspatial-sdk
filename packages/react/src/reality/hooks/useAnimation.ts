import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import type {
  EntityMotionConfig,
  EntityMotionProps,
  EntityPlaybackApi,
} from '@webspatial/core-sdk'
import { validateEntityMotionConfigSilently } from '@webspatial/core-sdk/internal/entity-motion'
import {
  EntityMotionBinding,
  type EntityMotionAnimation,
} from './EntityMotionBinding'

export type { EntityMotionAnimation } from './EntityMotionBinding'

/** Stable tuple returned by the experimental Entity motion hook. */
export type UseEntityAnimationResult = [
  animation: EntityMotionAnimation,
  api: EntityPlaybackApi,
  entityProps: EntityMotionProps,
]

/** Creates the redesigned experimental Entity motion tuple. */
export function useEntityAnimation(
  config: EntityMotionConfig,
): UseEntityAnimationResult {
  validateEntityMotionConfigSilently(config)
  const bindingRef = useRef<EntityMotionBinding | null>(null)
  if (bindingRef.current === null) {
    bindingRef.current = new EntityMotionBinding(config)
  }
  const binding = bindingRef.current
  useLayoutEffect(() => {
    binding.updateConfig(config)
  }, [binding, config])
  useEffect(() => {
    binding.reconcileConfig()
  }, [binding, config])
  useSyncExternalStore(
    binding.subscribe,
    binding.getSnapshot,
    binding.getSnapshot,
  )
  return [
    binding as unknown as EntityMotionAnimation,
    binding.api,
    binding.entityProps,
  ]
}
