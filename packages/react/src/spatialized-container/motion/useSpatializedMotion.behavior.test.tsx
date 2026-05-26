import { describe, expect, test, vi } from 'vitest'
import React, { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useSpatializedMotion } from './useSpatializedMotion'

const SIMPLE_ENTRANCE_CONFIG = {
  kind: 'spatialized2d' as const,
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

describe('useSpatializedMotion (spatialized2d) integration', () => {
  test('simple() autoStart animates before finishing', async () => {
    const { result } = renderHook(() =>
      useSpatializedMotion.simple(SIMPLE_ENTRANCE_CONFIG),
    )

    expect(result.current.kind).toBe('spatialized2d')
    if (result.current.kind !== 'spatialized2d') return
    expect(result.current.style.opacity).toBe(0)
    expect(String(result.current.style.transform)).toContain('40px')

    await waitFor(
      () => {
        expect(result.current.kind).toBe('spatialized2d')
        if (result.current.kind !== 'spatialized2d') return
        const opacity = result.current.style.opacity as number
        expect(opacity).toBeGreaterThan(0)
        expect(opacity).toBeLessThan(1)
      },
      { timeout: 300 },
    )

    await waitFor(
      () => {
        expect(result.current.kind).toBe('spatialized2d')
        if (result.current.kind !== 'spatialized2d') return
        expect(result.current.style.opacity).toBe(1)
        expect(result.current.api.playState).toBe('finished')
      },
      { timeout: 800 },
    )
  })

  test('web pause syncs style to timeline sample at elapsed progress', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useSpatializedMotion({
        kind: 'spatialized2d',
        duration: 5,
        autoStart: false,
        tracks: [
          {
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 5, value: 100 },
            ],
            easing: 'linear',
          },
        ],
      }),
    )

    await act(async () => {
      result.current.api.play()
    })
    await act(async () => {
      vi.advanceTimersByTime(1500)
      await Promise.resolve()
    })
    await act(async () => {
      result.current.api.pause()
    })

    expect(result.current.kind).toBe('spatialized2d')
    if (result.current.kind !== 'spatialized2d') return
    expect(String(result.current.style.transform)).toContain('translate3d(30px')
    expect(result.current.api.playState).toBe('paused')
    vi.useRealTimers()
  })

  test('autoStart works under React StrictMode (dev remount)', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StrictMode>{children}</StrictMode>
    )

    const { result } = renderHook(
      () => useSpatializedMotion.simple(SIMPLE_ENTRANCE_CONFIG),
      { wrapper },
    )

    await waitFor(
      () => {
        expect(result.current.kind).toBe('spatialized2d')
        if (result.current.kind !== 'spatialized2d') return
        expect(result.current.style.opacity).toBe(1)
        expect(result.current.api.playState).toBe('finished')
      },
      { timeout: 1200 },
    )
  })
})
