import { describe, expect, test, vi } from 'vitest'
import { EntityMotionBinding } from './EntityMotionBinding'

describe('Entity motion playback features', () => {
  test('serializes in-place updates with playback and set commands', async () => {
    const calls: string[] = []
    const object = {
      id: 'animation-1',
      playState: 'idle',
      isAnimating: false,
      isPaused: false,
      finished: false,
      play: vi.fn(async () => {
        calls.push('play')
      }),
      pause: vi.fn(async () => {
        calls.push('pause')
      }),
      stop: vi.fn(async () => undefined),
      reset: vi.fn(async () => undefined),
      finish: vi.fn(async () => undefined),
      set: vi.fn(async () => {
        calls.push('set')
      }),
      update: vi.fn(async () => {
        calls.push('update')
      }),
      destroy: vi.fn(async () => undefined),
      onStart: vi.fn(),
      onComplete: vi.fn(),
      onStop: vi.fn(),
      onReset: vi.fn(),
      onError: vi.fn(),
      onValuesChange: vi.fn(),
      onPlayStateChange: vi.fn(),
    }
    const binding = new EntityMotionBinding({
      from: { position: { x: 0 } },
      to: { position: { x: 1 } },
      autoStart: false,
    })
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as never)
    await vi.waitFor(() => expect(binding.api.playState).toBe('idle'))

    binding.updateConfig({
      from: { position: { x: 0 } },
      to: { position: { x: 2 } },
      autoStart: false,
    })
    binding.reconcileConfig()
    binding.api.pause()
    binding.api.set({ position: { x: 3 } })
    binding.api.play()

    await vi.waitFor(() => {
      expect(calls).toEqual(['update', 'pause', 'set', 'play'])
    })
    expect(object.destroy).not.toHaveBeenCalled()
  })

  test('delegates consecutive config updates to Core in call order', async () => {
    const updatedTargets: number[] = []
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
      update: vi.fn(async config => {
        updatedTargets.push(config.to.position.x)
      }),
      destroy: vi.fn(async () => undefined),
      onStart: vi.fn(),
      onComplete: vi.fn(),
      onStop: vi.fn(),
      onReset: vi.fn(),
      onError: vi.fn(),
      onValuesChange: vi.fn(),
      onPlayStateChange: vi.fn(),
    }
    const binding = new EntityMotionBinding({
      from: { position: { x: 0 } },
      to: { position: { x: 1 } },
      autoStart: false,
    })
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as never)
    await vi.waitFor(() => expect(binding.api.playState).toBe('idle'))

    for (const target of [2, 3, 4]) {
      binding.updateConfig({
        from: { position: { x: 0 } },
        to: { position: { x: target } },
        autoStart: false,
      })
      binding.reconcileConfig()
      await Promise.resolve()
    }

    expect(updatedTargets).toEqual([2, 3, 4])
  })

  test('continues after update failure without replaying autoStart', async () => {
    const calls: string[] = []
    const onError = vi.fn()
    const object = {
      id: 'animation-1',
      playState: 'idle',
      isAnimating: false,
      isPaused: false,
      finished: false,
      play: vi.fn(async () => {
        calls.push('play')
      }),
      pause: vi.fn(async () => undefined),
      stop: vi.fn(async () => undefined),
      reset: vi.fn(async () => undefined),
      finish: vi.fn(async () => undefined),
      set: vi.fn(async () => undefined),
      update: vi.fn(async () => {
        calls.push('update')
        throw new Error('update failed')
      }),
      destroy: vi.fn(async () => undefined),
      onStart: vi.fn(),
      onComplete: vi.fn(),
      onStop: vi.fn(),
      onReset: vi.fn(),
      onError: vi.fn(),
      onValuesChange: vi.fn(),
      onPlayStateChange: vi.fn(),
    }
    const binding = new EntityMotionBinding({
      from: { position: { x: 0 } },
      to: { position: { x: 1 } },
      autoStart: false,
      onError,
    })
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as never)
    await vi.waitFor(() => expect(binding.api.playState).toBe('idle'))

    binding.updateConfig({
      from: { position: { x: 0 } },
      to: { position: { x: 2 } },
      autoStart: true,
      onError,
    })
    binding.reconcileConfig()
    binding.api.play()

    await vi.waitFor(() => expect(calls).toEqual(['update', 'play']))
    expect(object.play).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith({
      code: 'COMPILATION_FAILED',
      reason: 'update failed',
    })
  })
})
