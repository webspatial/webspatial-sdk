import { describe, expect, test, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { supports } from '@webspatial/core-sdk'

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
        to: { position: { x: 1, y: 0, z: 0 } },
        autoStart: false,
      } as any),
    )

    const [animatedProps, api] = result.current
    expect(animatedProps).toBeDefined()
    expect(api).toHaveProperty('play')
    expect(api).toHaveProperty('pause')
    expect(api).toHaveProperty('cancel')
  })

  test('play remains native-driven without an entity capability token', async () => {
    expect(supports('useAnimation', ['entity'])).toBe(false)
    const { result } = renderHook(() =>
      useEntityAnimation({
        to: { position: { x: 1, y: 0, z: 0 } },
        autoStart: false,
      } as any),
    )

    await act(async () => {
      result.current[1].play()
      await Promise.resolve()
    })

    expect(result.current[1].playState).toBe('queued')
    expect(result.current[1].isAnimating).toBe(true)
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
