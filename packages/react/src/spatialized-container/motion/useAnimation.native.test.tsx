import React, { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('@webspatial/core-sdk', async () => {
  const actual = await vi.importActual('@webspatial/core-sdk')
  return {
    ...actual,
    supports: (name: string, tokens?: readonly string[]) =>
      name === 'useAnimation' && !!tokens?.some(token => token === 'element'),
  }
})

const { useAnimation } = await import('./useAnimation')

function createMockElement(id = 'motion-element-1') {
  const animateMotion = vi.fn().mockImplementation(async (cmd: any) => {
    if (cmd.type === 'play') {
      return {
        animationId: cmd.animationId,
        finished: new Promise(() => {}),
        canceled: new Promise(() => {}),
        failed: new Promise(() => {}),
      }
    }
    return undefined
  })
  return {
    id,
    animateMotion,
    /** Legacy alias; motion bridge uses {@link animateMotion}. */
    animateSpatialDiv: animateMotion,
    cleanupSpatialDivAnimationListeners: vi.fn(),
  }
}

async function flushPromises() {
  await act(async () => {
    await new Promise(r => setTimeout(r, 0))
  })
}

function getPlayCalls(element: ReturnType<typeof createMockElement>) {
  return element.animateMotion.mock.calls
    .map(([cmd]) => cmd)
    .filter((cmd: { type: string }) => cmd.type === 'play')
}

describe('useAnimation tuple api native backend', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('uses native spatialized2d motion capability without legacy element token', async () => {
    const element = createMockElement()

    const { result } = renderHook(() =>
      useAnimation({
        duration: 5,
        from: {
          opacity: 0,
          transform: { translate: { x: 0 } },
        },
        to: {
          opacity: 1,
          transform: { translate: { x: 100 } },
        },
        timingFunction: 'linear',
        delay: 0.25,
        loop: { reverse: true },
        playbackRate: 1.5,
        autoStart: false,
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any, 'spatialized2d')
      result.current[1].play()
    })
    await waitFor(() => {
      expect(element.animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'play',
          targetKind: 'spatialized2d',
        }),
      )
    })
    const playCall = element.animateMotion.mock.calls.find(
      ([cmd]) => cmd.type === 'play',
    )?.[0]
    expect(playCall).toEqual(
      expect.objectContaining({
        type: 'play',
        targetKind: 'spatialized2d',
        timeline: expect.objectContaining({
          duration: 5,
          delay: 0.25,
          loop: { reverse: true },
          playbackRate: 1.5,
          tracks: expect.arrayContaining([
            expect.objectContaining({
              property: 'opacity',
            }),
            expect.objectContaining({
              property: 'transform.translate.x',
            }),
          ]),
        }),
      }),
    )
    expect(playCall).not.toHaveProperty('from')
    expect(playCall).not.toHaveProperty('to')
    expect(playCall).not.toHaveProperty('delay')
    expect(playCall).not.toHaveProperty('loop')
    expect(playCall).not.toHaveProperty('playbackRate')
  })

  test('pre-bind play queues until the target resolves', async () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame')
    const element = createMockElement()

    const { result } = renderHook(() =>
      useAnimation({
        duration: 5,
        autoStart: false,
        tracks: [
          {
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 5, value: 100 },
            ],
            timingFunction: 'linear',
          },
          {
            property: 'opacity',
            keyframes: [
              { at: 3, value: 0 },
              { at: 5, value: 1 },
            ],
            timingFunction: 'easeOut',
          },
        ],
      }),
    )

    await act(async () => {
      result.current[1].play()
    })
    expect(result.current[1].playState).toBe('queued')

    await act(async () => {
      result.current[0].__setElement?.(element as any, 'spatialized2d')
    })
    await waitFor(() => {
      expect(element.animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'play' }),
      )
    })

    const playCalls = element.animateMotion.mock.calls.filter(
      ([cmd]) => cmd.type === 'play',
    )
    expect(playCalls).toHaveLength(1)
    expect(playCalls[0][0]).toEqual(
      expect.objectContaining({
        type: 'play',
        targetKind: 'spatialized2d',
        elementId: element.id,
        timeline: expect.objectContaining({
          duration: 5,
          tracks: expect.arrayContaining([
            expect.objectContaining({ property: 'transform.translate.x' }),
          ]),
        }),
      }),
    )
    expect(playCalls[0][0]).not.toHaveProperty('from')
    expect(playCalls[0][0]).not.toHaveProperty('to')
    expect(rafSpy).not.toHaveBeenCalled()
  })

  test('StrictMode bind triggers native play only once', async () => {
    const element = createMockElement('strict-native')
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StrictMode>{children}</StrictMode>
    )

    const { result } = renderHook(
      () =>
        useAnimation({
          duration: 1,
          tracks: [
            {
              property: 'opacity',
              keyframes: [
                { at: 0, value: 0 },
                { at: 1, value: 1 },
              ],
            },
          ],
        }),
      { wrapper },
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any, 'spatialized2d')
    })

    await waitFor(() => {
      expect(
        element.animateMotion.mock.calls.filter(([cmd]) => cmd.type === 'play'),
      ).toHaveLength(1)
    })
  })

  test('native pause syncs style to timeline sample at elapsed progress', async () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    const element = createMockElement()

    const { result } = renderHook(() =>
      useAnimation({
        duration: 5,
        autoStart: false,
        tracks: [
          {
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 5, value: 100 },
            ],
            timingFunction: 'linear',
          },
        ],
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any, 'spatialized2d')
      result.current[1].play()
    })
    await waitFor(() => {
      expect(element.animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'play' }),
      )
    })

    now = 1500

    await act(async () => {
      result.current[1].pause()
    })
    await flushPromises()

    expect(result.current[2].transform).toBeUndefined()
  })

  test('native pause prefers bridge-reported values over wall-clock estimate', async () => {
    const element = createMockElement()
    element.animateMotion.mockImplementation(async (cmd: any) => {
      if (cmd.type === 'play') {
        return {
          animationId: cmd.animationId,
          finished: new Promise(() => {}),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      if (cmd.type === 'pause') {
        return { transform: { translate: { x: 42 } } }
      }
      return undefined
    })

    const { result } = renderHook(() =>
      useAnimation({
        duration: 5,
        autoStart: false,
        tracks: [
          {
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 5, value: 100 },
            ],
            timingFunction: 'linear',
          },
        ],
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any, 'spatialized2d')
      result.current[1].play()
    })
    await flushPromises()

    await act(async () => {
      result.current[1].pause()
    })
    await flushPromises()

    expect(result.current[2].transform).toBeUndefined()
  })

  test('native onComplete applies finalValues to style', async () => {
    let resolveFinished!: (v: {
      transform?: { translate?: { x?: number } }
    }) => void
    const element = createMockElement()
    element.animateMotion.mockImplementation(async (cmd: any) => {
      if (cmd.type === 'play') {
        return {
          animationId: cmd.animationId,
          finished: new Promise(r => {
            resolveFinished = r
          }),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })

    const onComplete = vi.fn()
    const { result } = renderHook(() =>
      useAnimation({
        duration: 5,
        autoStart: false,
        tracks: [
          {
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 5, value: 100 },
            ],
            timingFunction: 'linear',
          },
        ],
        onComplete,
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any, 'spatialized2d')
      result.current[1].play()
    })
    await waitFor(() => {
      expect(element.animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'play' }),
      )
    })

    await act(async () => {
      resolveFinished({ transform: { translate: { x: 99 } } })
    })
    await flushPromises()

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: { translate: { x: 99 } },
      }),
    )
    expect(String(result.current[2].transform)).toContain('translate3d(99px')
  })

  test('native-capable spatialized2d masks opacity and transform while native playback is active', async () => {
    const element = createMockElement()

    const { result } = renderHook(() =>
      useAnimation({
        duration: 5,
        autoStart: false,
        from: {
          opacity: 0,
          transform: { translate: { x: 0 } },
        },
        to: {
          opacity: 1,
          transform: { translate: { x: 100 } },
        },
        timingFunction: 'linear',
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any, 'spatialized2d')
      result.current[1].play()
    })
    await waitFor(() => {
      expect(element.animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'play' }),
      )
    })

    expect(result.current[2].opacity).toBeUndefined()
    expect(result.current[2].transform).toBeUndefined()
  })

  test.each([
    ['stop', { opacity: 0.5 }, 'idle'],
    ['reset', { opacity: 1 }, 'idle'],
    ['finish', { opacity: 0.2 }, 'finished'],
  ] as const)(
    'explicit authored opacity wins terminal %s handoff on native spatialized2d',
    async (command, terminalValue, expectedPlayState) => {
      const element = createMockElement(`authored-${command}`)
      element.animateMotion = vi.fn().mockImplementation(async (cmd: any) => {
        if (cmd.type === 'play') {
          return {
            animationId: cmd.animationId,
            finished: new Promise(() => {}),
            canceled: new Promise(() => {}),
            failed: new Promise(() => {}),
          }
        }
        if (cmd.type === command) {
          return terminalValue
        }
        return undefined
      })

      const { result } = renderHook(() =>
        useAnimation({
          duration: 2,
          autoStart: false,
          from: { opacity: 1 },
          to: { opacity: 0.2 },
          timingFunction: 'linear',
        }),
      )

      await act(async () => {
        ;(result.current[0] as any).__setExplicitStyleOpacity?.(0.8)
        result.current[0].__setElement?.(element as any, 'spatialized2d')
        result.current[1].play()
      })
      await waitFor(() => {
        expect(element.animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'play' }),
        )
      })

      await act(async () => {
        result.current[1][command]()
      })
      await flushPromises()

      expect(result.current[1].playState).toBe(expectedPlayState)
      expect(result.current[2].opacity).toBe(0.8)
    },
  )

  test.each([
    ['stop', { opacity: 0.5 }, 'idle'],
    ['reset', { opacity: 1 }, 'idle'],
    ['finish', { opacity: 0.2 }, 'finished'],
  ] as const)(
    'native terminal %s handoff omits inner DOM opacity when no explicit authored opacity exists',
    async (command, terminalValue, expectedPlayState) => {
      const element = createMockElement(`native-owned-${command}`)
      element.animateMotion = vi.fn().mockImplementation(async (cmd: any) => {
        if (cmd.type === 'play') {
          return {
            animationId: cmd.animationId,
            finished: new Promise(() => {}),
            canceled: new Promise(() => {}),
            failed: new Promise(() => {}),
          }
        }
        if (cmd.type === command) {
          return terminalValue
        }
        return undefined
      })

      const { result } = renderHook(() =>
        useAnimation({
          duration: 2,
          autoStart: false,
          from: { opacity: 1 },
          to: { opacity: 0.2 },
          timingFunction: 'linear',
        }),
      )

      await act(async () => {
        result.current[0].__setElement?.(element as any, 'spatialized2d')
        result.current[1].play()
      })
      await waitFor(() => {
        expect(element.animateMotion).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'play' }),
        )
      })

      await act(async () => {
        result.current[1][command]()
      })
      await flushPromises()

      expect(result.current[1].playState).toBe(expectedPlayState)
      expect(result.current[2].opacity).toBeUndefined()
    },
  )

  test('runtime config update snapshots the active native session and applies on the next play', async () => {
    const element = createMockElement('native-config-snapshot')

    const { result, rerender } = renderHook(
      ({ distance, duration }) =>
        useAnimation({
          duration,
          autoStart: false,
          tracks: [
            {
              property: 'transform.translate.x',
              keyframes: [
                { at: 0, value: 0 },
                { at: duration, value: distance },
              ],
              timingFunction: 'linear',
            },
          ],
        }),
      {
        initialProps: { distance: 100, duration: 5 },
      },
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any, 'spatialized2d')
      result.current[1].play()
    })
    await waitFor(() => {
      expect(getPlayCalls(element)).toHaveLength(1)
    })

    const firstPlay = getPlayCalls(element)[0]
    expect(firstPlay.timeline).toEqual(
      expect.objectContaining({
        duration: 5,
        tracks: expect.arrayContaining([
          expect.objectContaining({
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 5, value: 100 },
            ],
          }),
        ]),
      }),
    )

    rerender({ distance: 200, duration: 10 })
    await flushPromises()

    expect(getPlayCalls(element)).toHaveLength(1)
    expect(firstPlay.timeline).toEqual(
      expect.objectContaining({
        duration: 5,
        tracks: expect.arrayContaining([
          expect.objectContaining({
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 5, value: 100 },
            ],
          }),
        ]),
      }),
    )

    await act(async () => {
      result.current[1].stop()
    })
    await flushPromises()

    await act(async () => {
      result.current[1].play()
    })
    await waitFor(() => {
      expect(getPlayCalls(element)).toHaveLength(2)
    })

    const secondPlay = getPlayCalls(element)[1]
    expect(secondPlay.timeline).toEqual(
      expect.objectContaining({
        duration: 10,
        tracks: expect.arrayContaining([
          expect.objectContaining({
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 10, value: 200 },
            ],
          }),
        ]),
      }),
    )
  })

  test('__onUnbind does not invoke onReset', async () => {
    const element = createMockElement()
    const onReset = vi.fn()

    const { result } = renderHook(() =>
      useAnimation({
        duration: 1,
        autoStart: false,
        tracks: [
          {
            property: 'opacity',
            keyframes: [
              { at: 0, value: 0 },
              { at: 1, value: 1 },
            ],
          },
        ],
        onReset,
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any, 'spatialized2d')
      result.current[1].play()
    })
    await waitFor(() => {
      expect(element.animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'play' }),
      )
    })

    await act(async () => {
      result.current[0].__onUnbind?.()
    })
    await waitFor(() => {
      expect(element.animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cancel',
          targetKind: 'spatialized2d',
        }),
      )
    })

    expect(onReset).not.toHaveBeenCalled()
  })
})
