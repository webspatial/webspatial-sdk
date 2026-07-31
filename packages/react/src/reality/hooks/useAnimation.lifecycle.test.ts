import { describe, expect, test, vi } from 'vitest'
import type {
  EntityMotionProps,
  SpatializedMotionPlayState,
  SpatializedPlaybackError,
} from '@webspatial/core-sdk'
import { EntityMotionBinding } from './EntityMotionBinding'

describe('Entity motion lifecycle', () => {
  test('reflects native-confirmed state and values through the binding', async () => {
    const listeners: {
      start?: (values: EntityMotionProps) => void
      complete?: (values: EntityMotionProps) => void
      stop?: (values: EntityMotionProps) => void
      reset?: (values: EntityMotionProps) => void
      error?: (error: SpatializedPlaybackError) => void
      values?: (values: EntityMotionProps) => void
      state?: (state: SpatializedMotionPlayState) => void
    } = {}
    const object = {
      id: 'animation-1',
      playState: 'idle',
      isAnimating: false,
      isPaused: false,
      finished: false,
      play: vi.fn(async () => undefined),
      pause: vi.fn(async () => undefined),
      stop: vi.fn(async () => undefined),
      reset: vi.fn(async () => undefined),
      finish: vi.fn(async () => undefined),
      set: vi.fn(async () => undefined),
      destroy: vi.fn(async () => undefined),
      onStart: vi.fn((listener: typeof listeners.start) => {
        listeners.start = listener
      }),
      onComplete: vi.fn((listener: typeof listeners.complete) => {
        listeners.complete = listener
      }),
      onStop: vi.fn((listener: typeof listeners.stop) => {
        listeners.stop = listener
      }),
      onReset: vi.fn((listener: typeof listeners.reset) => {
        listeners.reset = listener
      }),
      onError: vi.fn((listener: typeof listeners.error) => {
        listeners.error = listener
      }),
      onValuesChange: vi.fn((listener: typeof listeners.values) => {
        listeners.values = listener
      }),
      onPlayStateChange: vi.fn((listener: typeof listeners.state) => {
        listeners.state = listener
      }),
    }
    const onStart = vi.fn()
    const binding = new EntityMotionBinding({
      from: { position: { x: 0 } },
      to: { position: { x: 1 } },
      autoStart: false,
      onStart,
    })

    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as never)
    await vi.waitFor(() => expect(binding.api.playState).toBe('idle'))

    const values = {
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 4, y: 5, z: 6 },
      scale: { x: 1, y: 1, z: 1 },
    }
    object.playState = 'running'
    listeners.state?.('running')
    listeners.values?.(values)
    listeners.start?.(values)

    expect(binding.entityProps).toEqual(values)
    expect(binding.api.playState).toBe('running')
    expect(binding.api.isAnimating).toBe(true)
    expect(onStart).toHaveBeenCalledWith(values)

    binding.__unbind()
    expect(binding.entityProps).toEqual({})
    expect(binding.api.playState).toBe('idle')
    expect(object.destroy).toHaveBeenCalledOnce()
  })

  test('terminates a failed creation until an explicit rebind', async () => {
    const onError = vi.fn()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const binding = new EntityMotionBinding({
      from: { position: { x: 0 } },
      to: { position: { x: 1 } },
      autoStart: false,
      onError,
    })
    const failedEntity = {
      id: 'entity-failed',
      createAnimation: vi.fn(async () => {
        throw new Error('creation failed')
      }),
    }

    binding.__bind(failedEntity as never)
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce())
    binding.api.play()

    expect(binding.api.playState).toBe('idle')
    expect(warning).toHaveBeenCalledOnce()

    binding.__unbind()
    warning.mockRestore()
  })
})
