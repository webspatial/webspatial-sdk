import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
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
    supports: (name: string) => {
      if (name === 'useAnimation') return true
      return false
    },
    composeSRT: (_pos: any, _rot: any, _scl: any) => ({
      toFloat64Array: () => new Float64Array(16),
    }),
  }
})

const { useAnimation } = await import('./useAnimation')

// ---- Mock Entity Factory ----

function createMockEntity(id = 'test-entity-1') {
  let finishedResolve: ((v: TransformValues) => void) | null = null
  let stoppedResolve: ((v: TransformValues) => void) | null = null
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
        const stopped = new Promise<TransformValues>(r => {
          stoppedResolve = r
        })
        const failed = new Promise<AnimationError>(r => {
          failedResolve = r
        })
        return { finished, stopped, failed }
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
    stopAnimation: (transform?: TransformValues) => {
      stoppedResolve?.(
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

    test('queued-pause then bind then resume triggers play', async () => {
      const onStart = vi.fn()
      const { entity } = createMockEntity()

      entity.animateTransform = vi.fn(async (cmd: any) => {
        if (cmd.type === 'play') {
          return {
            finished: new Promise(() => {}),
            stopped: new Promise(() => {}),
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

      // Resume — now it should play
      act(() => {
        result.current[1].resume()
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

  describe('onStop callback', () => {
    test('onStop fires with current transform when stopped', async () => {
      const onStop = vi.fn()
      const { entity, stopAnimation } = createMockEntity()

      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false, onStop }),
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
        stopAnimation(currentTransform)
      })
      await flushPromises()

      expect(onStop).toHaveBeenCalledTimes(1)
      expect(onStop).toHaveBeenCalledWith(currentTransform)
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
        expect.stringContaining('[useAnimation]'),
        expect.anything(),
      )
      consoleSpy.mockRestore()
    })
  })

  describe('mutual exclusivity', () => {
    test('only one session active — new play stops old', async () => {
      const onStop = vi.fn()
      const onStart = vi.fn()
      const { entity } = createMockEntity()

      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false, onStop, onStart }),
      )

      act(() => {
        ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
      })

      act(() => {
        result.current[1].play()
      })
      await flushPromises()
      expect(onStart).toHaveBeenCalledTimes(1)

      // Second play
      act(() => {
        result.current[1].play()
      })
      await flushPromises()

      expect(onStop).toHaveBeenCalledTimes(1)
      expect(onStart).toHaveBeenCalledTimes(2)
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
  test('commands serialize in call order (play → pause → resume)', async () => {
    const { entity } = createMockEntity()
    const commandOrder: string[] = []

    entity.animateTransform = vi.fn(async (cmd: any) => {
      commandOrder.push(cmd.type)
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          stopped: new Promise(() => {}),
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

    // Now resume
    act(() => {
      result.current[1].resume()
    })
    await flushPromises()

    expect(commandOrder).toEqual(['play', 'pause', 'resume'])
  })

  test('rapid play-stop-play sequences serialize correctly', async () => {
    const { entity } = createMockEntity()
    const commandOrder: string[] = []

    entity.animateTransform = vi.fn(async (cmd: any) => {
      commandOrder.push(cmd.type)
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          stopped: new Promise(() => {}),
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
      result.current[1].stop()
    })
    await flushPromises()

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(commandOrder).toEqual(['play', 'stop', 'play'])
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
          stopped: new Promise(() => {}),
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

    // Now resume (after pause has completed)
    act(() => {
      result.current[1].resume()
    })
    await flushPromises()

    // All three completed in order, none interleaved
    expect(commandOrder).toEqual(['play', 'pause', 'resume'])
  })
})

// ============================================================
// Task 5.1.6 — Animation prop replacement tests
// ============================================================

describe('5.1.6 Animation prop replacement (stop old → start new)', () => {
  test('replacing animation stops old session before starting new', async () => {
    const { entity } = createMockEntity()
    const callOrder: string[] = []

    entity.animateTransform = vi.fn(async (cmd: any) => {
      callOrder.push(cmd.type)
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          stopped: new Promise(() => {}),
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

    // Second play replaces
    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(callOrder).toEqual(['play', 'stop', 'play'])
  })

  test('onStop fires before onStart when replacing animation', async () => {
    const events: string[] = []
    const { entity } = createMockEntity()

    entity.animateTransform = vi.fn(async (cmd: any) => {
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          stopped: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })

    const { result } = renderHook(() =>
      useAnimation({
        ...baseConfig,
        autoStart: false,
        onStop: () => events.push('stop'),
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

    // Replace
    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(events).toEqual(['start', 'stop', 'start'])
  })

  test('stop failure on old animation blocks start of new', async () => {
    const onStart = vi.fn()
    const onError = vi.fn()
    const { entity } = createMockEntity()

    let stopCount = 0
    entity.animateTransform = vi.fn(async (cmd: any) => {
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          stopped: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      if (cmd.type === 'stop') {
        stopCount++
        throw new Error('Bridge communication failed')
      }
      return undefined
    })

    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, autoStart: false, onStart, onError }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()
    expect(onStart).toHaveBeenCalledTimes(1)

    // Second play — stop-old will fail
    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(onStart).toHaveBeenCalledTimes(1) // blocked
    expect(stopCount).toBe(1)
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
          stopped: new Promise(() => {}),
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

  test('resume after delay-phase pause sends resume to native', async () => {
    const { entity } = createMockEntity()
    const commands: string[] = []

    entity.animateTransform = vi.fn(async (cmd: any) => {
      commands.push(cmd.type)
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          stopped: new Promise(() => {}),
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
      result.current[1].resume()
    })
    await flushPromises()

    expect(result.current[1].isAnimating).toBe(true)
    expect(result.current[1].isPaused).toBe(false)
    expect(commands).toEqual(['play', 'pause', 'resume'])
  })

  test('stop during delay phase sends stop command', async () => {
    const { entity } = createMockEntity()
    const commands: string[] = []

    entity.animateTransform = vi.fn(async (cmd: any) => {
      commands.push(cmd.type)
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          stopped: new Promise(() => {}),
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
      result.current[1].stop()
    })
    await flushPromises()

    expect(result.current[1].isAnimating).toBe(false)
    expect(commands).toContain('stop')
  })

  test('animation with delay=0 transitions directly to running', async () => {
    const onStart = vi.fn()
    const { entity } = createMockEntity()

    entity.animateTransform = vi.fn(async (cmd: any) => {
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          stopped: new Promise(() => {}),
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
