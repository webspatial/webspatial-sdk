import { describe, expect, test, vi } from 'vitest'
import React, { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useSpatializedMotion } from './useSpatializedMotion'

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

describe('useSpatializedMotion tuple api', () => {
  test('2D bind starts playback and updates style', async () => {
    const { result } = renderHook(() =>
      useSpatializedMotion(SIMPLE_ENTRANCE_CONFIG),
    )

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
      useSpatializedMotion({
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

  test('web pause syncs style to timeline sample at elapsed progress', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useSpatializedMotion({
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

  test('timeline authoring shape compiles before playback', async () => {
    const { result } = renderHook(() =>
      useSpatializedMotion({
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

    const { result } = renderHook(
      () => useSpatializedMotion(SIMPLE_ENTRANCE_CONFIG),
      { wrapper },
    )

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
