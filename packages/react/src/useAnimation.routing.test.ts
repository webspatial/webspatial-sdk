import { describe, expect, test, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { resolveAnimationKind } from './useAnimation'

// Mock supports() to return true for both entity and element sub-tokens
vi.mock('@webspatial/core-sdk', async () => {
  const actual = await vi.importActual('@webspatial/core-sdk')
  return {
    ...actual,
    supports: (name: string, tokens?: readonly string[]) => {
      if (name === 'useAnimation') {
        if (tokens && tokens.includes('entity')) return true
        if (tokens && tokens.includes('element')) return true
      }
      return false
    },
  }
})

// Import after mock
const { useAnimation } = await import('./useAnimation')

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

describe('resolveAnimationKind', () => {
  test('entity keys → entity kind', () => {
    expect(resolveAnimationKind({ to: { position: { x: 1 } } })).toBe('entity')
    expect(resolveAnimationKind({ to: { rotation: { x: 90 } } })).toBe('entity')
    expect(resolveAnimationKind({ to: { scale: { x: 2 } } })).toBe('entity')
    expect(
      resolveAnimationKind({
        to: { position: { x: 1 }, rotation: { y: 45 } },
      }),
    ).toBe('entity')
  })

  test('SpatialDiv keys → spatialDiv kind', () => {
    expect(resolveAnimationKind({ to: { opacity: 0.5 } })).toBe('spatialDiv')
    expect(
      resolveAnimationKind({
        to: { transform: { translate: { x: 10 } } },
      }),
    ).toBe('spatialDiv')
    expect(
      resolveAnimationKind({
        to: { opacity: 1, transform: { rotate: { z: 90 } } },
      }),
    ).toBe('spatialDiv')
  })

  test('mixed entity and SpatialDiv keys → throws', () => {
    expect(() =>
      resolveAnimationKind({
        to: { position: { x: 1 }, opacity: 0.5 },
      }),
    ).toThrow(/mutually exclusive/)

    expect(() =>
      resolveAnimationKind({
        to: { scale: { x: 2 }, transform: { translate: { y: 10 } } },
      }),
    ).toThrow(/mutually exclusive/)
  })
})

describe('useAnimation hook routing', () => {
  test('entity config dispatches to entity branch', () => {
    const { result } = renderHook(() =>
      useAnimation({
        to: { position: { x: 1, y: 0, z: 0 } },
        duration: 0.5,
        autoStart: false,
      }),
    )
    const [animatedProps, api] = result.current
    // Entity animation returns __kind === undefined (entity branch doesn't use __kind)
    // Check that it has entity-specific shape
    expect(api).toHaveProperty('play')
    expect(api).toHaveProperty('pause')
    expect(api).toHaveProperty('cancel')
    expect(animatedProps).toBeDefined()
  })

  test('SpatialDiv config dispatches to SpatialDiv branch', () => {
    const { result } = renderHook(() =>
      useAnimation({
        to: { opacity: 0.5 },
        duration: 0.3,
        autoStart: false,
      }),
    )
    const [animatedProps, api] = result.current
    // SpatialDiv branch returns __kind = 'spatialDiv'
    expect((animatedProps as any).__kind).toBe('spatializedMotion')
    expect(api).toHaveProperty('play')
    expect(api).toHaveProperty('pause')
    expect(api).toHaveProperty('cancel')
    expect(api).toHaveProperty('isAnimating')
    expect(api).toHaveProperty('isPaused')
    expect(api).toHaveProperty('playState')
    expect(api).toHaveProperty('finished')
  })

  test('SpatialDiv transform config dispatches to SpatialDiv branch', () => {
    const { result } = renderHook(() =>
      useAnimation({
        to: { transform: { translate: { x: 100, y: 50 } } },
        duration: 1.0,
        autoStart: false,
      }),
    )
    const [animatedProps] = result.current
    expect((animatedProps as any).__kind).toBe('spatializedMotion')
  })

  test('mixed keys in useAnimation throws during render', () => {
    expectRenderHookToThrow(() => {
      renderHook(() =>
        useAnimation({
          to: { position: { x: 1 }, opacity: 0.5 } as any,
          duration: 0.5,
        }),
      )
    })
  })

  test('__kind binding validation: spatialized segment animatedProps has __kind = spatializedMotion', () => {
    const { result } = renderHook(() =>
      useAnimation({
        to: { opacity: 1 },
        autoStart: false,
      }),
    )
    const [animatedProps] = result.current
    expect((animatedProps as any).__kind).toBe('spatializedMotion')
    expect((animatedProps as any).__animationObjectId).toBeTruthy()
  })
})
