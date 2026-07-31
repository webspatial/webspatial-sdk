import { act, renderHook } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import { useEntityAnimation } from './useAnimation'

describe('useEntityAnimation', () => {
  test('returns the stable redesigned tuple and queues playback before binding', () => {
    const { result, rerender } = renderHook(
      ({ duration }) =>
        useEntityAnimation({
          from: { position: { x: 0 } },
          to: { position: { x: 1 } },
          duration,
          autoStart: false,
        }),
      { initialProps: { duration: 1 } },
    )
    const [animation, api, entityProps] = result.current

    act(() => api.play())
    expect(api.playState).toBe('queued')
    expect(api.isAnimating).toBe(false)
    expect(api.isPaused).toBe(false)
    expect(api.finished).toBe(false)
    expect(api).not.toHaveProperty('cancel')
    expect(entityProps).toEqual({})

    rerender({ duration: 2 })
    expect(result.current[0]).toBe(animation)
    expect(result.current[1]).toBe(api)
  })

  test('rejects invalid authoring synchronously without using onError', () => {
    const onError = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() =>
      renderHook(() =>
        useEntityAnimation({
          from: { position: { x: 0 } },
          to: { opacity: 1 } as never,
          onError,
        }),
      ),
    ).toThrow('unsupported')
    expect(onError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
