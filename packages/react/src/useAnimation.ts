import type {
  AnimationConfig,
  AnimationApi,
  AnimatedProps,
  SpatialDivAnimationConfig,
  SpatialDivAnimationApi,
  SpatialDivAnimatedProps,
} from '@webspatial/core-sdk'
import { useEntityAnimation } from './reality/hooks/useAnimation'
import { useSpatialDivAnimation } from './spatialized-container/hooks/useSpatialDivAnimation'

// Keys that belong to entity animation
const ENTITY_KEYS = new Set(['position', 'rotation', 'scale'])
// Keys that belong to SpatialDiv animation
const SPATIAL_DIV_KEYS = new Set([
  'back',
  'transform',
  'opacity',
  'depth',
  'width',
  'height',
])

export type AnimationKind = 'entity' | 'spatialDiv'

/**
 * Determines the animation kind based on the `to` key set.
 * Entity and SpatialDiv keys are mutually exclusive.
 */
export function resolveAnimationKind(config: {
  to: Record<string, any>
}): AnimationKind {
  const keys = Object.keys(config.to)
  const hasEntityKeys = keys.some(k => ENTITY_KEYS.has(k))
  const hasSpatialDivKeys = keys.some(k => SPATIAL_DIV_KEYS.has(k))

  if (hasEntityKeys && hasSpatialDivKeys) {
    throw new Error(
      '[useAnimation] config.to contains both entity keys (' +
        keys.filter(k => ENTITY_KEYS.has(k)).join(', ') +
        ') and SpatialDiv keys (' +
        keys.filter(k => SPATIAL_DIV_KEYS.has(k)).join(', ') +
        '). These are mutually exclusive.',
    )
  }

  return hasSpatialDivKeys ? 'spatialDiv' : 'entity'
}

/**
 * Unified `useAnimation` entry point.
 * Dispatches to entity or SpatialDiv animation based on config.to keys.
 */
export function useAnimation(
  config: SpatialDivAnimationConfig,
): [SpatialDivAnimatedProps, SpatialDivAnimationApi]
export function useAnimation(
  config: AnimationConfig,
): [AnimatedProps, AnimationApi]
export function useAnimation(
  config: AnimationConfig | SpatialDivAnimationConfig,
): [
  AnimatedProps | SpatialDivAnimatedProps,
  AnimationApi | SpatialDivAnimationApi,
] {
  const kind = resolveAnimationKind(config as { to: Record<string, any> })

  // Both hooks called unconditionally (Rules of Hooks)
  const entityResult = useEntityAnimation(
    config as AnimationConfig,
    kind === 'entity',
  )
  const spatialDivResult = useSpatialDivAnimation(
    config as SpatialDivAnimationConfig,
    kind === 'spatialDiv',
  )

  return kind === 'entity' ? entityResult : spatialDivResult
}
