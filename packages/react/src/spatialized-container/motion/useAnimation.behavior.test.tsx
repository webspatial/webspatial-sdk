import { describe, expect, test, vi } from 'vitest'
import React, { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'

vi.mock('@webspatial/core-sdk', async () => {
  const actual = await vi.importActual('@webspatial/core-sdk')
  return {
    ...actual,
    supports: () => false,
  }
})

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
  test('exposes the React-facing playback api shape', () => {
    const { result } = renderHook(() => useAnimation(SIMPLE_ENTRANCE_CONFIG))
    const api = result.current[1]

    expect(api).toEqual(
      expect.objectContaining({
        play: expect.any(Function),
        pause: expect.any(Function),
        resume: expect.any(Function),
        stop: expect.any(Function),
        reset: expect.any(Function),
        finish: expect.any(Function),
      }),
    )
    expect(api.playState).toBe('idle')
    expect(api.isAnimating).toBe(false)
    expect(api.isPaused).toBe(false)
    expect(api.finished).toBe(false)
  })

  test('2D bind keeps the initial style when native support is unavailable', async () => {
    const { result } = renderHook(() => useAnimation(SIMPLE_ENTRANCE_CONFIG))

    expect(result.current[2].opacity).toBe(0)
    expect(String(result.current[2].transform)).toContain('40px')

    await act(async () => {
      result.current[0].__setElement?.(
        createMockElement() as any,
        'spatialized2d',
      )
    })

    expect(result.current[1].playState).toBe('idle')
    expect(result.current[2].opacity).toBe(0)
    expect(String(result.current[2].transform)).toContain('40px')
  })

  test('static3d binding resolves target and keeps the initial transform style', async () => {
    const { result } = renderHook(() =>
      useAnimation({
        duration: 1,
        autoStart: false,
        tracks: [
          {
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 1, value: 100 },
            ],
          },
        ],
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(createMockElement() as any, 'static3d')
    })

    await waitFor(() => {
      expect(String(result.current[2].transform)).toContain(
        'translate3d(0px, 0px, 0px)',
      )
    })
  })

  test('default autoStart remains idle without native support', async () => {
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

    expect(result.current[1].playState).toBe('idle')
    expect(result.current[2].opacity).toBe(0)
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

  test('pre-bind play still runs after bind when autoStart is false', async () => {
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
      result.current[1].play()
    })
    expect(result.current[1].playState).toBe('queued')

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

  test('one animation binding only attaches to one component', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const first = createMockElement('motion-element-1')
    const second = createMockElement('motion-element-2')
    const { result } = renderHook(() =>
      useAnimation({
        duration: 1,
        autoStart: false,
        tracks: [
          {
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 1, value: 10 },
            ],
          },
        ],
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(first as any, 'spatialized2d')
      result.current[0].__setElement?.(second as any, 'spatialized2d')
    })

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('already attached to another component'),
    )
    warnSpy.mockRestore()
  })

  test('queued play/pause does not advance without native support', async () => {
    vi.useFakeTimers()
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame')
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

    expect(String(result.current[2].transform)).toContain('translate3d(0px')
    expect(result.current[1].playState).toBe('queued')
    expect(rafSpy).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  test('runtime config update keeps the current style frozen without native support', async () => {
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
    expect(readTranslateX(result.current[2])).toBeCloseTo(0, 0)

    rerender({ distance: 200 })
    expect(readTranslateX(result.current[2])).toBeCloseTo(0, 0)
    vi.useRealTimers()
  })

  test('updated config remains queued for the next play after stop/reset', async () => {
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
    rerender({ distance: 200 })

    await act(async () => {
      result.current[1].stop()
      result.current[1].reset()
      result.current[1].play()
    })
    expect(readTranslateX(result.current[2])).toBeCloseTo(0, 0)
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

    expect(result.current[1].playState).toBe('queued')
  })

  test('autoStart remains idle under React StrictMode without native support', async () => {
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

    expect(result.current[2].opacity).toBe(0)
    expect(String(result.current[2].transform)).toContain('40px')
    expect(result.current[1].playState).toBe('idle')
  })
})
