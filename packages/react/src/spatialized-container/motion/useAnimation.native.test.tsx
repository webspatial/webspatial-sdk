import React, { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('@webspatial/core-sdk', async () => {
  const actual = await vi.importActual('@webspatial/core-sdk')
  return {
    ...actual,
    supports: (name: string, tokens?: readonly string[]) =>
      name === 'useAnimation' &&
      !!tokens?.some(token =>
        ['element', 'static3d', 'dynamic3d'].includes(token),
      ),
  }
})

const { useAnimation } = await import('./useAnimation')

type AnimationCallbacks = {
  onComplete?: (values?: any) => void
  onError?: (error: any) => void
  onReset?: () => void
  onStart?: () => void
  onStateChange?: (state?: any) => void
  onStop?: () => void
  onValuesChange?: (values: any) => void
}

function createMockAnimationObject(id = 'animation-object-1') {
  let callbacks: AnimationCallbacks = {}
  const state = {
    playState: 'idle',
    isAnimating: false,
    isPaused: false,
    finished: false,
  }
  const setState = (patch: Partial<typeof state>) => {
    Object.assign(state, patch)
    callbacks.onStateChange?.({ ...state })
  }
  const object = {
    id,
    setCallbacks: vi.fn((nextCallbacks: AnimationCallbacks) => {
      callbacks = nextCallbacks
    }),
    destroy: vi.fn(async () => undefined),
    play: vi.fn(async () => {
      setState({
        playState: 'running',
        isAnimating: true,
        isPaused: false,
        finished: false,
      })
      callbacks.onStart?.()
    }),
    pause: vi.fn(async () => {
      setState({
        playState: 'paused',
        isAnimating: false,
        isPaused: true,
        finished: false,
      })
    }),
    resume: vi.fn(async () => {
      setState({
        playState: 'running',
        isAnimating: true,
        isPaused: false,
        finished: false,
      })
    }),
    stop: vi.fn(async () => {
      setState({
        playState: 'idle',
        isAnimating: false,
        isPaused: false,
        finished: false,
      })
      callbacks.onStop?.()
    }),
    reset: vi.fn(async () => {
      setState({
        playState: 'idle',
        isAnimating: false,
        isPaused: false,
        finished: false,
      })
      callbacks.onReset?.()
    }),
    finish: vi.fn(async () => {
      setState({
        playState: 'finished',
        isAnimating: false,
        isPaused: false,
        finished: true,
      })
      callbacks.onComplete?.()
    }),
    emitState: (patch: Partial<typeof state>) => setState(patch),
    emitValues: (values: any) => callbacks.onValuesChange?.(values),
    emitComplete: (values: any) => {
      callbacks.onValuesChange?.(values)
      callbacks.onComplete?.(values)
      setState({
        playState: 'finished',
        isAnimating: false,
        isPaused: false,
        finished: true,
      })
    },
    get playState() {
      return state.playState
    },
    get isAnimating() {
      return state.isAnimating
    },
    get isPaused() {
      return state.isPaused
    },
    get finished() {
      return state.finished
    },
  }
  return object
}

function createMockElement(id = 'motion-element-1') {
  const animation = createMockAnimationObject(`${id}-animation`)
  return {
    id,
    animation,
    createAnimation: vi.fn(async () => animation),
  }
}

async function flushPromises() {
  await act(async () => {
    await new Promise(r => setTimeout(r, 0))
  })
}

describe('useAnimation tuple api native backend', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('creates a Core AnimationObject on concrete target bind', async () => {
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
    })

    await waitFor(() => {
      expect(element.createAnimation).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 5,
          delay: 0.25,
          loop: { reverse: true },
          playbackRate: 1.5,
        }),
      )
    })
    expect(element.animation.setCallbacks).toHaveBeenCalled()
    expect(element.animation.play).not.toHaveBeenCalled()
  })

  test('pre-bind play queues until Core AnimationObject is created', async () => {
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
      expect(element.animation.play).toHaveBeenCalledTimes(1)
    })
    expect(rafSpy).not.toHaveBeenCalled()
  })

  test('pre-bind finish stays queued until native confirms the finished state', async () => {
    const element = createMockElement('pre-bind-finish')

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
      result.current[1].finish()
    })

    expect(result.current[1].playState).toBe('queued')
    expect(result.current[1].finished).toBe(false)
    expect(element.animation.finish).not.toHaveBeenCalled()

    await act(async () => {
      result.current[0].__setElement?.(element as any, 'spatialized2d')
    })

    await waitFor(() => {
      expect(element.animation.finish).toHaveBeenCalledTimes(1)
    })
    expect(result.current[1].playState).toBe('finished')
    expect(result.current[1].finished).toBe(true)
  })

  test('StrictMode bind creates one Core AnimationObject and plays once', async () => {
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
      expect(element.createAnimation).toHaveBeenCalledTimes(1)
      expect(element.animation.play).toHaveBeenCalledTimes(1)
    })
  })

  test('PlaybackApi mirrors Core AnimationObject state callbacks', async () => {
    const element = createMockElement('state-sync')

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
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any, 'spatialized2d')
    })
    await waitFor(() => expect(element.createAnimation).toHaveBeenCalled())

    await act(async () => {
      element.animation.emitState({
        playState: 'running',
        isAnimating: true,
        isPaused: false,
        finished: false,
      })
    })

    expect(result.current[1].playState).toBe('running')
    expect(result.current[1].isAnimating).toBe(true)
    expect(result.current[1].isPaused).toBe(false)
    expect(result.current[1].finished).toBe(false)

    await act(async () => {
      element.animation.emitState({
        playState: 'finished',
        isAnimating: false,
        isPaused: false,
        finished: true,
      })
    })

    expect(result.current[1].playState).toBe('finished')
    expect(result.current[1].isAnimating).toBe(false)
    expect(result.current[1].finished).toBe(true)
  })

  test('native onValuesChange drives React style while playback state comes from Core object', async () => {
    const element = createMockElement('values-sync')

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
    await waitFor(() => expect(element.animation.play).toHaveBeenCalled())

    await act(async () => {
      element.animation.emitValues({ transform: { translate: { x: 42 } } })
    })

    expect(String(result.current[2].transform)).toContain(
      'translate3d(42px, 0px, 0px)',
    )
    expect(result.current[1].playState).toBe('running')
  })

  test('native onComplete callback receives Core AnimationObject final values', async () => {
    const element = createMockElement('complete-values')
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
    await waitFor(() => expect(element.animation.play).toHaveBeenCalled())

    await act(async () => {
      element.animation.emitComplete({ transform: { translate: { x: 99 } } })
    })

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: { translate: { x: 99 } },
      }),
    )
    expect(result.current[1].playState).toBe('finished')
  })

  test('native-capable spatialized2d exposes native-driven opacity and transform through style', async () => {
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
    await waitFor(() => expect(element.animation.play).toHaveBeenCalled())

    await act(async () => {
      element.animation.emitValues({
        opacity: 0.6,
        transform: { translate: { x: 18, y: 4, z: 2 } },
      })
    })

    expect(result.current[2].opacity).toBe(0.6)
    expect(String(result.current[2].transform)).toContain(
      'translate3d(18px, 4px, 2px)',
    )
  })

  test.each([
    ['stop', 'idle'],
    ['reset', 'idle'],
    ['finish', 'finished'],
  ] as const)(
    'native-backed spatialized2d keeps the latest native style after %s',
    async (command, expectedPlayState) => {
      const element = createMockElement(`native-empty-${command}`)

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
      await waitFor(() => expect(element.animation.play).toHaveBeenCalled())

      await act(async () => {
        element.animation.emitValues({
          opacity: 0.4,
          transform: { translate: { x: 15 } },
        })
      })

      await act(async () => {
        result.current[1][command]()
      })
      await flushPromises()

      expect(result.current[1].playState).toBe(expectedPlayState)
      expect(result.current[2].opacity).toBe(0.4)
      expect(String(result.current[2].transform)).toContain(
        'translate3d(15px, 0px, 0px)',
      )
    },
  )

  test.each([
    ['static3d', 'static3d-values'],
    ['dynamic3d', 'dynamic3d-values'],
  ] as const)(
    'native %s emits values that update the React style outlet',
    async (targetKind, elementId) => {
      const element = createMockElement(elementId)

      const { result } = renderHook(() =>
        useAnimation({
          duration: 2,
          autoStart: false,
          tracks: [
            {
              property: 'transform.translate.x',
              keyframes: [
                { at: 0, value: 0 },
                { at: 2, value: 50 },
              ],
              timingFunction: 'linear',
            },
          ],
        }),
      )

      await act(async () => {
        result.current[0].__setElement?.(element as any, targetKind)
      })
      await waitFor(() => expect(element.createAnimation).toHaveBeenCalled())

      await act(async () => {
        element.animation.emitValues({
          opacity: 0.75,
          transform: { translate: { x: 24, y: 6, z: 3 } },
        })
      })

      expect(result.current[2].opacity).toBe(0.75)
      expect(String(result.current[2].transform)).toContain(
        'translate3d(24px, 6px, 3px)',
      )
    },
  )

  test('config signature change destroys and recreates the Core AnimationObject', async () => {
    const firstAnimation = createMockAnimationObject('native-config-first')
    const secondAnimation = createMockAnimationObject('native-config-second')
    const element = {
      id: 'native-config-snapshot',
      createAnimation: vi
        .fn()
        .mockResolvedValueOnce(firstAnimation)
        .mockResolvedValueOnce(secondAnimation),
    }

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
    })
    await waitFor(() =>
      expect(element.createAnimation).toHaveBeenCalledTimes(1),
    )

    rerender({ distance: 200, duration: 10 })

    await waitFor(() => {
      expect(firstAnimation.destroy).toHaveBeenCalledTimes(1)
      expect(element.createAnimation).toHaveBeenCalledTimes(2)
    })

    expect(secondAnimation.setCallbacks).toHaveBeenCalled()
  })

  test('__onUnbind destroys the active Core AnimationObject without invoking onReset', async () => {
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
    await waitFor(() => expect(element.animation.play).toHaveBeenCalled())

    await act(async () => {
      result.current[0].__onUnbind?.()
    })

    expect(element.animation.destroy).toHaveBeenCalledTimes(1)
    expect(onReset).not.toHaveBeenCalled()
  })

  test('hook unmount destroys the active Core AnimationObject', async () => {
    const element = createMockElement('unmount-destroy')

    const { result, unmount } = renderHook(() =>
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
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any, 'spatialized2d')
    })
    await waitFor(() => expect(element.createAnimation).toHaveBeenCalled())

    unmount()

    await waitFor(() => {
      expect(element.animation.destroy).toHaveBeenCalledTimes(1)
    })
  })

  test('static3d opacity is rejected before Core AnimationObject creation', () => {
    const element = createMockElement('static-opacity')

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
      }),
    )

    expect(() => {
      result.current[0].__setElement?.(element as any, 'static3d')
    }).toThrow(/opacity/i)
    expect(element.createAnimation).not.toHaveBeenCalled()
  })
})