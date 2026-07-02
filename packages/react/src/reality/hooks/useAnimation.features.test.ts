import { describe, expect, test, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type {
  AnimatedPropsInternal,
  AnimationConfig,
  AnimationError,
  TransformValues,
} from '@webspatial/core-sdk'

// Mock @webspatial/core-sdk
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
          position: { x: 0, y: 0, z: 0 },
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
// Task 5.1.3 — Transform suppression tests
// ============================================================

describe('5.1.3 Transform suppression', () => {
  test('__getSuppressedFields returns animated fields during active session', async () => {
    const { entity } = createMockEntity()

    const { result } = renderHook(() =>
      useAnimation({
        to: {
          position: { x: 1, y: 0, z: 0 },
          scale: { x: 2, y: 2, z: 2 },
        },
        duration: 0.5,
      }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    const suppressed = (
      result.current[0] as AnimatedPropsInternal
    ).__getSuppressedFields?.()
    expect(suppressed).toContain('position')
    expect(suppressed).toContain('scale')
    expect(suppressed).not.toContain('rotation')
  })

  test('non-animated fields are not suppressed', async () => {
    const { entity } = createMockEntity()

    const { result } = renderHook(() =>
      useAnimation({
        to: { position: { x: 1, y: 0, z: 0 } },
        duration: 0.5,
      }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    const suppressed = (
      result.current[0] as AnimatedPropsInternal
    ).__getSuppressedFields?.()
    expect(suppressed).not.toContain('rotation')
    expect(suppressed).not.toContain('scale')
  })

  test('suppression is cleared after animation completes', async () => {
    const { entity, completeAnimation } = createMockEntity()

    const { result } = renderHook(() =>
      useAnimation({
        to: { position: { x: 1, y: 0, z: 0 } },
        duration: 0.5,
      }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    // Complete the animation
    await act(async () => {
      completeAnimation()
      await new Promise(r => setTimeout(r, 0))
    })

    const suppressed = (
      result.current[0] as AnimatedPropsInternal
    ).__getSuppressedFields?.()
    expect(suppressed ?? []).toHaveLength(0)
  })

  test('suppression is cleared after cancel', async () => {
    const { entity, cancelAnimation } = createMockEntity()

    const { result } = renderHook(() =>
      useAnimation({
        to: { position: { x: 1, y: 0, z: 0 } },
        duration: 0.5,
      }),
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

    await act(async () => {
      cancelAnimation()
      await new Promise(r => setTimeout(r, 0))
    })

    const suppressed = (
      result.current[0] as AnimatedPropsInternal
    ).__getSuppressedFields?.()
    expect(suppressed ?? []).toHaveLength(0)
  })
})

// ============================================================
// Task 5.1.9 — Bridge failure recovery tests
// ============================================================

describe('5.1.9 Bridge failure recovery', () => {
  test('session retains pre-failure state when play bridge call fails', async () => {
    const { entity } = createMockEntity()
    entity.animateTransform = vi.fn(async (cmd: any) => {
      if (cmd.type === 'play') {
        throw new Error('Bridge communication failed')
      }
      return undefined
    })

    const onError = vi.fn()
    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, onError }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    // After a failed play, state returns to idle
    expect(result.current[1].playState).toBe('idle')
    expect(result.current[1].isAnimating).toBe(false)
  })

  test('onError is invoked on bridge failure', async () => {
    const { entity } = createMockEntity()
    entity.animateTransform = vi.fn(async (cmd: any) => {
      if (cmd.type === 'play') {
        throw new Error('Bridge communication failed')
      }
      return undefined
    })

    const onError = vi.fn()
    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, onError }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ reason: expect.any(String) }),
    )
  })

  test('console.error fallback when onError not provided', async () => {
    const { entity } = createMockEntity()
    entity.animateTransform = vi.fn(async (cmd: any) => {
      if (cmd.type === 'play') {
        throw new Error('Bridge communication failed')
      }
      return undefined
    })

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useAnimation(baseConfig))

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  test('no completed/canceled callbacks fire after failed play', async () => {
    const { entity } = createMockEntity()
    entity.animateTransform = vi.fn(async (cmd: any) => {
      if (cmd.type === 'play') {
        throw new Error('Bridge communication failed')
      }
      return undefined
    })

    const onComplete = vi.fn()
    const onCancel = vi.fn()
    const onError = vi.fn()

    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, onComplete, onCancel, onError }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(onComplete).not.toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledTimes(1)
  })
})

// ============================================================
// Task 5.1.10 — Cancel-old failure blocks start-new
// ============================================================

describe('5.1.10 Cancel-old failure blocks start-new', () => {
  test('play after cancel+play is blocked when cancel of old session fails', async () => {
    const { entity } = createMockEntity()
    const onStart = vi.fn()
    const onError = vi.fn()

    let cancelCount = 0
    entity.animateTransform = vi.fn(async (cmd: any) => {
      if (cmd.type === 'play') {
        return {
          finished: new Promise(() => {}),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      if (cmd.type === 'cancel') {
        cancelCount++
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

    // First play succeeds
    act(() => {
      result.current[1].play()
    })
    await flushPromises()
    expect(onStart).toHaveBeenCalledTimes(1)

    // Cancel first, then play — cancel will fail on the bridge
    act(() => {
      result.current[1].cancel()
    })
    await flushPromises()

    // cancel failed — session is still running, play() is a no-op
    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    // Start should not have been called again because cancel failed and
    // the session remains in running state, making play() a no-op
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(cancelCount).toBe(1)
  })

  test('animation-prop replacement is blocked when cancel-old fails', async () => {
    const { entity } = createMockEntity()
    const onStart = vi.fn()
    const onCancel = vi.fn()
    const onError = vi.fn()

    let playCount = 0
    entity.animateTransform = vi.fn(async (cmd: any) => {
      if (cmd.type === 'play') {
        playCount++
        return {
          finished: new Promise(() => {}),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      if (cmd.type === 'cancel') {
        throw new Error('Bridge failure on cancel')
      }
      return undefined
    })

    const { result } = renderHook(() =>
      useAnimation({
        ...baseConfig,
        autoStart: false,
        onStart,
        onCancel,
        onError,
      }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    // Manually start first session
    act(() => {
      result.current[1].play()
    })
    await flushPromises()
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(playCount).toBe(1)

    // Cancel then play — cancel will fail on the bridge
    act(() => {
      result.current[1].cancel()
    })
    await flushPromises()

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    // play() is a no-op because cancel failed and session is still running
    expect(playCount).toBe(1) // no second play command sent
  })
})

// ============================================================
// Task 5.1.11 — playbackRate validation tests
// ============================================================

describe('5.1.11 playbackRate validation', () => {
  test('rejects playbackRate = 0', () => {
    expect(() => {
      renderHook(() => useAnimation({ ...baseConfig, playbackRate: 0 }))
    }).toThrow(/playbackRate/)
  })

  test('rejects negative playbackRate', () => {
    expect(() => {
      renderHook(() => useAnimation({ ...baseConfig, playbackRate: -1 }))
    }).toThrow(/playbackRate/)
  })

  test('rejects NaN playbackRate', () => {
    expect(() => {
      renderHook(() => useAnimation({ ...baseConfig, playbackRate: NaN }))
    }).toThrow(/playbackRate/)
  })

  test('rejects Infinity playbackRate', () => {
    expect(() => {
      renderHook(() => useAnimation({ ...baseConfig, playbackRate: Infinity }))
    }).toThrow(/playbackRate/)
  })

  test('accepts valid playbackRate', () => {
    expect(() => {
      renderHook(() => useAnimation({ ...baseConfig, playbackRate: 2 }))
    }).not.toThrow()
  })

  test('defaults to 1 when playbackRate omitted', async () => {
    const { entity } = createMockEntity()

    const { result } = renderHook(() => useAnimation(baseConfig))

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    // Check that the command was sent without explicit playbackRate
    // (undefined means default 1 on native side)
    const playCall = entity.animateTransform.mock.calls.find(
      (c: any[]) => c[0].type === 'play',
    )
    expect(playCall).toBeDefined()
    // playbackRate should not be present or be undefined when not specified
    expect(playCall![0].playbackRate).toBeUndefined()
  })

  test('passes playbackRate to bridge command', async () => {
    const { entity } = createMockEntity()

    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, playbackRate: 2.5 }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    const playCall = entity.animateTransform.mock.calls.find(
      (c: any[]) => c[0].type === 'play',
    )
    expect(playCall![0].playbackRate).toBe(2.5)
  })
})

// ============================================================
// Task 5.1.12 — api.finished state transitions
// ============================================================

describe('5.1.12 api.finished state transitions', () => {
  test('finished is false initially', () => {
    const { result } = renderHook(() => useAnimation(baseConfig))
    expect(result.current[1].finished).toBe(false)
  })

  test('finished becomes true after natural completion', async () => {
    const { entity, completeAnimation } = createMockEntity()

    const { result } = renderHook(() => useAnimation(baseConfig))

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(result.current[1].finished).toBe(false)

    await act(async () => {
      completeAnimation()
      await new Promise(r => setTimeout(r, 0))
    })

    expect(result.current[1].finished).toBe(true)
  })

  test('finished resets to false on next play()', async () => {
    const { entity, completeAnimation } = createMockEntity()

    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, autoStart: false }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    // Play and complete
    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    await act(async () => {
      completeAnimation()
      await new Promise(r => setTimeout(r, 0))
    })

    expect(result.current[1].finished).toBe(true)

    // Play again — finished resets
    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(result.current[1].finished).toBe(false)
  })

  test('finished stays false after cancel()', async () => {
    const { entity, cancelAnimation } = createMockEntity()

    const { result } = renderHook(() => useAnimation(baseConfig))

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

    await act(async () => {
      cancelAnimation()
      await new Promise(r => setTimeout(r, 0))
    })

    expect(result.current[1].finished).toBe(false)
  })
})

// ============================================================
// Task 5.1.13 — api.playState value correctness
// ============================================================

describe('5.1.13 api.playState value correctness', () => {
  test('playState is idle initially', () => {
    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, autoStart: false }),
    )
    expect(result.current[1].playState).toBe('idle')
  })

  test('playState is queued before entity is bound', async () => {
    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, autoStart: true }),
    )
    await flushPromises()

    // autoStart=true, useEffect fired play() but no entity bound → queued
    expect(result.current[1].playState).toBe('queued')
  })

  test('playState transitions to running after play()', async () => {
    const { entity } = createMockEntity()

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

    expect(result.current[1].playState).toBe('running')
  })

  test('playState transitions to paused after pause()', async () => {
    const { entity } = createMockEntity()

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
      result.current[1].pause()
    })
    await flushPromises()

    expect(result.current[1].playState).toBe('paused')
  })

  test('playState transitions from paused to running on play()', async () => {
    const { entity } = createMockEntity()

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
      result.current[1].pause()
    })
    await flushPromises()
    expect(result.current[1].playState).toBe('paused')

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(result.current[1].playState).toBe('running')
  })

  test('playState transitions to finished after natural completion', async () => {
    const { entity, completeAnimation } = createMockEntity()

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

    await act(async () => {
      completeAnimation()
      await new Promise(r => setTimeout(r, 0))
    })

    expect(result.current[1].playState).toBe('finished')
  })

  test('playState transitions to idle after cancel()', async () => {
    const { entity, cancelAnimation } = createMockEntity()

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

    await act(async () => {
      cancelAnimation()
      await new Promise(r => setTimeout(r, 0))
    })

    expect(result.current[1].playState).toBe('idle')
  })

  test('full lifecycle: idle → queued → running → paused → running → finished', async () => {
    const { entity, completeAnimation } = createMockEntity()

    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, autoStart: true }),
    )

    // autoStart=true, useEffect fires play() → queued since no entity bound
    await flushPromises()
    expect(result.current[1].playState).toBe('queued')

    // Bind → transitions to running
    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })
    await flushPromises()
    expect(result.current[1].playState).toBe('running')

    // Pause
    act(() => {
      result.current[1].pause()
    })
    await flushPromises()
    expect(result.current[1].playState).toBe('paused')

    // Resume via play()
    act(() => {
      result.current[1].play()
    })
    await flushPromises()
    expect(result.current[1].playState).toBe('running')

    // Complete
    await act(async () => {
      completeAnimation()
      await new Promise(r => setTimeout(r, 0))
    })
    expect(result.current[1].playState).toBe('finished')
  })
})

describe('play() while already running is a no-op', () => {
  test('play() during running state does not restart animation', async () => {
    const { entity } = createMockEntity()

    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, autoStart: false }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    // First play
    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    expect(result.current[1].playState).toBe('running')
    expect(entity.animateTransform).toHaveBeenCalledTimes(1)
    expect(entity.animateTransform).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'play' }),
    )

    // Second play — should be a no-op
    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    // Still running, no additional bridge call
    expect(result.current[1].playState).toBe('running')
    expect(entity.animateTransform).toHaveBeenCalledTimes(1)
  })

  test('play() during delaying state does not restart animation', async () => {
    const { entity } = createMockEntity()

    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, delay: 1.0, autoStart: false }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    // Animation is in delaying/running state (bridge received play command)
    const callCount = entity.animateTransform.mock.calls.length
    expect(callCount).toBe(1)

    // Second play — should be a no-op
    act(() => {
      result.current[1].play()
    })
    await flushPromises()

    // No additional bridge call
    expect(entity.animateTransform).toHaveBeenCalledTimes(1)
  })

  test('play() after cancel starts a new animation', async () => {
    const { entity, cancelAnimation } = createMockEntity()

    const { result } = renderHook(() =>
      useAnimation({ ...baseConfig, autoStart: false }),
    )

    act(() => {
      ;(result.current[0] as AnimatedPropsInternal).__bind(entity)
    })

    // Play first
    act(() => {
      result.current[1].play()
    })
    await flushPromises()
    expect(result.current[1].playState).toBe('running')

    // Cancel
    act(() => {
      result.current[1].cancel()
    })
    await act(async () => {
      cancelAnimation()
      await new Promise(r => setTimeout(r, 0))
    })
    expect(result.current[1].playState).toBe('idle')

    // Play again — should start a NEW animation (not no-op)
    act(() => {
      result.current[1].play()
    })
    await flushPromises()
    expect(result.current[1].playState).toBe('running')

    // Should have: play + cancel + play = 3 bridge calls
    const playCalls = entity.animateTransform.mock.calls.filter(
      (c: any) => c[0].type === 'play',
    )
    expect(playCalls.length).toBe(2)
  })
})
