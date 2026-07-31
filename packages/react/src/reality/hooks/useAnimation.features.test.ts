import { describe, expect, test, vi } from 'vitest'
import { EntityMotionBinding } from './EntityMotionBinding'

describe('Entity motion playback features', () => {
  test('serializes all commands through the created Core animation object', async () => {
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
      stop: vi.fn(async () => {
        calls.push('stop')
      }),
      reset: vi.fn(async () => {
        calls.push('reset')
      }),
      finish: vi.fn(async () => {
        calls.push('finish')
      }),
      set: vi.fn(async () => {
        calls.push('set')
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

    binding.api.play()
    binding.api.pause()
    binding.api.stop()
    binding.api.reset()
    binding.api.finish()
    binding.api.set({ position: { x: 2 } })

    await vi.waitFor(() => {
      expect(calls).toEqual(['play', 'pause', 'stop', 'reset', 'finish', 'set'])
    })
  })

  test('drops set before creation and prevents binding to two entities', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const binding = new EntityMotionBinding({
      from: { position: { x: 0 } },
      to: { position: { x: 1 } },
      autoStart: false,
    })
    const entity = {
      id: 'entity-1',
      createAnimation: vi.fn(() => new Promise(() => {})),
    }

    binding.api.set({ position: { x: 2 } })
    binding.__bind(entity as never)

    expect(() =>
      binding.__bind({
        id: 'entity-2',
        createAnimation: vi.fn(),
      } as never),
    ).toThrow('multiple entities')
    expect(warning).toHaveBeenCalledOnce()

    binding.__unbind()
    warning.mockRestore()
  })
})
