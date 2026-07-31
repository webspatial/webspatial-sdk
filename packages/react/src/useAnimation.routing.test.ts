import { describe, expect, expectTypeOf, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { supports } from '@webspatial/core-sdk'
import type {
  EntityMotionConfig,
  EntityMotionProps,
  EntityPlaybackApi,
} from '@webspatial/core-sdk'
import type { EntityMotionAnimation } from './experimental'

const { useEntityAnimation } = await import('./reality/hooks/useAnimation')

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

describe('useEntityAnimation hook', () => {
  test('entity config returns entity api', () => {
    const { result } = renderHook(() =>
      useEntityAnimation({
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
        autoStart: false,
      }),
    )

    const [animatedProps, api, entityProps] = result.current
    expect(animatedProps).toBeDefined()
    expect(entityProps).toEqual({})
    expect(api).toHaveProperty('play')
    expect(api).toHaveProperty('pause')
    expect(api).toHaveProperty('stop')
    expect(api).toHaveProperty('reset')
    expect(api).toHaveProperty('finish')
    expect(api).toHaveProperty('set')
  })

  test('play remains native-driven without an entity capability token', async () => {
    expect(supports('useAnimation', ['entity'])).toBe(false)
    const { result } = renderHook(() =>
      useEntityAnimation({
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
        autoStart: false,
      }),
    )

    await act(async () => {
      result.current[1].play()
      await Promise.resolve()
    })

    expect(result.current[1].playState).toBe('queued')
    expect(result.current[1].isAnimating).toBe(false)
  })

  test('spatialized visual keys are rejected by entity validation', () => {
    expectRenderHookToThrow(() => {
      renderHook(() =>
        useEntityAnimation({
          to: { opacity: 0.5 } as any,
          autoStart: false,
        } as any),
      )
    })
  })
})

describe('experimental export compatibility', () => {
  test('exports animation hooks only from the experimental entry', async () => {
    vi.stubGlobal('__WEBSPATIAL_REACT_SDK_VERSION__', 'test')
    const root = await import('./index')
    const experimental = await import('./experimental')
    expect('useAnimation' in root).toBe(false)
    expect('useEntityAnimation' in root).toBe(false)
    expect(typeof experimental.useAnimation).toBe('function')
    expect(typeof experimental.useEntityAnimation).toBe('function')
    expectTypeOf(experimental.useEntityAnimation)
      .parameter(0)
      .toEqualTypeOf<EntityMotionConfig>()
    expectTypeOf(experimental.useEntityAnimation).returns.toEqualTypeOf<
      [EntityMotionAnimation, EntityPlaybackApi, EntityMotionProps]
    >()
  })

  test('keeps the Entity motion hook name off the spatial implementation entry', async () => {
    const spatial = await import('./spatial')
    expect('useEntityAnimation' in spatial).toBe(false)
    expect(typeof spatial.__useEntityAnimation).toBe('function')
  })

  test('exports useAnimation from spatialized-container', async () => {
    const mod = await import('./spatialized-container')
    expect(typeof mod.useAnimation).toBe('function')
  })

  test('does not export useAnimation from useAnimation module', async () => {
    const mod = await import('./useAnimation')
    expect('useAnimation' in mod).toBe(false)
    expect(typeof mod.useEntityAnimation).toBe('function')
  })
})
