import { afterEach, describe, expect, test, vi } from 'vitest'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'

const bridge = vi.hoisted(() => ({
  motionElementPlay: vi.fn(),
  motionElementSessionCommand: vi.fn(),
  motionElementCleanupListeners: vi.fn(),
}))

vi.mock('./motionElementBridge', () => bridge)

import { SpatializedMotionController } from './SpatializedMotionController'

function makeConfig(
  overrides: Partial<{
    autoStart: boolean
    onReset: () => void
    onComplete: (values: SpatializedVisualValues) => void
    onStop: (values: SpatializedVisualValues) => void
  }> = {},
) {
  return {
    duration: 1,
    autoStart: overrides.autoStart ?? false,
    tracks: [
      {
        property: 'opacity' as const,
        easing: 'linear' as const,
        keyframes: [
          { at: 0, value: 0 },
          { at: 1, value: 1 },
        ],
      },
    ],
    onReset: overrides.onReset,
    onComplete: overrides.onComplete,
    onStop: overrides.onStop,
  }
}

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

async function flushPromises() {
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}

describe('SpatializedMotionController terminal semantics (Web)', () => {
  test('reset() on idle emits start values and keeps finished false', () => {
    const values: SpatializedVisualValues[] = []
    const onReset = vi.fn()
    const controller = new SpatializedMotionController(
      makeConfig({ onReset }),
      {
        onValuesChange: v => values.push(v),
      },
    )

    controller.reset()

    expect(values).toHaveLength(2)
    expect(values.at(-1)).toEqual({ opacity: 0 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onReset).toHaveBeenCalledWith({ opacity: 0 })
  })

  test('finish() on idle emits end values and enters finished', () => {
    const values: SpatializedVisualValues[] = []
    const onComplete = vi.fn()
    const controller = new SpatializedMotionController(
      makeConfig({ onComplete }),
      {
        onValuesChange: v => values.push(v),
      },
    )

    controller.finish()

    expect(values).toHaveLength(2)
    expect(values.at(-1)).toEqual({ opacity: 1 })
    expect(controller.playState).toBe('finished')
    expect(controller.finished).toBe(true)
    expect(onComplete).toHaveBeenCalledWith({ opacity: 1 })
  })

  test('stop, reset, and finish stay independent across a terminal sequence', async () => {
    const values: SpatializedVisualValues[] = []
    const onStop = vi.fn()
    const onReset = vi.fn()
    const onComplete = vi.fn()
    const controller = new SpatializedMotionController(
      makeConfig({ autoStart: false, onStop, onReset, onComplete }),
      {
        onValuesChange: v => values.push(v),
      },
    )

    controller.play()
    controller.stop()

    const stopped = values.at(-1)!
    expect(stopped).toEqual({ opacity: 0 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onStop).not.toHaveBeenCalled()

    controller.reset()
    expect(values.at(-1)).toEqual({ opacity: 0 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onReset).toHaveBeenCalledWith({ opacity: 0 })

    controller.finish()
    expect(values.at(-1)).toEqual({ opacity: 1 })
    expect(controller.playState).toBe('finished')
    expect(controller.finished).toBe(true)
    expect(onComplete).toHaveBeenCalledWith({ opacity: 1 })
  })
})

describe('SpatializedMotionController terminal semantics (Native)', () => {
  test('play followed by reset in the same tick cancels pending native startup', async () => {
    const values: SpatializedVisualValues[] = []
    const onReset = vi.fn()
    const controller = new SpatializedMotionController(
      makeConfig({ autoStart: false, onReset }),
      'spatialized2d',
      {
        forceNativePlayback: true,
        onValuesChange: v => values.push(v),
      },
    )

    controller.play()
    controller.reset()
    await flushPromises()

    expect(values.at(-1)).toEqual({ opacity: 0 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onReset).toHaveBeenCalledWith({ opacity: 0 })
    expect(bridge.motionElementPlay).not.toHaveBeenCalled()
  })

  test('play followed by finish in the same tick cancels pending native startup', async () => {
    const values: SpatializedVisualValues[] = []
    const onComplete = vi.fn()
    const controller = new SpatializedMotionController(
      makeConfig({ autoStart: false, onComplete }),
      'spatialized2d',
      {
        forceNativePlayback: true,
        onValuesChange: v => values.push(v),
      },
    )

    controller.play()
    controller.finish()
    await flushPromises()

    expect(values.at(-1)).toEqual({ opacity: 1 })
    expect(controller.playState).toBe('finished')
    expect(controller.finished).toBe(true)
    expect(onComplete).toHaveBeenCalledWith({ opacity: 1 })
    expect(bridge.motionElementPlay).not.toHaveBeenCalled()
  })

  test('play followed by stop in the same tick cancels pending native startup without onStop', async () => {
    const values: SpatializedVisualValues[] = []
    const onStop = vi.fn()
    const controller = new SpatializedMotionController(
      makeConfig({ autoStart: false, onStop }),
      'spatialized2d',
      {
        forceNativePlayback: true,
        onValuesChange: v => values.push(v),
      },
    )

    controller.play()
    controller.stop()
    await flushPromises()

    expect(values).toEqual([{ opacity: 0 }])
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onStop).not.toHaveBeenCalled()
    expect(bridge.motionElementPlay).not.toHaveBeenCalled()
  })

  test('idle reset and finish fall back to JS-side emit without native session', () => {
    const values: SpatializedVisualValues[] = []
    const onStop = vi.fn()
    const onReset = vi.fn()
    const onComplete = vi.fn()

    const controller = new SpatializedMotionController(
      makeConfig({ autoStart: false, onStop, onReset, onComplete }),
      'spatialized2d',
      {
        forceNativePlayback: true,
        onValuesChange: v => values.push(v),
      },
    )

    controller.stop()
    expect(values).toHaveLength(1)
    expect(values.at(-1)).toEqual({ opacity: 0 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onStop).not.toHaveBeenCalled()

    controller.reset()
    expect(values).toHaveLength(2)
    expect(values.at(-1)).toEqual({ opacity: 0 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onReset).toHaveBeenCalledWith({ opacity: 0 })

    controller.finish()
    expect(values).toHaveLength(3)
    expect(values.at(-1)).toEqual({ opacity: 1 })
    expect(controller.playState).toBe('finished')
    expect(controller.finished).toBe(true)
    expect(onComplete).toHaveBeenCalledWith({ opacity: 1 })

    expect(bridge.motionElementPlay).not.toHaveBeenCalled()
    expect(bridge.motionElementSessionCommand).not.toHaveBeenCalled()
  })

  test('native stop, reset, and finish match web semantics without absorbing one another', async () => {
    const values: SpatializedVisualValues[] = []
    const onStop = vi.fn()
    const onReset = vi.fn()
    const onComplete = vi.fn()

    bridge.motionElementPlay.mockResolvedValue({
      animationId: 'native-1',
      finished: new Promise<SpatializedVisualValues>(() => {}),
      canceled: new Promise<SpatializedVisualValues>(() => {}),
      failed: new Promise(() => {}),
    })
    bridge.motionElementSessionCommand.mockImplementation(
      async (
        _kind: string,
        _element: { id: string },
        command: { type: string },
      ) => {
        if (command.type === 'stop') return { opacity: 0.4 }
        return undefined
      },
    )

    const controller = new SpatializedMotionController(
      makeConfig({ autoStart: false, onStop, onReset, onComplete }),
      'spatialized2d',
      {
        forceNativePlayback: true,
        onValuesChange: v => values.push(v),
      },
    )
    controller.attachElement({ id: 'native-element' } as any)

    controller.play()
    await vi.waitFor(() => {
      expect(bridge.motionElementPlay).toHaveBeenCalledTimes(1)
    })
    const playCall = bridge.motionElementPlay.mock.calls[0]?.[2] as {
      timeline?: { duration: number; tracks: unknown[] }
      from?: unknown
      to?: unknown
    }
    expect(playCall).toEqual(
      expect.objectContaining({
        timeline: expect.objectContaining({
          duration: 1,
          tracks: expect.arrayContaining([
            expect.objectContaining({
              property: 'opacity',
              easing: 'linear',
            }),
          ]),
        }),
      }),
    )
    expect(playCall).not.toHaveProperty('from')
    expect(playCall).not.toHaveProperty('to')
    expect(controller.playState).toBe('running')

    controller.stop()
    await vi.waitFor(() => {
      expect(bridge.motionElementSessionCommand).toHaveBeenCalledWith(
        'spatialized2d',
        expect.objectContaining({ id: 'native-element' }),
        expect.objectContaining({ type: 'stop' }),
      )
    })
    const stopped = values.at(-1)!
    expect(stopped.opacity).toBe(0.4)
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onStop).toHaveBeenCalledWith(stopped)

    controller.reset()
    expect(values.at(-1)).toEqual({ opacity: 0 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onReset).toHaveBeenCalledWith({ opacity: 0 })

    controller.finish()
    expect(values.at(-1)).toEqual({ opacity: 1 })
    expect(controller.playState).toBe('finished')
    expect(controller.finished).toBe(true)
    expect(onComplete).toHaveBeenCalledWith({ opacity: 1 })
    expect(bridge.motionElementSessionCommand).toHaveBeenCalledTimes(1)
  })
})
