import { describe, expect, test } from 'vitest'
import React, { StrictMode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { useSpatialDivMotion } from './useSpatialDivMotion'

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

describe('useSpatialDivMotion integration', () => {
  test('simple() autoStart animates before finishing', async () => {
    const { result } = renderHook(() =>
      useSpatialDivMotion.simple(SIMPLE_ENTRANCE_CONFIG),
    )

    expect(result.current.style.opacity).toBe(0)
    expect(String(result.current.style.transform)).toContain('40px')

    await waitFor(
      () => {
        const opacity = result.current.style.opacity as number
        expect(opacity).toBeGreaterThan(0)
        expect(opacity).toBeLessThan(1)
      },
      { timeout: 300 },
    )

    await waitFor(
      () => {
        expect(result.current.style.opacity).toBe(1)
        expect(result.current.api.playState).toBe('finished')
      },
      { timeout: 800 },
    )
  })

  test('autoStart works under React StrictMode (dev remount)', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StrictMode>{children}</StrictMode>
    )

    const { result } = renderHook(
      () => useSpatialDivMotion.simple(SIMPLE_ENTRANCE_CONFIG),
      { wrapper },
    )

    await waitFor(
      () => {
        expect(result.current.style.opacity).toBe(1)
        expect(result.current.api.playState).toBe('finished')
      },
      { timeout: 1200 },
    )
  })
})
