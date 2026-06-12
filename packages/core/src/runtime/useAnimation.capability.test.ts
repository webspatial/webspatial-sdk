import { describe, expect, test, vi, beforeEach } from 'vitest'

describe('supports("useAnimation", ["entity"])', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('plain browser: supports("useAnimation") and supports("useAnimation", ["entity"]) are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
  })

  test('visionOS WSAppShell/1.5.0: supports("useAnimation") and supports("useAnimation", ["entity"]) are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
  })

  test('visionOS WSAppShell/1.6.0: supports("useAnimation") and supports("useAnimation", ["entity"]) are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 (KHTML, like Gecko) WSAppShell/1.6.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
  })

  test('visionOS WSAppShell/1.7.0: supports("useAnimation") is true', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 (KHTML, like Gecko) WSAppShell/1.7.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(true)
    expect(supports('useAnimation', ['entity'])).toBe(true)
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

  test('picoOS PicoWebApp/0.2.2: supports("useAnimation", ["entity"]) is true', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.2.2 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation', ['entity'])).toBe(true)
  })
})

describe('supports("useAnimation", ["element"])', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('plain browser: supports("useAnimation", ["element"]) is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation', ['element'])).toBe(false)
  })

  test('visionOS WSAppShell/1.5.0: supports("useAnimation", ["element"]) is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation', ['element'])).toBe(false)
  })

  test('visionOS WSAppShell/1.6.0: supports("useAnimation", ["element"]) is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 (KHTML, like Gecko) WSAppShell/1.6.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation', ['element'])).toBe(false)
  })

  test('Puppeteer UA: supports("useAnimation", ["element"]) is true (debug mode enables all)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Puppeteer WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation', ['element'])).toBe(true)
  })

  test('visionOS WS_SHELL_VERSION placeholder: supports("useAnimation", ["element"]) is true (debug mode)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/WS_SHELL_VERSION WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation', ['element'])).toBe(true)
  })

  test('picoOS PicoWebApp/0.1.1: supports("useAnimation", ["element"]) is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.1.1 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation', ['element'])).toBe(false)
  })

  test('picoOS PicoWebApp/0.1.2: supports("useAnimation", ["element"]) is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.1.2 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation', ['element'])).toBe(false)
  })

  test('picoOS PicoWebApp/0.2.2: supports("useAnimation", ["element"]) is true', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.2.2 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation', ['element'])).toBe(true)
  })

  test('entity and element sub-tokens are independent', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    // visionOS 1.5.0 supports neither entity nor element
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
  })
})

describe('useAnimation sub-tokens: unknown tokens', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('unknown sub-tokens return false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Puppeteer WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    // Known sub-tokens
    expect(supports('useAnimation', ['entity'])).toBe(true)
    expect(supports('useAnimation', ['element'])).toBe(true)
    // Unknown sub-tokens should return false
    expect(supports('useAnimation', ['unknown' as any])).toBe(false)
    expect(supports('useAnimation', ['opacity' as any])).toBe(false)
  })
})
