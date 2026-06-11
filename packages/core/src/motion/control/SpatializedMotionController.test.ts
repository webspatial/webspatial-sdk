import { afterEach, describe, expect, test, vi } from 'vitest'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'

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
        timingFunction: 'linear' as const,
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

function makeSuppressionConfig() {
  return {
    duration: 1,
    autoStart: false,
    tracks: [
      {
        property: 'opacity' as const,
        timingFunction: 'linear' as const,
        keyframes: [
          { at: 0, value: 0 },
          { at: 1, value: 1 },
        ],
      },
      {
        property: 'transform.translate.x' as const,
        timingFunction: 'linear' as const,
        keyframes: [
          { at: 0, value: 0 },
          { at: 1, value: 10 },
        ],
      },
    ],
  }
}

function createNativeElement(id: string) {
  const animateMotion = vi.fn(async (command: { type: string }) => {
    if (command.type === 'play') {
      return {
        animationId: `${id}-anim`,
        finished: new Promise<SpatializedVisualValues>(() => {}),
        canceled: new Promise<SpatializedVisualValues>(() => {}),
        failed: new Promise(() => {}),
      }
    }
    return undefined
  })

  return {
    id,
    animateMotion,
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
      {
        forceNativePlayback: true,
        onValuesChange: v => values.push(v),
      },
    )
    controller.attachElement(null, 'spatialized2d')

    controller.play()
    controller.reset()
    await flushPromises()

    expect(values.at(-1)).toEqual({ opacity: 0 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onReset).toHaveBeenCalledWith({ opacity: 0 })
  })

  test('play followed by finish in the same tick cancels pending native startup', async () => {
    const values: SpatializedVisualValues[] = []
    const onComplete = vi.fn()
    const controller = new SpatializedMotionController(
      makeConfig({ autoStart: false, onComplete }),
      {
        forceNativePlayback: true,
        onValuesChange: v => values.push(v),
      },
    )
    controller.attachElement(null, 'spatialized2d')

    controller.play()
    controller.finish()
    await flushPromises()

    expect(values.at(-1)).toEqual({ opacity: 1 })
    expect(controller.playState).toBe('finished')
    expect(controller.finished).toBe(true)
    expect(onComplete).toHaveBeenCalledWith({ opacity: 1 })
  })

  test('play followed by stop in the same tick cancels pending native startup without onStop', async () => {
    const values: SpatializedVisualValues[] = []
    const onStop = vi.fn()
    const controller = new SpatializedMotionController(
      makeConfig({ autoStart: false, onStop }),
      {
        forceNativePlayback: true,
        onValuesChange: v => values.push(v),
      },
    )
    controller.attachElement(null, 'spatialized2d')

    controller.play()
    controller.stop()
    await flushPromises()

    expect(values).toEqual([{ opacity: 0 }])
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onStop).not.toHaveBeenCalled()
  })

  test('idle reset and finish fall back to JS-side emit without native session', () => {
    const values: SpatializedVisualValues[] = []
    const onStop = vi.fn()
    const onReset = vi.fn()
    const onComplete = vi.fn()

    const controller = new SpatializedMotionController(
      makeConfig({ autoStart: false, onStop, onReset, onComplete }),
      {
        forceNativePlayback: true,
        onValuesChange: v => values.push(v),
      },
    )
    controller.attachElement(null, 'spatialized2d')

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
  })

  test('native stop, reset, and finish match web semantics without absorbing one another', async () => {
    const values: SpatializedVisualValues[] = []
    const onStop = vi.fn()
    const onReset = vi.fn()
    const onComplete = vi.fn()

    const animateMotion = vi.fn(async (command: { type: string }) => {
      if (command.type === 'play') {
        return {
          animationId: 'native-1',
          finished: new Promise<SpatializedVisualValues>(() => {}),
          canceled: new Promise<SpatializedVisualValues>(() => {}),
          failed: new Promise(() => {}),
        }
      }
      if (command.type === 'stop') return { opacity: 0.4 }
      return undefined
    })
    const sessionCalls = () =>
      animateMotion.mock.calls.filter(
        ([c]) => (c as { type: string }).type !== 'play',
      )

    const controller = new SpatializedMotionController(
      makeConfig({ autoStart: false, onStop, onReset, onComplete }),
      {
        forceNativePlayback: true,
        onValuesChange: v => values.push(v),
      },
    )
    controller.attachElement(null, 'spatialized2d')
    controller.attachElement({ id: 'native-element', animateMotion } as any)

    controller.play()
    await vi.waitFor(() => {
      expect(
        animateMotion.mock.calls.filter(
          ([c]) => (c as { type: string }).type === 'play',
        ),
      ).toHaveLength(1)
    })
    const playCall = animateMotion.mock.calls.find(
      ([c]) => (c as { type: string }).type === 'play',
    )?.[0] as {
      timeline?: { duration: number; tracks: unknown[] }
      targetKind?: string
      from?: unknown
      to?: unknown
    }
    expect(playCall).toEqual(
      expect.objectContaining({
        targetKind: 'spatialized2d',
        timeline: expect.objectContaining({
          duration: 1,
          tracks: expect.arrayContaining([
            expect.objectContaining({
              property: 'opacity',
              timingFunction: 'linear',
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
      expect(animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ targetKind: 'spatialized2d', type: 'stop' }),
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
    expect(sessionCalls()).toHaveLength(1)
  })
})

describe('SpatializedMotionController portal suppression timing', () => {
  test('spatialized2d masks opacity and transform while native playback is active', () => {
    const controller = new SpatializedMotionController(
      makeSuppressionConfig(),
      { forceNativePlayback: true },
    )
    controller.attachElement(null, 'spatialized2d')
    ;(controller as any).backend.session = {
      animationId: 'native-queued',
      state: 'running',
      config: controller.config,
    }

    expect(controller.getSuppressedFields()).toEqual(
      new Set(['opacity', 'transform']),
    )
  })

  test('spatialized2d still returns opacity and transform while native is paused', () => {
    const controller = new SpatializedMotionController(
      makeSuppressionConfig(),
      { forceNativePlayback: true },
    )
    controller.attachElement(null, 'spatialized2d')
    ;(controller as any).backend.session = {
      animationId: 'native-1',
      state: 'paused',
      config: controller.config,
    }

    expect(controller.getSuppressedFields()).toEqual(
      new Set(['opacity', 'transform']),
    )
  })

  test('spatialized2d releases suppression once native is finished or idle even if webState is stale queued', () => {
    const controller = new SpatializedMotionController(
      makeSuppressionConfig(),
      { forceNativePlayback: true },
    )
    controller.attachElement(null, 'spatialized2d')

    for (const state of ['finished', 'idle'] as const) {
      ;(controller as any).backend.webState = 'queued'
      ;(controller as any).backend.session = {
        animationId: `native-${state}`,
        state,
        config: controller.config,
      }
      ;(controller as any).pendingPlay = false

      expect(controller.getSuppressedFields()).toBeNull()
    }
  })

  test.each([
    {
      command: 'stop',
      terminalState: 'idle',
      nativeResponse: { opacity: 0.4 },
    },
    { command: 'reset', terminalState: 'idle', nativeResponse: undefined },
    { command: 'finish', terminalState: 'finished', nativeResponse: undefined },
  ] as const)(
    'spatialized2d releases suppression after %s()',
    async ({ command, terminalState, nativeResponse }) => {
      const animateMotion = vi.fn(async (payload: { type: string }) => {
        if (payload.type === 'play') {
          return {
            animationId: 'native-suppression',
            finished: new Promise<SpatializedVisualValues>(() => {}),
            canceled: new Promise<SpatializedVisualValues>(() => {}),
            failed: new Promise(() => {}),
          }
        }
        return nativeResponse
      })

      const controller = new SpatializedMotionController(
        makeSuppressionConfig(),
        {
          forceNativePlayback: true,
        },
      )
      controller.attachElement(null, 'spatialized2d')
      controller.attachElement({
        id: 'native-suppression',
        animateMotion,
      } as any)

      controller.play()
      await vi.waitFor(() => {
        expect(animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'play',
            targetKind: 'spatialized2d',
          }),
        )
      })
      expect(controller.getSuppressedFields()).toEqual(
        new Set(['opacity', 'transform']),
      )
      ;(controller as any)[command]()

      await vi.waitFor(() => {
        expect(controller.playState).toBe(terminalState)
      })
      expect(controller.getSuppressedFields()).toBeNull()
    },
  )

  test('non-native and non-spatialized2d suppression behavior stays unchanged', () => {
    const web2dController = new SpatializedMotionController(
      makeConfig({ autoStart: false }),
      { forceNativePlayback: false },
    )
    web2dController.attachElement(null, 'spatialized2d')
    ;(web2dController as any).backend.webState = 'queued'
    expect(web2dController.getSuppressedFields()).toBeNull()

    const static3dController = new SpatializedMotionController(
      makeConfig({ autoStart: false }),
      { forceNativePlayback: true },
    )
    static3dController.attachElement(null, 'static3d')
    ;(static3dController as any).backend.session = {
      animationId: 'native-2',
      state: 'queued',
      config: static3dController.config,
    }
    expect(static3dController.getSuppressedFields()).toBeNull()
  })
})

describe('SpatializedMotionController unbind and rebind', () => {
  test.each(['spatialized2d', 'static3d', 'dynamic3d'] as const)(
    'recreates the native backend after %s unbind without reusing the destroyed backend',
    async kind => {
      const controller = new SpatializedMotionController(makeConfig(), {
        forceNativePlayback: true,
      })
      const firstElement = createNativeElement(`first-${kind}`)
      const secondElement = createNativeElement(`second-${kind}`)

      controller.attachElement(firstElement as any, kind)
      controller.play()

      await vi.waitFor(() => {
        expect(firstElement.animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'play', targetKind: kind }),
        )
      })

      controller.handleMotionUnbind()
      controller.attachElement(secondElement as any, kind)
      controller.play()

      await vi.waitFor(() => {
        expect(secondElement.animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'play', targetKind: kind }),
        )
      })

      expect(
        firstElement.animateMotion.mock.calls.filter(
          ([command]) => command.type === 'play',
        ),
      ).toHaveLength(1)
      expect(
        secondElement.animateMotion.mock.calls.filter(
          ([command]) => command.type === 'play',
        ),
      ).toHaveLength(1)
    },
  )
})
