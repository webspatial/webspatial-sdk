import { describe, expect, test, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type {
  AnimatedPropsInternal,
  AnimationConfig,
  AnimationError,
  TransformValues,
} from '@webspatial/core-sdk'

// Mock @webspatial/core-sdk — must provide composeSRT since jsdom lacks DOMMatrix
vi.mock('@webspatial/core-sdk', async () => {
  const actual = await vi.importActual('@webspatial/core-sdk')
  return {
    ...actual,
    VALID_TIMING_FUNCTIONS: actual.VALID_TIMING_FUNCTIONS,
    supports: (name: string, tokens?: readonly string[]) => {
      if (name === 'useAnimation' && tokens && tokens.includes('entity'))
        return true
      return false
    },
    composeSRT: (_pos: any, _rot: any, _scl: any) => ({
      toFloat64Array: () => new Float64Array(16),
    }),
  }
})

const { useEntityAnimation: useAnimation } = await import('./useAnimation')

// ---- Mock Entity Factory ----

function createMockEntity(id = 'test-entity-1') {
  let finishedResolve: ((v: TransformValues) => void) | null = null
  let canceledResolve: ((v: TransformValues) => void) | null = null
  let failedResolve: ((e: AnimationError) => void) | null = null

  const entity = {
    id,
    spatialId: id,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    animateTransform: vi.fn(async (command: any) => {
      if (command.type === 'play') {
        const finished = new Promise<TransformValues>(r => {
          finishedResolve = r
        })
        const canceled = new Promise<TransformValues>(r => {
          canceledResolve = r
        })
        const failed = new Promise<AnimationError>(r => {
          failedResolve = r
        })
        return { finished, canceled, failed }
      }
      return undefined
    }),
    cleanupAnimationListeners: vi.fn(),
  }

  return {
    entity: entity as any,
    completeAnimation: (transform?: TransformValues) => {
      finishedResolve?.(
        transform ?? {
          position: { x: 1, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
      )
    },
    cancelAnimation: (transform?: TransformValues) => {
      canceledResolve?.(
        transform ?? {
          position: { x: 0.5, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
      )
    },
    failAnimation: (error?: AnimationError) => {
      failedResolve?.(
        error ?? {
          animationId: 'test',
          command: 'play',
          reason: 'test failure',
        },
      )
    },
  }
}

// ---- Helpers ----

const baseConfig: AnimationConfig = {
  to: { position: { x: 1, y: 0, z: 0 } },
  duration: 0.5,
}

async function flushPromises() {
  await act(async () => {
    await new Promise(r => setTimeout(r, 0))
  })
}

// ============================================================
// Task 5.1.2 — React playback lifecycle tests
// ============================================================

describe('5.1.2 React playback lifecycle', () => {
  describe('onStart timing', () => {
    test('onStart fires after bridge acknowledges play', async () => {
      const onStart = vi.fn()
      const { entity } = createMockEntity()

      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false, onStart }),
      )

      act(() => {
        ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
      })

      act(() => {
        result.current[1].play()
      })

      // onStart should not fire synchronously
      expect(onStart).not.toHaveBeenCalled()

      await flushPromises()
      expect(onStart).toHaveBeenCalledTimes(1)
    })

    test('onStart fires for queued-then-bound animation', async () => {
      const onStart = vi.fn()
      const { entity } = createMockEntity()

      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false, onStart }),
      )

      // Play without entity (queued)
      act(() => {
        result.current[1].play()
      })
      await flushPromises()
      // Session is now queued
      expect(result.current[1].isAnimating).toBe(true)
      expect(onStart).not.toHaveBeenCalled()

      // Bind entity — triggers play
      act(() => {
        ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
      })
      await flushPromises()

      expect(onStart).toHaveBeenCalledTimes(1)
    })

    test('onStart fires for autoStart queued-then-bound animation', async () => {
      const onStart = vi.fn()
      const { entity } = createMockEntity()

      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, onStart }),
      )

      await flushPromises()
      expect(result.current[1].isAnimating).toBe(true)
      expect(onStart).not.toHaveBeenCalled()

      act(() => {
        ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
      })
      await flushPromises()

      expect(onStart).toHaveBeenCalledTimes(1)
    })

    test('queued-pause then bind then play resumes session', async () => {
      const onStart = vi.fn()
      const { entity } = createMockEntity()

      entity.animateTransform = vi.fn(async (cmd: any) => {
        if (cmd.type === 'play') {
          return {
            finished: new Promise(() => {}),
            canceled: new Promise(() => {}),
            failed: new Promise(() => {}),
          }
        }
        return undefined
      })

      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false, onStart }),
      )

      // Play (queued)
      act(() => {
        result.current[1].play()
      })
      await flushPromises()

      // Pause while queued
      act(() => {
        result.current[1].pause()
      })
      expect(result.current[1].isPaused).toBe(true)

      // Bind entity — paused session should NOT auto-play
      act(() => {
        ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
      })
      await flushPromises()
      expect(onStart).not.toHaveBeenCalled()

      // play() resumes the paused session
      act(() => {
        result.current[1].play()
      })
      await flushPromises()

      // After resume, it transitions back to queued, then bind triggers play
      // Since entity is now available and state returns to queued, play is triggered
      expect(result.current[1].isAnimating).toBe(true)
    })
  })

  describe('onComplete callback', () => {
    test('onComplete fires with final transform on natural completion', async () => {
      const onComplete = vi.fn()
      const { entity, completeAnimation } = createMockEntity()

      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false, onComplete }),
      )

      act(() => {
        ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
      })
      act(() => {
        result.current[1].play()
      })
      await flushPromises()

      const finalTransform = {
        position: { x: 1, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      }
      act(() => {
        completeAnimation(finalTransform)
      })
      await flushPromises()

      expect(onComplete).toHaveBeenCalledTimes(1)
      expect(onComplete).toHaveBeenCalledWith(finalTransform)
      expect(result.current[1].isAnimating).toBe(false)
    })
  })

  describe('onCancel callback', () => {
    test('onCancel fires with restored transform when canceled', async () => {
      const onCancel = vi.fn()
      const { entity, cancelAnimation } = createMockEntity()

      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false, onCancel }),
      )

      act(() => {
        ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
      })
      act(() => {
        result.current[1].play()
      })
      await flushPromises()

      const currentTransform = {
        position: { x: 0.5, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
      }
      act(() => {
        cancelAnimation(currentTransform)
      })
      await flushPromises()

      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(onCancel).toHaveBeenCalledWith(currentTransform)
      expect(result.current[1].isAnimating).toBe(false)
    })
  })

  describe('onError callback', () => {
    test('onError fires when native reports failure', async () => {
      const onError = vi.fn()
      const { entity, failAnimation } = createMockEntity()

      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false, onError }),
      )

      act(() => {
        ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
      })
      act(() => {
        result.current[1].play()
      })
      await flushPromises()

      const error = {
        animationId: 'test',
        command: 'play',
        reason: 'GPU error',
      } satisfies AnimationError
      act(() => {
        failAnimation(error)
      })
      await flushPromises()

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'GPU error' }),
      )
      expect(result.current[1].isAnimating).toBe(false)
    })

    test('console.error is fallback when onError not provided', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { entity, failAnimation } = createMockEntity()

      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false }),
      )

      act(() => {
        ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
      })
      act(() => {
        result.current[1].play()
      })
      await flushPromises()

      act(() => {
        failAnimation({ animationId: 'x', command: 'play', reason: 'fail' })
      })
      await flushPromises()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useEntityAnimation]'),
        expect.anything(),
      )
      consoleSpy.mockRestore()
    })
  })

  describe('mutual exclusivity', () => {
    test('play() while running is a no-op (Web Animation API semantics)', async () => {
      const onCancel = vi.fn()
      const onStart = vi.fn()
      const { entity } = createMockEntity()

      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false, onCancel, onStart }),
      )

      act(() => {
        ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
      })

      act(() => {
        result.current[1].play()
      })
      await flushPromises()
      expect(onStart).toHaveBeenCalledTimes(1)

      // Second play — is a no-op because already running
      act(() => {
        result.current[1].play()
      })
      await flushPromises()

      expect(onCancel).not.toHaveBeenCalled()
      expect(onStart).toHaveBeenCalledTimes(1) // not called again
    })
  })

  describe('callback suppression after unmount', () => {
    test('onComplete does not fire after unmount', async () => {
      const onComplete = vi.fn()
      const { entity, completeAnimation } = createMockEntity()

      const { result, unmount } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false, onComplete }),
      )

      act(() => {
        ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
      })
      act(() => {
        result.current[1].play()
      })
      await flushPromises()

      unmount()

      act(() => {
        completeAnimation()
      })
      await flushPromises()

      expect(onComplete).not.toHaveBeenCalled()
    })
  })
})

// ============================================================
// Task 5.1.4 — Command & event ordering tests
// ============================================================

describe('5.1.4 Command and event ordering', () => {
  test('commands serialize in call order (play → pause → play/resume)', async () => {
    const { entity } = createMockEntity()
    const commandOrder: string[] = []

    entity.animateTransform = vi.fn(async (cmd: any) => {
      commandOrder.push(cmd.type)
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })

    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, autoStart: false }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    // Play first, await so session transitions to running
    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    // Now pause
    act(() => {
      result.current[1].pause()
    })
    await flushPromises()

    // Now play (resumes paused session)
    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(commandOrder).toEqual(['play', 'pause', 'resume'])
  })

  test('rapid play-cancel-play sequences serialize correctly', async () => {
    const { entity } = createMockEntity()
    const commandOrder: string[] = []

    entity.animateTransform = vi.fn(async (cmd: any) => {
      commandOrder.push(cmd.type)
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })

    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, autoStart: false }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    act(() => {
      result.current[1].cancel()
    })
    await flushPromises()

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(commandOrder).toEqual(['play', 'cancel', 'play'])
  })

  test('bridge calls are not interleaved across concurrent ops', async () => {
    const { entity } = createMockEntity()
    const commandOrder: string[] = []
    let pauseResolve: (() => void) | null = null

    entity.animateTransform = vi.fn((cmd: any) => {
      if (cmd.type === 'play') {
        commandOrder.push('play')
        return Promise.resolve({
          finished: new Promise(() => {}),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        })
      }
      if (cmd.type === 'pause') {
        return new Promise<void>(r => {
          pauseResolve = () => {
            commandOrder.push('pause')
            r()
          }
        })
      }
      if (cmd.type === 'resume') {
        commandOrder.push('resume')
        return Promise.resolve(undefined)
      }
      if (cmd.type === 'cancel') {
        commandOrder.push('cancel')
        return Promise.resolve(undefined)
      }
      return Promise.resolve(undefined)
    })

    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, autoStart: false }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    // Now pause — bridge is slow, so it won't resolve immediately
    act(() => {
      result.current[1].pause()
    })

    // Give some time — pause is pending in bridge
    await act(async () => {
      await new Promise(r => setTimeout(r, 10))
    })
    // Only play completed so far; pause is waiting on bridge
    expect(commandOrder).toEqual(['play'])

    // Complete the pause
    act(() => {
      pauseResolve?.()
    })
    await flushPromises()

    expect(commandOrder).toEqual(['play', 'pause'])
    expect(result.current[1].isPaused).toBe(true)

    // Now play (resumes after pause has completed)
    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    // All three completed in order, none interleaved
    expect(commandOrder).toEqual(['play', 'pause', 'resume'])
  })
})

// ============================================================
// Task 5.1.6 — Animation prop replacement tests
// ============================================================

describe('5.1.6 Animation prop replacement (cancel old → start new)', () => {
  test('cancel then play starts a new session (cancel-old before start-new)', async () => {
    const { entity } = createMockEntity()
    const callOrder: string[] = []

    entity.animateTransform = vi.fn(async (cmd: any) => {
      callOrder.push(cmd.type)
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          canceled: new Promise<any>(r => {
            // Store for external trigger
            ;(entity as any).__cancelResolve = r
          }),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })

    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, autoStart: false }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    // Cancel then play — cancel-old then start-new
    act(() => {
      result.current[1].cancel()
    })
    await act(async () => {
      ;(entity as any).__cancelResolve?.({ position: { x: 0, y: 0, z: 0 } })
      await new Promise(r => setTimeout(r, 0))
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(callOrder).toEqual(['play', 'cancel', 'play'])
  })

  test('onCancel fires before onStart when cancel+play replaces animation', async () => {
    const events: string[] = []
    const { entity } = createMockEntity()

    entity.animateTransform = vi.fn(async (cmd: any) => {
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          canceled: new Promise<any>(r => {
            ;(entity as any).__cancelResolve = r
          }),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })

    const { result } = renderHook(() =>
      useAnimation({
        ...baseConfig,
        autoStart: false,
        onCancel: () => events.push('cancel'),
        onStart: () => events.push('start'),
      }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()
    expect(events).toEqual(['start'])

    // Cancel then play
    act(() => {
      result.current[1].cancel()
    })
    await act(async () => {
      ;(entity as any).__cancelResolve?.({ position: { x: 0, y: 0, z: 0 } })
      await new Promise(r => setTimeout(r, 0))
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(events).toEqual(['start', 'cancel', 'start'])
  })

  test('play() while running is no-op even if cancel would have failed', async () => {
    const onStart = vi.fn()
    const { entity } = createMockEntity()

    entity.animateTransform = vi.fn(async (cmd: any) => {
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      if (cmd.type === 'cancel') {
        throw new Error('Bridge communication failed')
      }
      return undefined
    })

    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, autoStart: false, onStart }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()
    expect(onStart).toHaveBeenCalledTimes(1)

    // play() while running is a no-op — never reaches cancel-old logic
    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(onStart).toHaveBeenCalledTimes(1) // not called again
  })
})

// ============================================================
// Task 5.1.7 — Delay pause/resume tests
// ============================================================

describe('5.1.7 Delay phase pause and resume', () => {
  const delayConfig: AnimationConfig = {
    to: { position: { x: 1, y: 0, z: 0 } },
    duration: 0.5,
    delay: 1.0,
  }

  test('pause during delay phase sends pause command to native', async () => {
    const { entity } = createMockEntity()
    const commands: string[] = []

    entity.animateTransform = vi.fn(async (cmd: any) => {
      commands.push(cmd.type)
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })

    const { result } = renderHook(() =>
      useAnimation({ ...delayConfig, autoStart: false }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()
    expect(result.current[1].isAnimating).toBe(true)

    // Pause during delay
    act(() => {
      result.current[1].pause()
    })
    await flushPromises()

    expect(result.current[1].isPaused).toBe(true)
    expect(commands).toContain('pause')
  })

  test('play after delay-phase pause sends resume to native', async () => {
    const { entity } = createMockEntity()
    const commands: string[] = []

    entity.animateTransform = vi.fn(async (cmd: any) => {
      commands.push(cmd.type)
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })

    const { result } = renderHook(() =>
      useAnimation({ ...delayConfig, autoStart: false }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    act(() => {
      result.current[1].pause()
    })
    await flushPromises()

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(result.current[1].isAnimating).toBe(true)
    expect(result.current[1].isPaused).toBe(false)
    expect(commands).toEqual(['play', 'pause', 'resume'])
  })

  test('cancel during delay phase sends cancel command', async () => {
    const { entity } = createMockEntity()
    const commands: string[] = []

    entity.animateTransform = vi.fn(async (cmd: any) => {
      commands.push(cmd.type)
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })

    const { result } = renderHook(() =>
      useAnimation({ ...delayConfig, autoStart: false }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    act(() => {
      result.current[1].cancel()
    })
    await flushPromises()

    expect(result.current[1].isAnimating).toBe(false)
    expect(commands).toContain('cancel')
  })

  test('animation with delay=0 transitions directly to running', async () => {
    const onStart = vi.fn()
    const { entity } = createMockEntity()

    entity.animateTransform = vi.fn(async (cmd: any) => {
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })

    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, delay: 0, autoStart: false, onStart }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(result.current[1].isAnimating).toBe(true)
    expect(onStart).toHaveBeenCalledTimes(1)
  })
})
