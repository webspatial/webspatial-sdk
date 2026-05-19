import { describe, expect, test, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock supports to enable SpatialDiv animation
vi.mock('@webspatial/core-sdk', async () => {
  const actual = await vi.importActual('@webspatial/core-sdk')
  return {
    ...actual,
    supports: (name: string, tokens?: readonly string[]) => {
      if (name === 'useAnimation' && tokens && tokens.includes('element'))
        return true
      return false
    },
  }
})

const { useSpatialDivAnimation } = await import('./useSpatialDivAnimation')

// Helper: create a mock Spatialized2DElement
function createMockElement() {
  let completedHandler: ((data: any) => void) | null = null
  let canceledHandler: ((data: any) => void) | null = null
  let failedHandler: ((data: any) => void) | null = null

  const element = {
    id: 'test-element-1',
    animateSpatialDiv: vi.fn().mockImplementation(async (cmd: any) => {
      if (cmd.type === 'play') {
        // Return result object with promise resolvers
        return {
          animationId: cmd.animationId,
          finished: new Promise<any>(resolve => {
            completedHandler = resolve
          }),
          canceled: new Promise<any>(resolve => {
            canceledHandler = resolve
          }),
          failed: new Promise<any>(resolve => {
            failedHandler = resolve
          }),
        }
      }
      // pause/resume/cancel return void
      return undefined
    }),
    cleanupSpatialDivAnimationListeners: vi.fn(),
  }

  return {
    element,
    triggerCompleted: (values: any) => completedHandler?.(values),
    triggerCanceled: (values: any) => canceledHandler?.(values),
    triggerFailed: (error: any) => failedHandler?.(error),
  }
}

async function flushPromises() {
  await act(async () => {
    await new Promise(r => setTimeout(r, 0))
  })
}

describe('SpatialDiv Animation State Machine', () => {
  const baseConfig = {
    to: { opacity: 1 } as const,
    from: { opacity: 0 } as const,
    duration: 1.0,
    autoStart: false,
  }

  test('initial state is idle', () => {
    const { result } = renderHook(() =>
      useSpatialDivAnimation(baseConfig, true),
    )
    const [, api] = result.current
    expect(api.isAnimating).toBe(false)
    expect(api.isPaused).toBe(false)
    expect(api.playState).toBe('idle')
    expect(api.finished).toBe(false)
  })

  test('play before bind → queued state', async () => {
    const { result } = renderHook(() =>
      useSpatialDivAnimation(baseConfig, true),
    )
    const [, api] = result.current

    await act(async () => {
      api.play()
    })
    await flushPromises()

    expect(api.isAnimating).toBe(true)
    expect(api.isPaused).toBe(false)
    expect(api.playState).toBe('queued')
    expect(api.finished).toBe(false)
  })

  test('play after bind → running state', async () => {
    const mock = createMockElement()
    const { result } = renderHook(() =>
      useSpatialDivAnimation(baseConfig, true),
    )
    const [animatedProps, api] = result.current

    // Simulate element binding
    await act(async () => {
      ;(animatedProps as any).__setElement(mock.element)
    })

    await act(async () => {
      api.play()
    })
    await flushPromises()

    expect(api.isAnimating).toBe(true)
    expect(api.isPaused).toBe(false)
    expect(api.playState).toBe('running')
    expect(api.finished).toBe(false)
  })

  test('pause during running → paused state', async () => {
    const mock = createMockElement()
    const { result } = renderHook(() =>
      useSpatialDivAnimation(baseConfig, true),
    )
    const [animatedProps, api] = result.current

    await act(async () => {
      ;(animatedProps as any).__setElement(mock.element)
    })

    await act(async () => {
      api.play()
    })
    await flushPromises()
    expect(api.playState).toBe('running')

    await act(async () => {
      api.pause()
    })
    await flushPromises()

    expect(api.isAnimating).toBe(false)
    expect(api.isPaused).toBe(true)
    expect(api.playState).toBe('paused')
    expect(api.finished).toBe(false)
  })

  test('play while paused → resumes to running', async () => {
    const mock = createMockElement()
    const { result } = renderHook(() =>
      useSpatialDivAnimation(baseConfig, true),
    )
    const [animatedProps, api] = result.current

    await act(async () => {
      ;(animatedProps as any).__setElement(mock.element)
    })

    // play → pause → play (resume)
    await act(async () => {
      api.play()
    })
    await flushPromises()

    await act(async () => {
      api.pause()
    })
    await flushPromises()
    expect(api.playState).toBe('paused')

    await act(async () => {
      api.play()
    })
    await flushPromises()

    expect(api.isAnimating).toBe(true)
    expect(api.isPaused).toBe(false)
    expect(api.playState).toBe('running')
  })

  test('natural completion → finished state', async () => {
    const mock = createMockElement()
    const { result } = renderHook(() =>
      useSpatialDivAnimation(baseConfig, true),
    )
    const [animatedProps, api] = result.current

    await act(async () => {
      ;(animatedProps as any).__setElement(mock.element)
    })

    await act(async () => {
      api.play()
    })
    await flushPromises()

    // Trigger completion from native
    await act(async () => {
      mock.triggerCompleted({ opacity: 1 })
    })
    await flushPromises()

    expect(api.isAnimating).toBe(false)
    expect(api.isPaused).toBe(false)
    expect(api.playState).toBe('finished')
    expect(api.finished).toBe(true)
  })

  test('cancel during running → idle state', async () => {
    const mock = createMockElement()
    const { result } = renderHook(() =>
      useSpatialDivAnimation(baseConfig, true),
    )
    const [animatedProps, api] = result.current

    await act(async () => {
      ;(animatedProps as any).__setElement(mock.element)
    })

    await act(async () => {
      api.play()
    })
    await flushPromises()

    await act(async () => {
      api.cancel()
    })
    await flushPromises()

    // cancel triggers native cancel → canceled event
    await act(async () => {
      mock.triggerCanceled({ opacity: 0 })
    })
    await flushPromises()

    expect(api.isAnimating).toBe(false)
    expect(api.isPaused).toBe(false)
    expect(api.playState).toBe('idle')
    expect(api.finished).toBe(false)
  })

  test('play while running → no-op (state stays running)', async () => {
    const mock = createMockElement()
    const { result } = renderHook(() =>
      useSpatialDivAnimation(baseConfig, true),
    )
    const [animatedProps, api] = result.current

    await act(async () => {
      ;(animatedProps as any).__setElement(mock.element)
    })

    await act(async () => {
      api.play()
    })
    await flushPromises()
    expect(api.playState).toBe('running')

    // Second play should be no-op
    const callCountBefore = mock.element.animateSpatialDiv.mock.calls.length
    await act(async () => {
      api.play()
    })
    await flushPromises()

    // No new native commands sent
    expect(mock.element.animateSpatialDiv.mock.calls.length).toBe(
      callCountBefore,
    )
    expect(api.playState).toBe('running')
  })

  test('play while queued → no-op (state stays queued)', async () => {
    const { result } = renderHook(() =>
      useSpatialDivAnimation(baseConfig, true),
    )
    const [, api] = result.current

    await act(async () => {
      api.play()
    })
    await flushPromises()
    expect(api.playState).toBe('queued')

    // Second play should be no-op
    await act(async () => {
      api.play()
    })
    await flushPromises()
    expect(api.playState).toBe('queued')
  })

  test('pause/cancel when idle → no-op', async () => {
    const { result } = renderHook(() =>
      useSpatialDivAnimation(baseConfig, true),
    )
    const [, api] = result.current

    // These should not throw
    await act(async () => {
      api.pause()
    })
    await flushPromises()
    expect(api.playState).toBe('idle')

    await act(async () => {
      api.cancel()
    })
    await flushPromises()
    expect(api.playState).toBe('idle')
  })

  test('finished resets to false after re-play', async () => {
    const mock = createMockElement()
    const { result } = renderHook(() =>
      useSpatialDivAnimation(baseConfig, true),
    )
    const [animatedProps, api] = result.current

    await act(async () => {
      ;(animatedProps as any).__setElement(mock.element)
    })

    await act(async () => {
      api.play()
    })
    await flushPromises()

    await act(async () => {
      mock.triggerCompleted({ opacity: 1 })
    })
    await flushPromises()
    expect(api.finished).toBe(true)

    // Re-play resets finished
    await act(async () => {
      api.play()
    })
    await flushPromises()
    expect(api.finished).toBe(false)
    expect(api.isAnimating).toBe(true)
  })

  test('cancel after finished → resets to idle', async () => {
    const mock = createMockElement()
    const { result } = renderHook(() =>
      useSpatialDivAnimation(baseConfig, true),
    )
    const [animatedProps, api] = result.current

    await act(async () => {
      ;(animatedProps as any).__setElement(mock.element)
    })

    await act(async () => {
      api.play()
    })
    await flushPromises()

    await act(async () => {
      mock.triggerCompleted({ opacity: 1 })
    })
    await flushPromises()
    expect(api.finished).toBe(true)
    expect(api.playState).toBe('finished')

    await act(async () => {
      api.cancel()
    })
    await flushPromises()
    expect(api.finished).toBe(false)
    expect(api.playState).toBe('idle')
  })
})
