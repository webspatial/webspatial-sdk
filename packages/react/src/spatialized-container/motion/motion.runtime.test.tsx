/* @vitest-environment jsdom */

import React, { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

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
  return { id, kind: 'spatialized2d' as const }
}

function readTranslateX(style: { transform?: unknown }): number {
  const transform = String(style.transform ?? '')
  const match = transform.match(/translate3d\(([-\d.]+)px/)
  return match ? Number(match[1]) : 0
}

async function loadFallbackMotionModule() {
  vi.resetModules()
  vi.doMock('@webspatial/core-sdk', async () => {
    const actual = await vi.importActual('@webspatial/core-sdk')
    return {
      ...actual,
      supports: () => false,
    }
  })
  return import('./useAnimation')
}

async function loadBindingModule() {
  vi.resetModules()
  vi.doMock('@webspatial/core-sdk', () => ({
    Spatialized2DElement: class Spatialized2DElement {
      readonly kind = 'spatialized2d' as const

      constructor(readonly id: string) {}
    },
    SpatializedStatic3DElement: class SpatializedStatic3DElement {
      readonly kind = 'static3d' as const

      constructor(readonly id: string) {}
    },
    SpatializedDynamic3DElement: class SpatializedDynamic3DElement {
      readonly kind = 'dynamic3d' as const

      constructor(readonly id: string) {}
    },
  }))

  const core = await import('@webspatial/core-sdk')
  const motion = await import('./useBindSpatializedMotion')
  return {
    ...core,
    useBindSpatializedMotion: motion.useBindSpatializedMotion,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  vi.doUnmock('@webspatial/core-sdk')
  vi.resetModules()
})

describe('motion runtime behavior', () => {
  describe('useAnimation fallback behavior', () => {
    test('exposes the React-facing playback api shape', async () => {
      const { useAnimation } = await loadFallbackMotionModule()
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

    test('binding keeps the fallback style outlet empty and idle when native support is unavailable', async () => {
      const { useAnimation } = await loadFallbackMotionModule()
      const { result } = renderHook(() => useAnimation(SIMPLE_ENTRANCE_CONFIG))

      expect(result.current[2].opacity).toBeUndefined()
      expect(result.current[2].transform).toBeUndefined()

      await act(async () => {
        result.current[0].__setElement?.(createMockElement() as never)
      })

      expect(result.current[1].playState).toBe('idle')
      expect(result.current[2].opacity).toBeUndefined()
      expect(result.current[2].transform).toBeUndefined()
    })

    test('static3d binding resolves target while fallback style remains empty', async () => {
      const { useAnimation } = await loadFallbackMotionModule()
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
        result.current[0].__setElement?.({
          ...createMockElement(),
          kind: 'static3d' as const,
        } as never)
      })

      expect(result.current[1].playState).toBe('idle')
      expect(result.current[2].transform).toBeUndefined()
    })

    test('pre-bind play still runs after bind when autoStart is false', async () => {
      const { useAnimation } = await loadFallbackMotionModule()
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
        result.current[0].__setElement?.(createMockElement() as never)
      })

      await waitFor(() => {
        expect(result.current[1].playState).not.toBe('idle')
      })
    })

    test('one animation binding only attaches to one component', async () => {
      const { useAnimation } = await loadFallbackMotionModule()
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
        result.current[0].__setElement?.(first as never)
        result.current[0].__setElement?.(second as never)
      })

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('already attached to another component'),
      )
    })

    test('queued play and pause do not advance without native support', async () => {
      vi.useFakeTimers()
      const { useAnimation } = await loadFallbackMotionModule()
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
        result.current[0].__setElement?.(createMockElement() as never)
        result.current[1].play()
      })
      await act(async () => {
        vi.advanceTimersByTime(1500)
        await Promise.resolve()
      })
      await act(async () => {
        result.current[1].pause()
      })

      expect(result.current[2].transform).toBeUndefined()
      expect(result.current[1].playState).toBe('queued')
      expect(rafSpy).not.toHaveBeenCalled()
    })

    test('updated config remains queued for the next play after stop and reset', async () => {
      vi.useFakeTimers()
      const { useAnimation } = await loadFallbackMotionModule()
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
        result.current[0].__setElement?.(createMockElement() as never)
        result.current[1].play()
      })
      rerender({ distance: 200 })

      await act(async () => {
        result.current[1].stop()
        result.current[1].reset()
        result.current[1].play()
      })

      expect(readTranslateX(result.current[2])).toBeCloseTo(0, 0)
    })

    test('autoStart remains idle under React StrictMode without native support', async () => {
      const { useAnimation } = await loadFallbackMotionModule()
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StrictMode>{children}</StrictMode>
      )

      const { result } = renderHook(
        () => useAnimation(SIMPLE_ENTRANCE_CONFIG),
        {
          wrapper,
        },
      )

      await act(async () => {
        result.current[0].__setElement?.(createMockElement() as never)
      })

      expect(result.current[2].opacity).toBeUndefined()
      expect(result.current[2].transform).toBeUndefined()
      expect(result.current[1].playState).toBe('idle')
    })
  })

  describe('useBindSpatializedMotion', () => {
    test.each([
      [
        'Spatialized2DElement',
        { id: 'portal-1', kind: 'spatialized2d' as const },
        'spatialized2d',
      ],
      [
        'SpatializedStatic3DElement',
        { id: 'model-1', kind: 'static3d' as const },
        'static3d',
      ],
      [
        'SpatializedDynamic3DElement',
        { id: 'reality-1', kind: 'dynamic3d' as const },
        'dynamic3d',
      ],
    ] as const)(
      'binds supported runtime %s to %s',
      async (_label, element, kind) => {
        const { useBindSpatializedMotion } = await loadBindingModule()
        const binding = {
          __kind: 'spatializedMotion' as const,
          __setElement: vi.fn(),
          __onUnbind: vi.fn(),
        }

        renderHook(() =>
          useBindSpatializedMotion({
            binding,
            element: element as never,
          }),
        )

        expect(binding.__setElement).toHaveBeenCalledTimes(1)
        expect(binding.__setElement).toHaveBeenCalledWith(element)
      },
    )

    test('unbinds on unmount after a supported bind', async () => {
      const { useBindSpatializedMotion } = await loadBindingModule()
      const binding = {
        __kind: 'spatializedMotion' as const,
        __setElement: vi.fn(),
        __onUnbind: vi.fn(),
      }
      const element = {
        id: 'portal-unmount',
        kind: 'spatialized2d' as const,
      }

      const { unmount } = renderHook(() =>
        useBindSpatializedMotion({
          binding,
          element: element as never,
        }),
      )

      unmount()

      expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
      expect(binding.__onUnbind).toHaveBeenCalledWith(element)
      expect(binding.__setElement).toHaveBeenCalledTimes(1)
    })

    test('unbind cleanup uses the element captured by that effect', async () => {
      const { useBindSpatializedMotion } = await loadBindingModule()
      const first = {
        id: 'portal-first',
        kind: 'spatialized2d' as const,
      }
      const second = {
        id: 'portal-second',
        kind: 'spatialized2d' as const,
      }
      const binding = {
        __kind: 'spatializedMotion' as const,
        __setElement: vi.fn(),
        __onUnbind: vi.fn(),
      }

      const { rerender, unmount } = renderHook(
        ({ element }) =>
          useBindSpatializedMotion({
            binding,
            element: element as never,
          }),
        {
          initialProps: { element: first },
        },
      )

      rerender({ element: second })
      unmount()

      expect(binding.__onUnbind).toHaveBeenNthCalledWith(1, first)
      expect(binding.__onUnbind).toHaveBeenNthCalledWith(2, second)
    })

    test('binds supported elements by kind without relying on instanceof', async () => {
      const { useBindSpatializedMotion } = await loadBindingModule()
      const binding = {
        __kind: 'spatializedMotion' as const,
        __setElement: vi.fn(),
        __onUnbind: vi.fn(),
      }
      const element = {
        id: 'kind-only-1',
        kind: 'spatialized2d' as const,
        createAnimation: vi.fn(),
        updateProperties: vi.fn(),
      }

      renderHook(() =>
        useBindSpatializedMotion({
          binding,
          element: element as never,
        }),
      )

      expect(binding.__setElement).toHaveBeenCalledTimes(1)
      expect(binding.__setElement).toHaveBeenCalledWith(element)
    })

    test.each([
      ['HTMLElement target', document.createElement('div')],
      ['unrecognized object', { id: 'unknown-1' }],
    ] as const)('does not bind unsupported %s', async (_label, element) => {
      const { useBindSpatializedMotion } = await loadBindingModule()
      const binding = {
        __kind: 'spatializedMotion' as const,
        __setElement: vi.fn(),
        __onUnbind: vi.fn(),
      }

      renderHook(() =>
        useBindSpatializedMotion({
          binding,
          element: element as never,
        }),
      )

      expect(binding.__setElement).not.toHaveBeenCalled()
      expect(binding.__onUnbind).not.toHaveBeenCalled()
    })

    test('does not rebind when unrelated render inputs change', async () => {
      const core = await loadBindingModule()
      const binding = {
        __kind: 'spatializedMotion' as const,
        __setElement: vi.fn(),
        __onUnbind: vi.fn(),
      }
      const element = new core.SpatializedStatic3DElement('portal-2')

      const { rerender, unmount } = renderHook(
        ({ active, revision }) => {
          void revision
          core.useBindSpatializedMotion({
            binding: active ? (binding as never) : undefined,
            element: active ? (element as never) : null,
          })
        },
        {
          initialProps: { active: true, revision: 1 },
        },
      )

      expect(binding.__setElement).toHaveBeenCalledTimes(1)
      expect(binding.__onUnbind).not.toHaveBeenCalled()

      rerender({ active: true, revision: 2 })

      expect(binding.__setElement).toHaveBeenCalledTimes(1)
      expect(binding.__onUnbind).not.toHaveBeenCalled()

      unmount()

      expect(binding.__onUnbind).toHaveBeenCalledTimes(1)
      expect(binding.__onUnbind).toHaveBeenCalledWith(element)
    })
  })
})
