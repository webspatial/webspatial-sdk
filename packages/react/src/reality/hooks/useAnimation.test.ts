import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type {
  AnimationConfig,
  AnimatedProps,
  AnimationApi,
} from '@webspatial/core-sdk'

// Mock supports() to return true for useAnimation in test environment
vi.mock('@webspatial/core-sdk', async () => {
  const actual = await vi.importActual('@webspatial/core-sdk')
  return {
    ...actual,
    supports: (name: string) => {
      if (name === 'useAnimation') return true
      return false
    },
  }
})

// Import after mock
const { useAnimation } = await import('./useAnimation')

const baseConfig: AnimationConfig = {
  to: { position: { x: 1, y: 0, z: 0 } },
  duration: 0.5,
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
      expect(typeof api.resume).toBe('function')
      expect(typeof api.stop).toBe('function')
      expect(typeof api.isAnimating).toBe('boolean')
      expect(typeof api.isPaused).toBe('boolean')
    })
  })

  describe('config validation', () => {
    test('throws on invalid config (missing to)', () => {
      expect(() => {
        renderHook(() => useAnimation({ to: undefined } as any))
      }).toThrow()
    })

    test('throws on invalid config (empty to)', () => {
      expect(() => {
        renderHook(() => useAnimation({ to: {} }))
      }).toThrow()
    })

    test('throws on negative duration', () => {
      expect(() => {
        renderHook(() =>
          useAnimation({
            to: { position: { x: 1, y: 0, z: 0 } },
            duration: -1,
          }),
        )
      }).toThrow()
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
    test('autoStart defaults to true (isAnimating after mount)', () => {
      const { result } = renderHook(() => useAnimation(baseConfig))
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

  describe('play/stop lifecycle (without entity)', () => {
    test('play transitions to isAnimating (queued)', () => {
      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false }),
      )
      const [, api] = result.current

      expect(api.isAnimating).toBe(false)
      act(() => {
        api.play()
      })
      expect(result.current[1].isAnimating).toBe(true)
    })

    test('stop cancels queued session', () => {
      const onStop = vi.fn()
      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false, onStop }),
      )

      act(() => {
        result.current[1].play()
      })
      expect(result.current[1].isAnimating).toBe(true)

      act(() => {
        result.current[1].stop()
      })
      expect(result.current[1].isAnimating).toBe(false)
      expect(onStop).toHaveBeenCalledTimes(1)
    })
  })

  describe('pause/resume lifecycle (without entity)', () => {
    test('pause on queued session transitions to isPaused', () => {
      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false }),
      )

      act(() => {
        result.current[1].play()
      })
      expect(result.current[1].isAnimating).toBe(true)
      expect(result.current[1].isPaused).toBe(false)

      act(() => {
        result.current[1].pause()
      })
      expect(result.current[1].isPaused).toBe(true)
      // isPaused means not isAnimating (queued/delaying/running)
      expect(result.current[1].isAnimating).toBe(false)
    })

    test('resume from queued-paused returns to queued', () => {
      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false }),
      )

      act(() => {
        result.current[1].play()
      })
      act(() => {
        result.current[1].pause()
      })
      expect(result.current[1].isPaused).toBe(true)

      act(() => {
        result.current[1].resume()
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
      ;(animatedProps as any).__bind(mockEntity1)

      // Second bind to different entity should throw
      expect(() => {
        ;(animatedProps as any).__bind(mockEntity2)
      }).toThrow('must not be bound to multiple entities')
    })
  })

  describe('suppressed fields', () => {
    test('__getSuppressedFields returns null when no session', () => {
      const { result } = renderHook(() =>
        useAnimation({ ...baseConfig, autoStart: false }),
      )
      const [animatedProps] = result.current
      const fields = (animatedProps as any).__getSuppressedFields()
      expect(fields).toBe(null)
    })

    test('__getSuppressedFields returns animated fields during session', () => {
      const { result } = renderHook(() =>
        useAnimation({
          to: {
            position: { x: 1, y: 0, z: 0 },
            rotation: { x: 0, y: 90, z: 0 },
          },
        }),
      )
      const [animatedProps] = result.current
      const fields = (animatedProps as any).__getSuppressedFields()
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
