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

function makeOpacityConfig(
  start: number,
  end: number,
  overrides: Partial<{
    autoStart: boolean
    onReset: (values: SpatializedVisualValues) => void
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
          { at: 0, value: start },
          { at: 1, value: end },
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

function makeTransformConfig() {
  return {
    duration: 1,
    autoStart: false,
    tracks: [
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

function makeStatic3DConfig(
  overrides: Partial<{
    autoStart: boolean
    onReset: (values: SpatializedVisualValues) => void
    onComplete: (values: SpatializedVisualValues) => void
    onStop: (values: SpatializedVisualValues) => void
  }> = {},
) {
  return {
    duration: 1,
    autoStart: overrides.autoStart ?? false,
    tracks: [
      {
        property: 'transform.translate.x' as const,
        timingFunction: 'linear' as const,
        keyframes: [
          { at: 0, value: 0 },
          { at: 1, value: 10 },
        ],
      },
    ],
    onReset: overrides.onReset,
    onComplete: overrides.onComplete,
    onStop: overrides.onStop,
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
  vi.unstubAllGlobals()
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

  test('unbound finish -> updateConfig -> reset keeps using the finished session config', () => {
    const values: SpatializedVisualValues[] = []
    const onReset = vi.fn()
    const onComplete = vi.fn()
    const configA = makeOpacityConfig(0.2, 0.8, { onReset, onComplete })
    const configB = makeOpacityConfig(0.4, 0.9, { onReset, onComplete })
    const controller = new SpatializedMotionController(configA, {
      onValuesChange: v => values.push(v),
    })

    controller.play()
    controller.finish()
    controller.updateConfig(configB)
    controller.reset()

    expect(onComplete).toHaveBeenCalledWith({ opacity: 0.8 })
    expect(values.at(-1)).toEqual({ opacity: 0.2 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onReset).toHaveBeenCalledWith({ opacity: 0.2 })
  })

  test('web finish -> updateConfig -> reset keeps using the finished session config', () => {
    const values: SpatializedVisualValues[] = []
    const onReset = vi.fn()
    const onComplete = vi.fn()
    const configA = makeOpacityConfig(0.2, 0.8, { onReset, onComplete })
    const configB = makeOpacityConfig(0.4, 0.9, { onReset, onComplete })
    const controller = new SpatializedMotionController(configA, {
      onValuesChange: v => values.push(v),
    })
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => {})
    controller.attachElement(null, 'spatialized2d')

    controller.play()
    controller.finish()
    controller.updateConfig(configB)
    controller.reset()

    expect(onComplete).toHaveBeenCalledWith({ opacity: 0.8 })
    expect(values.at(-1)).toEqual({ opacity: 0.2 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onReset).toHaveBeenCalledWith({ opacity: 0.2 })
  })

  test('unbound stop -> updateConfig -> reset keeps using the stopped session config', () => {
    const values: SpatializedVisualValues[] = []
    const onReset = vi.fn()
    const onStop = vi.fn()
    const configA = makeOpacityConfig(0.2, 0.8, { onReset, onStop })
    const configB = makeOpacityConfig(0.4, 0.9, { onReset, onStop })
    const controller = new SpatializedMotionController(configA, {
      onValuesChange: v => values.push(v),
    })

    controller.play()
    controller.stop()
    controller.updateConfig(configB)
    controller.reset()

    expect(onStop).not.toHaveBeenCalled()
    expect(values.at(-1)).toEqual({ opacity: 0.2 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onReset).toHaveBeenCalledWith({ opacity: 0.2 })
  })

  test('web stop -> updateConfig -> reset keeps using the stopped session config', () => {
    const values: SpatializedVisualValues[] = []
    const onReset = vi.fn()
    const onStop = vi.fn()
    const configA = makeOpacityConfig(0.2, 0.8, { onReset, onStop })
    const configB = makeOpacityConfig(0.4, 0.9, { onReset, onStop })
    const controller = new SpatializedMotionController(configA, {
      onValuesChange: v => values.push(v),
    })
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => {})
    controller.attachElement(null, 'spatialized2d')

    controller.play()
    controller.stop()
    controller.updateConfig(configB)
    controller.reset()

    expect(onStop).toHaveBeenCalledTimes(1)
    expect(onStop.mock.calls[0]?.[0]?.opacity).toBeCloseTo(0.2, 3)
    expect(values.at(-1)).toEqual({ opacity: 0.2 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onReset).toHaveBeenCalledWith({ opacity: 0.2 })
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

  test('idle reset and finish fall back to JS-side emit without native session', async () => {
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
    await flushPromises()
    expect(values).toHaveLength(2)
    expect(values.at(-1)).toEqual({ opacity: 0 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onReset).toHaveBeenCalledWith({ opacity: 0 })

    controller.finish()
    await flushPromises()
    expect(values).toHaveLength(3)
    expect(values.at(-1)).toEqual({ opacity: 1 })
    expect(controller.playState).toBe('finished')
    expect(controller.finished).toBe(true)
    expect(onComplete).toHaveBeenCalledWith({ opacity: 1 })
  })

  test.each(['static3d', 'dynamic3d'] as const)(
    '%s play -> finish -> reset uses native terminal seek and one-shot idle terminal commands',
    async kind => {
      const values: SpatializedVisualValues[] = []
      const onReset = vi.fn()
      const onComplete = vi.fn()

      const animateMotion = vi.fn(async (command: { type: string }) => {
        if (command.type === 'play') {
          return {
            animationId: 'native-model-1',
            finished: new Promise<SpatializedVisualValues>(() => {}),
            canceled: new Promise<SpatializedVisualValues>(() => {}),
            failed: new Promise(() => {}),
          }
        }
        return undefined
      })

      const controller = new SpatializedMotionController(
        makeStatic3DConfig({ onReset, onComplete }),
        {
          forceNativePlayback: true,
          onValuesChange: v => values.push(v),
        },
      )
      controller.attachElement(null, kind)
      controller.attachElement({ id: 'native-model', animateMotion } as any)

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
          targetKind: kind,
          timeline: expect.objectContaining({
            duration: 1,
            tracks: expect.arrayContaining([
              expect.objectContaining({
                property: 'transform.translate.x',
                timingFunction: 'linear',
              }),
            ]),
          }),
        }),
      )
      expect(playCall).not.toHaveProperty('from')
      expect(playCall).not.toHaveProperty('to')
      expect(controller.playState).toBe('running')

      controller.finish()
      await vi.waitFor(() => {
        expect(animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({ targetKind: kind, type: 'finish' }),
        )
      })
      await vi.waitFor(() => {
        expect(controller.playState).toBe('finished')
      })
      expect(controller.playState).toBe('finished')
      expect(controller.finished).toBe(true)
      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          transform: expect.objectContaining({
            translate: expect.objectContaining({ x: 10 }),
          }),
        }),
      )

      controller.reset()
      await vi.waitFor(() => {
        expect(animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({
            targetKind: kind,
            type: 'reset',
            elementId: 'native-model',
            timeline: expect.objectContaining({
              duration: 1,
              tracks: expect.arrayContaining([
                expect.objectContaining({
                  property: 'transform.translate.x',
                }),
              ]),
            }),
          }),
        )
      })
      await vi.waitFor(() => {
        expect(controller.playState).toBe('idle')
        expect(controller.finished).toBe(false)
      })
      expect(values.at(-1)).toEqual(
        expect.objectContaining({
          transform: expect.objectContaining({
            translate: expect.objectContaining({ x: 0 }),
          }),
        }),
      )
      expect(controller.playState).toBe('idle')
      expect(controller.finished).toBe(false)
      expect(onReset).toHaveBeenCalledWith(
        expect.objectContaining({
          transform: expect.objectContaining({
            translate: expect.objectContaining({ x: 0 }),
          }),
        }),
      )

      controller.finish()
      await vi.waitFor(() => {
        expect(animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({
            targetKind: kind,
            type: 'finish',
            elementId: 'native-model',
            timeline: expect.objectContaining({
              duration: 1,
              tracks: expect.arrayContaining([
                expect.objectContaining({
                  property: 'transform.translate.x',
                }),
              ]),
            }),
          }),
        )
      })
      expect(values.at(-1)).toEqual(
        expect.objectContaining({
          transform: expect.objectContaining({
            translate: expect.objectContaining({ x: 10 }),
          }),
        }),
      )
      expect(controller.playState).toBe('finished')
      expect(controller.finished).toBe(true)
      expect(onComplete).toHaveBeenCalledTimes(2)
    },
  )

  test.each(['static3d', 'dynamic3d'] as const)(
    'idle %s reset and finish fall back to JS values when native returns no payload or fails',
    async kind => {
      const values: SpatializedVisualValues[] = []
      const onReset = vi.fn()
      const onComplete = vi.fn()

      const animateMotion = vi.fn(async (command: { type: string }) => {
        if (command.type === 'reset') return undefined
        if (command.type === 'finish') {
          throw new Error('native finish failed')
        }
        return undefined
      })

      const controller = new SpatializedMotionController(
        makeStatic3DConfig({ onReset, onComplete }),
        {
          forceNativePlayback: true,
          onValuesChange: v => values.push(v),
        },
      )
      controller.attachElement(null, kind)
      controller.attachElement({ id: 'native-model', animateMotion } as any)

      controller.reset()
      await vi.waitFor(() => {
        expect(animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({
            targetKind: kind,
            type: 'reset',
            elementId: 'native-model',
            timeline: expect.objectContaining({ duration: 1 }),
          }),
        )
      })
      expect(values.at(-1)).toEqual(
        expect.objectContaining({
          transform: expect.objectContaining({
            translate: expect.objectContaining({ x: 0 }),
          }),
        }),
      )
      expect(controller.playState).toBe('idle')
      expect(controller.finished).toBe(false)
      expect(onReset).toHaveBeenCalledWith(
        expect.objectContaining({
          transform: expect.objectContaining({
            translate: expect.objectContaining({ x: 0 }),
          }),
        }),
      )

      controller.finish()
      await vi.waitFor(() => {
        expect(animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({
            targetKind: kind,
            type: 'finish',
            elementId: 'native-model',
            timeline: expect.objectContaining({ duration: 1 }),
          }),
        )
      })
      await vi.waitFor(() => {
        expect(controller.playState).toBe('finished')
      })
      expect(values.at(-1)).toEqual(
        expect.objectContaining({
          transform: expect.objectContaining({
            translate: expect.objectContaining({ x: 10 }),
          }),
        }),
      )
      expect(controller.playState).toBe('finished')
      expect(controller.finished).toBe(true)
      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          transform: expect.objectContaining({
            translate: expect.objectContaining({ x: 10 }),
          }),
        }),
      )
    },
  )

  test('native stop remains unchanged for active sessions', async () => {
    const values: SpatializedVisualValues[] = []
    const onStop = vi.fn()
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
    const controller = new SpatializedMotionController(
      makeConfig({ autoStart: false, onStop }),
      {
        forceNativePlayback: true,
        onValuesChange: v => values.push(v),
      },
    )
    controller.attachElement(null, 'spatialized2d')
    controller.attachElement({ id: 'native-element', animateMotion } as any)

    controller.play()
    await vi.waitFor(() => {
      expect(animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ targetKind: 'spatialized2d', type: 'play' }),
      )
    })

    controller.stop()
    await vi.waitFor(() => {
      expect(animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ targetKind: 'spatialized2d', type: 'stop' }),
      )
      expect(controller.playState).toBe('idle')
    })
    const stopped = values.at(-1)!
    expect(stopped.opacity).toBe(0.4)
    expect(controller.finished).toBe(false)
    expect(onStop).toHaveBeenCalledWith(stopped)
  })

  test('native stop after pause uses the native frozen paused sample', async () => {
    vi.useFakeTimers()
    const values: SpatializedVisualValues[] = []
    const onStop = vi.fn()
    const animateMotion = vi.fn(async (command: { type: string }) => {
      if (command.type === 'play') {
        return {
          animationId: 'native-paused-stop',
          finished: new Promise<SpatializedVisualValues>(() => {}),
          canceled: new Promise<SpatializedVisualValues>(() => {}),
          failed: new Promise(() => {}),
        }
      }
      if (command.type === 'pause') return { opacity: 0.76 }
      if (command.type === 'stop') return { opacity: 0.76 }
      return undefined
    })
    const controller = new SpatializedMotionController(
      {
        duration: 2,
        autoStart: false,
        tracks: [
          {
            property: 'opacity',
            timingFunction: 'linear',
            keyframes: [
              { at: 0, value: 1 },
              { at: 2, value: 0.2 },
            ],
          },
        ],
        onStop,
      },
      {
        forceNativePlayback: true,
        onValuesChange: v => values.push(v),
      },
    )
    controller.attachElement(null, 'spatialized2d')
    controller.attachElement({ id: 'native-element', animateMotion } as any)

    try {
      controller.play()
      await vi.waitFor(() => {
        expect(animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({
            targetKind: 'spatialized2d',
            type: 'play',
          }),
        )
      })

      await vi.advanceTimersByTimeAsync(500)
      controller.pause()
      await vi.waitFor(() => {
        expect(animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({
            targetKind: 'spatialized2d',
            type: 'pause',
          }),
        )
        expect(controller.playState).toBe('paused')
      })
      const paused = values.at(-1)
      expect(paused?.opacity).toBeCloseTo(0.76, 5)

      await vi.advanceTimersByTimeAsync(1200)
      controller.stop()
      await vi.waitFor(() => {
        expect(animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({
            targetKind: 'spatialized2d',
            type: 'stop',
          }),
        )
        expect(controller.playState).toBe('idle')
      })

      const stopped = values.at(-1)
      expect(stopped?.opacity).toBeCloseTo(paused?.opacity ?? 0, 5)
      expect(onStop).toHaveBeenCalledWith(stopped)
    } finally {
      vi.useRealTimers()
    }
  })

  test('native finish -> updateConfig -> reset keeps using the finished session config', async () => {
    const values: SpatializedVisualValues[] = []
    const onReset = vi.fn()
    const onComplete = vi.fn()
    const configA = makeOpacityConfig(0.2, 0.8, { onReset, onComplete })
    const configB = makeOpacityConfig(0.4, 0.9, { onReset, onComplete })
    const animateMotion = vi.fn(async (command: { type: string }) => {
      if (command.type === 'play') {
        return {
          animationId: 'native-finished-config',
          finished: new Promise<SpatializedVisualValues>(() => {}),
          canceled: new Promise<SpatializedVisualValues>(() => {}),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })
    const controller = new SpatializedMotionController(configA, {
      forceNativePlayback: true,
      onValuesChange: v => values.push(v),
    })
    controller.attachElement(null, 'spatialized2d')
    controller.attachElement({ id: 'native-element', animateMotion } as any)

    controller.play()
    await vi.waitFor(() => {
      expect(animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ targetKind: 'spatialized2d', type: 'play' }),
      )
    })

    controller.finish()
    await vi.waitFor(() => {
      expect(controller.playState).toBe('finished')
    })
    expect(onComplete).toHaveBeenCalledWith({ opacity: 0.8 })

    controller.updateConfig(configB)
    controller.reset()
    await vi.waitFor(() => {
      expect(animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({
          targetKind: 'spatialized2d',
          type: 'reset',
          elementId: 'native-element',
          timeline: expect.objectContaining({
            tracks: expect.arrayContaining([
              expect.objectContaining({
                property: 'opacity',
                keyframes: expect.arrayContaining([
                  expect.objectContaining({ at: 0, value: 0.2 }),
                  expect.objectContaining({ at: 1, value: 0.8 }),
                ]),
              }),
            ]),
          }),
        }),
      )
    })
    expect(values.at(-1)).toEqual({ opacity: 0.2 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onReset).toHaveBeenCalledWith({ opacity: 0.2 })
  })

  test('native stop -> updateConfig -> reset keeps using the stopped session config', async () => {
    const values: SpatializedVisualValues[] = []
    const onReset = vi.fn()
    const onStop = vi.fn()
    const configA = makeOpacityConfig(0.2, 0.8, { onReset, onStop })
    const configB = makeOpacityConfig(0.4, 0.9, { onReset, onStop })
    const animateMotion = vi.fn(async (command: { type: string }) => {
      if (command.type === 'play') {
        return {
          animationId: 'native-stopped-config',
          finished: new Promise<SpatializedVisualValues>(() => {}),
          canceled: new Promise<SpatializedVisualValues>(() => {}),
          failed: new Promise(() => {}),
        }
      }
      if (command.type === 'stop') return { opacity: 0.2 }
      return undefined
    })
    const controller = new SpatializedMotionController(configA, {
      forceNativePlayback: true,
      onValuesChange: v => values.push(v),
    })
    controller.attachElement(null, 'spatialized2d')
    controller.attachElement({ id: 'native-element', animateMotion } as any)

    controller.play()
    await vi.waitFor(() => {
      expect(animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ targetKind: 'spatialized2d', type: 'play' }),
      )
    })

    controller.stop()
    await vi.waitFor(() => {
      expect(animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ targetKind: 'spatialized2d', type: 'stop' }),
      )
      expect(controller.playState).toBe('idle')
    })
    expect(onStop).toHaveBeenCalledWith({ opacity: 0.2 })

    controller.updateConfig(configB)
    controller.reset()
    await vi.waitFor(() => {
      expect(animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({
          targetKind: 'spatialized2d',
          type: 'reset',
          elementId: 'native-element',
          timeline: expect.objectContaining({
            tracks: expect.arrayContaining([
              expect.objectContaining({
                property: 'opacity',
                keyframes: expect.arrayContaining([
                  expect.objectContaining({ at: 0, value: 0.2 }),
                  expect.objectContaining({ at: 1, value: 0.8 }),
                ]),
              }),
            ]),
          }),
        }),
      )
    })
    expect(values.at(-1)).toEqual({ opacity: 0.2 })
    expect(controller.playState).toBe('idle')
    expect(controller.finished).toBe(false)
    expect(onReset).toHaveBeenCalledWith({ opacity: 0.2 })
  })
})

describe('SpatializedMotionController portal suppression timing', () => {
  test('spatialized2d keeps transform suppression from the active native session snapshot after updateConfig', async () => {
    const animateMotion = vi.fn(async (command: { type: string }) => {
      if (command.type === 'play') {
        return {
          animationId: 'native-snapshot-2d',
          finished: new Promise<SpatializedVisualValues>(() => {}),
          canceled: new Promise<SpatializedVisualValues>(() => {}),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })
    const controller = new SpatializedMotionController(makeTransformConfig(), {
      forceNativePlayback: true,
    })
    controller.attachElement(null, 'spatialized2d')
    controller.attachElement({ id: 'native-snapshot-2d', animateMotion } as any)

    controller.play()
    await vi.waitFor(() => {
      expect(animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'play',
          targetKind: 'spatialized2d',
        }),
      )
      expect(controller.playState).toBe('running')
    })

    controller.updateConfig(makeOpacityConfig(0, 1))

    expect(controller.getSuppressedFields()).toEqual(new Set(['transform']))
  })

  test('static3d keeps entityTransform suppression from the active native session snapshot after updateConfig', async () => {
    const animateMotion = vi.fn(async (command: { type: string }) => {
      if (command.type === 'play') {
        return {
          animationId: 'native-snapshot-3d',
          finished: new Promise<SpatializedVisualValues>(() => {}),
          canceled: new Promise<SpatializedVisualValues>(() => {}),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })
    const controller = new SpatializedMotionController(makeStatic3DConfig(), {
      forceNativePlayback: true,
    })
    controller.attachElement(null, 'static3d')
    controller.attachElement({ id: 'native-snapshot-3d', animateMotion } as any)

    controller.play()
    await vi.waitFor(() => {
      expect(animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'play',
          targetKind: 'static3d',
        }),
      )
      expect(controller.playState).toBe('running')
    })

    controller.updateConfig(makeOpacityConfig(0, 1))

    expect(controller.getSuppressedFields()).toEqual(
      new Set(['entityTransform']),
    )
  })

  test('native pause fallback sampling keeps using the active session snapshot after updateConfig', async () => {
    vi.useFakeTimers()
    const values: SpatializedVisualValues[] = []
    const animateMotion = vi.fn(async (command: { type: string }) => {
      if (command.type === 'play') {
        return {
          animationId: 'native-pause-snapshot',
          finished: new Promise<SpatializedVisualValues>(() => {}),
          canceled: new Promise<SpatializedVisualValues>(() => {}),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })
    const controller = new SpatializedMotionController(
      {
        duration: 2,
        autoStart: false,
        tracks: [
          {
            property: 'transform.translate.x',
            timingFunction: 'linear',
            keyframes: [
              { at: 0, value: 0 },
              { at: 2, value: 100 },
            ],
          },
        ],
      },
      {
        forceNativePlayback: true,
        onValuesChange: v => values.push(v),
      },
    )
    controller.attachElement(null, 'spatialized2d')
    controller.attachElement({
      id: 'native-pause-snapshot',
      animateMotion,
    } as any)

    try {
      controller.play()
      await vi.waitFor(() => {
        expect(animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'play',
            targetKind: 'spatialized2d',
          }),
        )
        expect(controller.playState).toBe('running')
      })

      await vi.advanceTimersByTimeAsync(500)
      controller.updateConfig(makeOpacityConfig(0, 1))
      controller.pause()
      await vi.waitFor(() => {
        expect(animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'pause',
            targetKind: 'spatialized2d',
          }),
        )
        expect(controller.playState).toBe('paused')
      })

      expect(values.at(-1)).toEqual(
        expect.objectContaining({
          transform: expect.objectContaining({
            translate: expect.objectContaining({
              x: expect.any(Number),
            }),
          }),
        }),
      )
      expect(values.at(-1)?.transform?.translate?.x).toBeGreaterThan(0)
      expect(values.at(-1)?.transform?.translate?.x).toBeLessThan(100)
      expect(values.at(-1)?.opacity).toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })

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
