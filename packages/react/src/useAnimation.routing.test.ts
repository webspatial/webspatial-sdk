import { describe, expect, test, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('@webspatial/core-sdk', async () => {
  const actual = await vi.importActual('@webspatial/core-sdk')
  return {
    ...actual,
    supports: (name: string, tokens?: readonly string[]) => {
      if (name === 'useAnimation' && tokens?.includes('entity')) {
        return true
      }
      return false
    },
  }
})

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

describe('root export compatibility', () => {
  test('exports useAnimation and useEntityAnimation from the package root', async () => {
    vi.stubGlobal('__WEBSPATIAL_REACT_SDK_VERSION__', 'test')
    const mod = await import('./index')
    expect(typeof mod.useAnimation).toBe('function')
    expect(typeof mod.useEntityAnimation).toBe('function')
    expect('useSpatializedMotion' in mod).toBe(false)
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
