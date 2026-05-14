import { describe, expect, test, vi, beforeEach } from 'vitest'

describe('supports("useAnimation", ["entity"])', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('plain browser: supports("useAnimation", ["entity"]) is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation', ['entity'])).toBe(false)
  })

  test('visionOS WSAppShell/1.5.0: supports("useAnimation", ["entity"]) is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation', ['entity'])).toBe(false)
  })

  test('visionOS WSAppShell/1.6.0: supports("useAnimation", ["entity"]) is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 (KHTML, like Gecko) WSAppShell/1.6.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation', ['entity'])).toBe(false)
  })

  test('Puppeteer UA: supports("useAnimation", ["entity"]) is true (debug mode enables all)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Puppeteer WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation', ['entity'])).toBe(true)
  })

  test('visionOS WS_SHELL_VERSION placeholder: supports("useAnimation", ["entity"]) is true (debug mode)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/WS_SHELL_VERSION WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation', ['entity'])).toBe(true)
  })

  test('useAnimation only supports entity sub-token', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Puppeteer WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    // ["entity"] is the only supported sub-token
    expect(supports('useAnimation', ['entity'])).toBe(true)
    // Unknown sub-tokens should return false
    expect(supports('useAnimation', ['unknown' as any])).toBe(false)
    expect(supports('useAnimation', ['opacity' as any])).toBe(false)
  })
})
