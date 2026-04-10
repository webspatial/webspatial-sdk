import { describe, expect, test, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { resetRuntimeCacheForTests } from '../../core/src/runtime/supports'

describe('WebSpatialRuntime gates (plain browser UA)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    } as Navigator)
  })

  test('useMetrics throws when useMetrics unsupported', async () => {
    resetRuntimeCacheForTests()
    const { useMetrics } = await import('./useMetrics')
    expect(() => {
      renderHook(() => useMetrics())
    }).toThrow(/useMetrics/)
  })

  test('convertCoordinate rejects when unsupported', async () => {
    resetRuntimeCacheForTests()
    const { convertCoordinate } = await import('./utils/convertCoordinate')
    await expect(
      convertCoordinate({ x: 0, y: 0, z: 0 }, { from: window, to: window }),
    ).rejects.toMatchObject({
      capability: 'convertCoordinate',
    })
  })
})
