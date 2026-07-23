import { describe, expect, test, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type {
  AnimatedPropsInternal,
  AnimationConfig,
  AnimatedProps,
  AnimationApi,
} from '@webspatial/core-sdk'

// Mock supports() to return true for useAnimation with entity sub-token in test environment
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
  }
})

// Import after mock
const { useEntityAnimation: useAnimation } = await import('./useAnimation')

const baseConfig: AnimationConfig = {
  to: { position: { x: 1, y: 0, z: 0 } },
  duration: 0.5,
}

async function flushPromises() {
  await act(async () => {
    await new Promise(r => setTimeout(r, 0))
  })
}

function expectRenderHookToThrow(callback: () => void) {
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => {})
  try {
    expect(callback).toThrow()
  } finally {
    consoleErrorSpy.mockRestore()
  }
}

describe('useAnimation hook', () => {
  describe('return shape', () => {
    test('returns [AnimatedProps, AnimationApi] tuple', () => {
      const { result } = renderHook(() => useAnimation(baseConfig))
      const [animatedProps, api] = result.current

      // AnimatedProps shape
      expect(animatedProps).toBeDefined()
      expect(typeof animatedProps.__animationObjectId).toBe('string')
      expect(Array.isArray(animatedProps.__animatedFields)).toBe(true)
      expect(animatedProps.__animatedFields).toContain('position')

      // AnimationApi shape
      expect(typeof api.play).toBe('function')
      expect(typeof api.pause).toBe('function')
      expect(typeof api.cancel).toBe('function')
      expect(typeof api.playState).toBe('string')
      expect(typeof api.finished).toBe('boolean')
      expect(typeof api.isAnimating).toBe('boolean')
      expect(typeof api.isPaused).toBe('boolean')
    })
  })

  describe('config validation', () => {
    test('throws on invalid config (missing to)', () => {
      expectRenderHookToThrow(() => {
        renderHook(() => useAnimation({ to: undefined } as any))
      })
    })

    test('throws on invalid config (empty to)', () => {
      expectRenderHookToThrow(() => {
        renderHook(() => useAnimation({ to: {} }))
      })
    })

    test('throws on negative duration', () => {
      expectRenderHookToThrow(() => {
        renderHook(() =>
          useAnimation({
            to: { position: { x: 1, y: 0, z: 0 } },
            duration: -1,
          }),
        )
      })
    })
  })

  describe('animated fields detection', () => {
    test('detects position only', () => {
      const { result } = renderHook(() =>
        useAnimation({ to: { position: { x: 1, y: 0, z: 0 } } }),
      )
      expect(result.current[0].__animatedFields).toEqual(['position'])
    })

    test('detects rotation only', () => {
      const { result } = renderHook(() =>
        useAnimation({ to: { rotation: { x: 0, y: 90, z: 0 } } }),
      )
      expect(result.current[0].__animatedFields).toEqual(['rotation'])
    })

    test('detects scale only', () => {
      const { result } = renderHook(() =>
        useAnimation({ to: { scale: { x: 2, y: 2, z: 2 } } }),
      )
      expect(result.current[0].__animatedFields).toEqual(['scale'])
    })

    test('detects all fields', () => {
      const { result } = renderHook(() =>
        useAnimation({
          to: {
            position: { x: 1, y: 0, z: 0 },
            rotation: { x: 0, y: 90, z: 0 },
            scale: { x: 2, y: 2, z: 2 },
          },
        }),
      )
      expect(result.current[0].__animatedFields).toEqual([
        'position',
        'rotation',
        'scale',
      ])
    })
  })

  describe('autoStart', () => {
    test('autoStart defaults to true (isAnimating after mount)', async () => {
      const { result } = renderHook(() => useAnimation(baseConfig))
      await flushPromises()
      // After auto-start, isAnimating should be true (queued since no entity bound)
      expect(result.current[1].isAnimating).toBe(true)
    })

    test('autoStart: false does not start on mount', () => {
      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false }),
      )
      expect(result.current[1].isAnimating).toBe(false)
    })
  })

  describe('play/cancel lifecycle (without entity)', () => {
    test('play transitions to isAnimating (queued)', async () => {
      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false }),
      )
      const [, api] = result.current

      expect(api.isAnimating).toBe(false)
      act(() => {
        api.play()
      })
      await flushPromises()
      expect(result.current[1].isAnimating).toBe(true)
    })

    test('cancel cancels queued session', async () => {
      const onCancel = vi.fn()
      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false, onCancel }),
      )

      act(() => {
        result.current[1].play()
      })
      await flushPromises()
      expect(result.current[1].isAnimating).toBe(true)

      act(() => {
        result.current[1].cancel()
      })
      expect(result.current[1].isAnimating).toBe(false)
      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('pause/play-resume lifecycle (without entity)', () => {
    test('pause on queued session transitions to isPaused', async () => {
      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false }),
      )

      act(() => {
        result.current[1].play()
      })
      await flushPromises()
      expect(result.current[1].isAnimating).toBe(true)
      expect(result.current[1].isPaused).toBe(false)

      act(() => {
        result.current[1].pause()
      })
      expect(result.current[1].isPaused).toBe(true)
      // isPaused means not isAnimating (queued/delaying/running)
      expect(result.current[1].isAnimating).toBe(false)
    })

    test('play from queued-paused returns to queued', async () => {
      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false }),
      )

      act(() => {
        result.current[1].play()
      })
      await flushPromises()
      act(() => {
        result.current[1].pause()
      })
      expect(result.current[1].isPaused).toBe(true)

      act(() => {
        result.current[1].play()
      })
      expect(result.current[1].isPaused).toBe(false)
      expect(result.current[1].isAnimating).toBe(true)
    })
  })

  describe('multi-entity binding guard', () => {
    test('__bind to different entities throws', () => {
      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false }),
      )
      const [animatedProps] = result.current

      const mockEntity1 = { id: 'entity-1' } as any
      const mockEntity2 = { id: 'entity-2' } as any

      // First bind should work
      ;(animatedProps as AnimatedPropsInternal).__bind(mockEntity1)

      // Second bind to different entity should throw
      expect(() => {
        ;(animatedProps as AnimatedPropsInternal).__bind(mockEntity2)
      }).toThrow('must not be bound to multiple entities')
    })
  })

  describe('suppressed fields', () => {
    test('__getSuppressedFields returns null when no session', () => {
      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false }),
      )
      const [animatedProps] = result.current
      const fields = (
        animatedProps as AnimatedPropsInternal
      ).__getSuppressedFields()
      expect(fields).toBe(null)
    })

    test('__getSuppressedFields returns animated fields during session', async () => {
      const { result } = renderHook(() =>
        useAnimation({
          to: {
            position: { x: 1, y: 0, z: 0 },
            rotation: { x: 0, y: 90, z: 0 },
          },
        }),
      )
      await flushPromises()
      const [animatedProps] = result.current
      const fields = (
        animatedProps as AnimatedPropsInternal
      ).__getSuppressedFields()
      expect(fields).toContain('position')
      expect(fields).toContain('rotation')
      expect(fields).not.toContain('scale')
    })
  })

  describe('animation object identity', () => {
    test('animationObjectId is stable across re-renders', () => {
      const { result, rerender } = renderHook(() => useAnimation(baseConfig))
      const id1 = result.current[0].__animationObjectId
      rerender()
      const id2 = result.current[0].__animationObjectId
      expect(id1).toBe(id2)
    })
  })
})
