import { describe, expectTypeOf, test } from 'vitest'
import type {
  EntityMotionConfig,
  EntityMotionProps,
  EntityPlaybackError,
  EntityPlaybackApi,
  EntityTransformUpdate,
  SpatializedPlaybackError,
} from '../../types/motion'

describe('Entity motion public types', () => {
  test('exposes transform-only config, values, and playback controls', () => {
    expectTypeOf<EntityMotionConfig>().toMatchTypeOf<{
      duration?: number
      autoStart?: boolean
    }>()
    expectTypeOf<EntityMotionProps>().toMatchTypeOf<{
      position?: { x: number; y: number; z: number }
    }>()
    expectTypeOf<EntityTransformUpdate>().toMatchTypeOf<{
      rotation?: { x?: number; y?: number; z?: number }
    }>()
    expectTypeOf<EntityPlaybackApi['set']>()
      .parameter(0)
      .toEqualTypeOf<EntityTransformUpdate>()
    expectTypeOf<EntityPlaybackApi['set']>().returns.toEqualTypeOf<void>()
    expectTypeOf<EntityPlaybackApi>().toHaveProperty('play')
    expectTypeOf<EntityPlaybackApi>().toHaveProperty('finish')
  })

  test('keeps Element and Entity playback error contracts independent', () => {
    expectTypeOf<SpatializedPlaybackError>().toEqualTypeOf<{
      command:
        | 'create'
        | 'play'
        | 'pause'
        | 'resume'
        | 'stop'
        | 'reset'
        | 'finish'
        | 'destroy'
      code?: string
      reason: string
    }>()
    expectTypeOf<EntityPlaybackError>().toEqualTypeOf<{
      code:
        | 'TARGET_NOT_FOUND'
        | 'UNSUPPORTED_TARGET'
        | 'ANIMATION_NOT_FOUND'
        | 'INVALID_TIMELINE'
        | 'COMPILATION_FAILED'
        | 'INVALID_CONTROL_STATE'
        | 'INVALID_SET_VALUES'
      reason: string
    }>()
  })
})
