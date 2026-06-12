import { describe, expect, test, vi } from 'vitest'
import React, { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAnimation } from './useAnimation'

const SIMPLE_ENTRANCE_CONFIG = {
  from: {
    opacity: 0,
    transform: { translate: { y: 40 } },
  },
  to: {
    opacity: 1,
    transform: { translate: { y: 0 } },
  },
  duration: 0.4,
  timingFunction: 'linear' as const,
  autoStart: true,
}

function createMockElement(id = 'motion-element-1') {
  return { id }
}

function readTranslateX(style: { transform?: unknown }): number {
  const transform = String(style.transform ?? '')
  const match = transform.match(/translate3d\(([-\d.]+)px/)
  return match ? Number(match[1]) : 0
}

describe('useAnimation tuple api', () => {
  test('2D bind starts playback and updates style', async () => {
    const { result } = renderHook(() => useAnimation(SIMPLE_ENTRANCE_CONFIG))

    expect(result.current[0].__propName).toBe('xr-animation')
    expect(result.current[2].opacity).toBe(0)
    expect(String(result.current[2].transform)).toContain('40px')

    await act(async () => {
      result.current[0].__setElement?.(
        createMockElement() as any,
        'spatialized2d',
      )
    })

    await waitFor(
      () => {
        expect(result.current[2].opacity).toBeGreaterThan(0)
        expect(result.current[2].opacity).toBeLessThan(1)
      },
      { timeout: 300 },
    )

    await waitFor(
      () => {
        expect(result.current[2].opacity).toBe(1)
        expect(result.current[1].playState).toBe('finished')
      },
      { timeout: 800 },
    )
  })

  test('static3d binding resolves target and keeps style empty', async () => {
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
      result.current[0].__setElement?.(createMockElement() as any, 'static3d')
    })

    await waitFor(() => {
      expect(result.current[2]).toEqual({})
    })
  })

  test('default autoStart begins playback after bind', async () => {
    const { result } = renderHook(() =>
      useAnimation({
        duration: 0.2,
        tracks: [
          {
            property: 'opacity',
            keyframes: [
              { at: 0, value: 0 },
              { at: 0.2, value: 1 },
            ],
          },
        ],
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(
        createMockElement() as any,
        'spatialized2d',
      )
    })

    await waitFor(() => {
      expect(result.current[1].playState).not.toBe('idle')
    })
  })

  test('autoStart false does not play when only binding resolves', async () => {
    const { result } = renderHook(() =>
      useAnimation({
        duration: 0.2,
        autoStart: false,
        tracks: [
          {
            property: 'opacity',
            keyframes: [
              { at: 0, value: 0 },
              { at: 0.2, value: 1 },
            ],
          },
        ],
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(
        createMockElement() as any,
        'spatialized2d',
      )
    })

    expect(result.current[1].playState).toBe('idle')
    expect(result.current[2].opacity).toBe(0)
  })

  test('web pause syncs style to timeline sample at elapsed progress', async () => {
    vi.useFakeTimers()
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
      result.current[0].__setElement?.(
        createMockElement() as any,
        'spatialized2d',
      )
      result.current[1].play()
    })
    await act(async () => {
      vi.advanceTimersByTime(1500)
      await Promise.resolve()
    })
    await act(async () => {
      result.current[1].pause()
    })

    expect(String(result.current[2].transform)).toContain('translate3d(30px')
    expect(result.current[1].playState).toBe('paused')
    vi.useRealTimers()
  })

  test('runtime config update does not affect an in-flight web animation until next play', async () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ distance }) =>
        useAnimation({
          duration: 5,
          autoStart: false,
          tracks: [
            {
              property: 'transform.translate.x',
              keyframes: [
                { at: 0, value: 0 },
                { at: 5, value: distance },
              ],
              timingFunction: 'linear',
            },
          ],
        }),
      {
        initialProps: { distance: 100 },
      },
    )

    await act(async () => {
      result.current[0].__setElement?.(
        createMockElement() as any,
        'spatialized2d',
      )
      result.current[1].play()
    })
    await act(async () => {
      vi.advanceTimersByTime(1000)
      await Promise.resolve()
    })

    expect(readTranslateX(result.current[2])).toBeCloseTo(20, 0)

    rerender({ distance: 200 })
    expect(readTranslateX(result.current[2])).toBeCloseTo(20, 0)

    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
    })

    expect(readTranslateX(result.current[2])).toBeCloseTo(30, 0)
    vi.useRealTimers()
  })

  test('updated web config applies on the next play after the current session ends', async () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ distance }) =>
        useAnimation({
          duration: 5,
          autoStart: false,
          tracks: [
            {
              property: 'transform.translate.x',
              keyframes: [
                { at: 0, value: 0 },
                { at: 5, value: distance },
              ],
              timingFunction: 'linear',
            },
          ],
        }),
      {
        initialProps: { distance: 100 },
      },
    )

    await act(async () => {
      result.current[0].__setElement?.(
        createMockElement() as any,
        'spatialized2d',
      )
      result.current[1].play()
    })
    await act(async () => {
      vi.advanceTimersByTime(1000)
      await Promise.resolve()
    })
    expect(readTranslateX(result.current[2])).toBeCloseTo(20, 0)

    rerender({ distance: 200 })

    await act(async () => {
      result.current[1].stop()
      result.current[1].reset()
      result.current[1].play()
    })
    await act(async () => {
      vi.advanceTimersByTime(1000)
      await Promise.resolve()
    })

    expect(readTranslateX(result.current[2])).toBeCloseTo(40, 0)
    vi.useRealTimers()
  })

  test('timeline authoring shape compiles before playback', async () => {
    const { result } = renderHook(() =>
      useAnimation({
        duration: 4,
        autoStart: false,
        timeline: {
          '0%': {
            opacity: 0,
            transform: { translate: { y: 24 } },
            timingFunction: 'easeOut',
          },
          '12.5%': {
            opacity: 0.25,
          },
          '100%': {
            opacity: 1,
            transform: { translate: { y: 0 } },
          },
        },
      }),
    )

    expect(result.current[2].opacity).toBe(0)
    expect(String(result.current[2].transform)).toContain('24px')

    await act(async () => {
      result.current[0].__setElement?.(
        createMockElement() as any,
        'spatialized2d',
      )
      result.current[1].play()
    })

    await waitFor(() => {
      expect(result.current[1].playState).toBe('running')
    })
  })

  test('autoStart works under React StrictMode (dev remount)', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StrictMode>{children}</StrictMode>
    )

    const { result } = renderHook(() => useAnimation(SIMPLE_ENTRANCE_CONFIG), {
      wrapper,
    })

    await act(async () => {
      result.current[0].__setElement?.(
        createMockElement() as any,
        'spatialized2d',
      )
    })

    await waitFor(
      () => {
        expect(result.current[2].opacity).toBe(1)
        expect(result.current[1].playState).toBe('finished')
      },
      { timeout: 1200 },
    )
  })
})
