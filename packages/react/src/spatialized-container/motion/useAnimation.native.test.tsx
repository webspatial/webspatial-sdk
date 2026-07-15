import React, { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('@webspatial/core-sdk', async () => {
  const actual = await vi.importActual('@webspatial/core-sdk')
  return {
    ...actual,
    supports: (name: string) => name === 'useAnimation',
  }
})

const { useAnimation } = await import('./useAnimation')
const { useBindSpatializedMotion } = await import('./useBindSpatializedMotion')

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

function createMockElement(
  id = 'motion-element-1',
  kind: 'spatialized2d' | 'static3d' | 'dynamic3d' = 'spatialized2d',
) {
  const animation = createMockAnimationObject(`${id}-animation`)
  return {
    id,
    kind,
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
      result.current[0].__setElement?.(element as any)
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
        from: { transform: { translate: { x: 0 } } },
        to: { transform: { translate: { x: 100 } } },
        timingFunction: 'linear',
      }),
    )

    await act(async () => {
      result.current[1].play()
    })
    expect(result.current[1].playState).toBe('queued')

    await act(async () => {
      result.current[0].__setElement?.(element as any)
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
        from: { transform: { translate: { x: 0 } } },
        to: { transform: { translate: { x: 100 } } },
        timingFunction: 'linear',
      }),
    )

    await act(async () => {
      result.current[1].finish()
    })

    expect(result.current[1].playState).toBe('queued')
    expect(result.current[1].finished).toBe(false)
    expect(element.animation.finish).not.toHaveBeenCalled()

    await act(async () => {
      result.current[0].__setElement?.(element as any)
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
          from: { opacity: 0 },
          to: { opacity: 1 },
        }),
      { wrapper },
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any)
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
        from: { opacity: 0 },
        to: { opacity: 1 },
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any)
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
        from: { transform: { translate: { x: 0 } } },
        to: { transform: { translate: { x: 100 } } },
        timingFunction: 'linear',
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any)
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
        from: { transform: { translate: { x: 0 } } },
        to: { transform: { translate: { x: 100 } } },
        timingFunction: 'linear',
        onComplete,
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any)
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
      result.current[0].__setElement?.(element as any)
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
        result.current[0].__setElement?.(element as any)
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
      const element = createMockElement(elementId, targetKind)

      const { result } = renderHook(() =>
        useAnimation({
          duration: 2,
          autoStart: false,
          from: { transform: { translate: { x: 0 } } },
          to: { transform: { translate: { x: 50 } } },
          timingFunction: 'linear',
        }),
      )

      await act(async () => {
        result.current[0].__setElement?.(element as any)
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
      kind: 'spatialized2d' as const,
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
          from: { transform: { translate: { x: 0 } } },
          to: { transform: { translate: { x: distance } } },
          timingFunction: 'linear',
        }),
      {
        initialProps: { distance: 100, duration: 5 },
      },
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any)
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
        from: { opacity: 0 },
        to: { opacity: 1 },
        onReset,
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any)
      result.current[1].play()
    })
    await waitFor(() => expect(element.animation.play).toHaveBeenCalled())

    await act(async () => {
      result.current[0].__onUnbind?.(element as any)
    })

    expect(element.animation.destroy).toHaveBeenCalledTimes(1)
    expect(onReset).not.toHaveBeenCalled()
  })

  test('__onUnbind ignores stale owners without detaching the active Core AnimationObject', async () => {
    const currentElement = createMockElement('current-owner')
    const staleElement = createMockElement('stale-owner')

    const { result } = renderHook(() =>
      useAnimation({
        duration: 1,
        autoStart: false,
        from: { opacity: 0 },
        to: { opacity: 1 },
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(currentElement as any)
      result.current[1].play()
    })
    await waitFor(() =>
      expect(currentElement.animation.play).toHaveBeenCalled(),
    )

    await act(async () => {
      result.current[0].__onUnbind?.(staleElement as any)
    })

    expect(currentElement.animation.destroy).not.toHaveBeenCalled()
    expect(result.current[1].playState).toBe('running')
  })

  test('__setElement(null) force-unbind still destroys the active Core AnimationObject', async () => {
    const element = createMockElement('force-unbind-null')

    const { result } = renderHook(() =>
      useAnimation({
        duration: 1,
        autoStart: false,
        from: { opacity: 0 },
        to: { opacity: 1 },
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any)
    })
    await waitFor(() => expect(element.createAnimation).toHaveBeenCalled())

    await act(async () => {
      result.current[0].__setElement?.(null)
    })

    expect(element.animation.destroy).toHaveBeenCalledTimes(1)
    expect(result.current[1].playState).toBe('idle')
  })

  test('destroy force-unbind still destroys the active Core AnimationObject', async () => {
    const element = createMockElement('force-unbind-destroy')

    const { result } = renderHook(() =>
      useAnimation({
        duration: 1,
        autoStart: false,
        from: { opacity: 0 },
        to: { opacity: 1 },
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any)
    })
    await waitFor(() => expect(element.createAnimation).toHaveBeenCalled())

    await act(async () => {
      const binding = result.current[0] as any
      binding.destroy()
    })

    expect(element.animation.destroy).toHaveBeenCalledTimes(1)
    expect(result.current[1].playState).toBe('idle')
  })

  test('switching xr-animation on the same host leaves the new binding active', async () => {
    const animationA = createMockAnimationObject('animation-a-object')
    const animationB = createMockAnimationObject('animation-b-object')
    const host = {
      id: 'same-host-switch',
      kind: 'spatialized2d' as const,
      createAnimation: vi
        .fn()
        .mockResolvedValueOnce(animationA)
        .mockResolvedValueOnce(animationB),
    }

    const { result, rerender } = renderHook(
      ({ active }: { active: 'a' | 'b' }) => {
        const [bindingA, apiA] = useAnimation({
          duration: 1,
          autoStart: false,
          from: { opacity: 0 },
          to: { opacity: 1 },
        })
        const [bindingB, apiB] = useAnimation({
          duration: 2,
          autoStart: false,
          from: { opacity: 1 },
          to: { opacity: 0 },
        })

        useBindSpatializedMotion({
          binding: active === 'a' ? bindingA : bindingB,
          element: host as any,
        })

        return { apiA, apiB }
      },
      {
        initialProps: { active: 'a' as 'a' | 'b' },
      },
    )

    await waitFor(() => expect(host.createAnimation).toHaveBeenCalledTimes(1))

    rerender({ active: 'b' })

    await waitFor(() => {
      expect(animationA.destroy).toHaveBeenCalledTimes(1)
      expect(host.createAnimation).toHaveBeenCalledTimes(2)
    })

    await act(async () => {
      result.current.apiB.play()
    })

    await waitFor(() => expect(animationB.play).toHaveBeenCalledTimes(1))
    expect(animationA.play).not.toHaveBeenCalled()
    expect(animationB.destroy).not.toHaveBeenCalled()
  })

  test('hook unmount destroys the active Core AnimationObject', async () => {
    const element = createMockElement('unmount-destroy')

    const { result, unmount } = renderHook(() =>
      useAnimation({
        duration: 1,
        autoStart: false,
        from: { opacity: 0 },
        to: { opacity: 1 },
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any)
    })
    await waitFor(() => expect(element.createAnimation).toHaveBeenCalled())

    unmount()

    await waitFor(() => {
      expect(element.animation.destroy).toHaveBeenCalledTimes(1)
    })
  })

  test('ignores late Core AnimationObject callbacks after hook unmount', async () => {
    const element = createMockElement('late-callback')
    const onComplete = vi.fn()

    const { result, unmount } = renderHook(() =>
      useAnimation({
        duration: 1,
        autoStart: false,
        from: { opacity: 0 },
        to: { opacity: 1 },
        onComplete,
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any)
    })
    await waitFor(() => expect(element.createAnimation).toHaveBeenCalled())

    unmount()
    await waitFor(() => {
      expect(element.animation.destroy).toHaveBeenCalledTimes(1)
    })

    act(() => {
      element.animation.emitComplete({ opacity: 1 })
    })

    expect(onComplete).not.toHaveBeenCalled()
  })

  test('resets queued state when Core AnimationObject creation fails', async () => {
    const onError = vi.fn()
    const element = {
      id: 'create-fail',
      kind: 'spatialized2d' as const,
      createAnimation: vi.fn(async () => {
        throw new Error('create failed')
      }),
    }

    const { result } = renderHook(() =>
      useAnimation({
        duration: 1,
        autoStart: false,
        from: { opacity: 0 },
        to: { opacity: 1 },
        onError,
      }),
    )

    act(() => {
      result.current[1].play()
    })
    expect(result.current[1].playState).toBe('queued')

    await act(async () => {
      result.current[0].__setElement?.(element as any)
    })

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith({
        command: 'create',
        reason: 'create failed',
      }),
    )
    expect(result.current[1].playState).toBe('idle')
    expect(result.current[1].isAnimating).toBe(false)
  })

  test('reports a direct Core control failure exactly once', async () => {
    const onError = vi.fn()
    const element = createMockElement('direct-control-fail')
    const error = {
      command: 'play',
      reason: 'play failed',
    }
    element.animation.play.mockImplementationOnce(async () => {
      throw new Error(error.reason)
    })

    const { result } = renderHook(() =>
      useAnimation({
        duration: 1,
        autoStart: false,
        from: { opacity: 0 },
        to: { opacity: 1 },
        onError,
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any)
    })
    await waitFor(() =>
      expect(element.animation.setCallbacks).toHaveBeenCalled(),
    )

    act(() => result.current[1].play())

    await waitFor(() => expect(onError).toHaveBeenCalledWith(error))
    await flushPromises()
    expect(onError).toHaveBeenCalledTimes(1)
  })

  test('reports a queued Core control failure exactly once', async () => {
    const onError = vi.fn()
    const element = createMockElement('queued-control-fail')
    const error = {
      command: 'play',
      reason: 'queued play failed',
    }
    element.animation.play.mockImplementationOnce(async () => {
      throw new Error(error.reason)
    })

    const { result } = renderHook(() =>
      useAnimation({
        duration: 1,
        autoStart: false,
        from: { opacity: 0 },
        to: { opacity: 1 },
        onError,
      }),
    )

    act(() => result.current[1].play())
    await act(async () => {
      result.current[0].__setElement?.(element as any)
    })

    await waitFor(() => expect(onError).toHaveBeenCalledWith(error))
    await flushPromises()
    expect(onError).toHaveBeenCalledTimes(1)
  })

  test('reports an autoStart Core control failure exactly once', async () => {
    const onError = vi.fn()
    const element = createMockElement('autostart-control-fail')
    const error = {
      command: 'play',
      reason: 'autoStart play failed',
    }
    element.animation.play.mockImplementationOnce(async () => {
      throw new Error(error.reason)
    })

    const { result } = renderHook(() =>
      useAnimation({
        duration: 1,
        from: { opacity: 0 },
        to: { opacity: 1 },
        onError,
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any)
    })

    await waitFor(() => expect(onError).toHaveBeenCalledWith(error))
    await flushPromises()
    expect(onError).toHaveBeenCalledTimes(1)
  })

  test('flushes pending commands sequentially after Core AnimationObject creation', async () => {
    let resolvePlay: (() => void) | undefined
    const animation = createMockAnimationObject('sequential-animation')
    animation.play.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolvePlay = resolve
        }),
    )
    const element = {
      id: 'sequential-element',
      kind: 'spatialized2d' as const,
      animation,
      createAnimation: vi.fn(async () => animation),
    }

    const { result } = renderHook(() =>
      useAnimation({
        duration: 1,
        autoStart: false,
        from: { opacity: 0 },
        to: { opacity: 1 },
      }),
    )

    act(() => {
      result.current[1].play()
      result.current[1].stop()
    })

    await act(async () => {
      result.current[0].__setElement?.(element as any)
    })

    await waitFor(() => expect(animation.play).toHaveBeenCalledTimes(1))
    expect(animation.stop).not.toHaveBeenCalled()

    await act(async () => {
      resolvePlay?.()
      await Promise.resolve()
    })

    await waitFor(() => expect(animation.stop).toHaveBeenCalledTimes(1))
  })

  test('static3d opacity creates a Core AnimationObject and forwards the track', () => {
    const element = createMockElement('static-opacity', 'static3d')

    const { result } = renderHook(() =>
      useAnimation({
        duration: 1,
        autoStart: false,
        from: { opacity: 0 },
        to: { opacity: 1 },
      }),
    )

    act(() => {
      result.current[0].__setElement?.(element as any)
    })
    expect(element.createAnimation).toHaveBeenCalledTimes(1)
  })

  test('static3d opacity track updates the container-root opacity style outlet', async () => {
    const element = createMockElement('static-root-opacity', 'static3d')

    const { result } = renderHook(() =>
      useAnimation({
        duration: 1,
        autoStart: false,
        from: { opacity: 0 },
        to: { opacity: 1 },
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any)
    })

    await waitFor(() =>
      expect(element.createAnimation).toHaveBeenCalledTimes(1),
    )
    expect(element.createAnimation).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { opacity: 0 },
        to: { opacity: 1 },
      }),
    )
    expect(result.current[2].opacity).toBeUndefined()
    expect(result.current[2].transform).toBeUndefined()

    await act(async () => {
      element.animation.emitValues({ opacity: 0.35 })
    })

    expect(result.current[2].opacity).toBe(0.35)
    expect(result.current[2].transform).toBeUndefined()
  })
})
