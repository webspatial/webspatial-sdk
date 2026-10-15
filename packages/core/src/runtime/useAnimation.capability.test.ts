import { describe, expect, test, vi, beforeEach } from 'vitest'

describe('supports("useAnimation")', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('plain browser: supports("useAnimation") is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
  })

  test('visionOS WSAppShell/1.5.0: supports("useAnimation") is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
  })

  test('visionOS WSAppShell/1.6.0: supports("useAnimation") is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 (KHTML, like Gecko) WSAppShell/1.6.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
  })

  test('visionOS WSAppShell/1.7.0: supports("useAnimation") is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 (KHTML, like Gecko) WSAppShell/1.7.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
  })

  test('visionOS WSAppShell/1.8.0: supports("useAnimation") is true', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 (KHTML, like Gecko) WSAppShell/1.8.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(true)
  })

  test('Puppeteer UA: supports("useAnimation") is true (debug mode enables all)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Puppeteer WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(true)
  })

  test('visionOS WS_SHELL_VERSION placeholder: supports("useAnimation") is true (debug mode)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/WS_SHELL_VERSION WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(true)
  })

  test('picoOS PicoWebApp/0.2.2: supports("useAnimation") is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.2.2 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
  })

  test('picoOS PicoWebApp/0.3.1: supports("useAnimation") is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.3.1 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
  })

  test('picoOS PicoWebApp/0.4.90: supports("useAnimation") is true', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.4.90 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(true)
  })
})

describe('supports("useAnimation", target tokens)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('plain browser: supports("useAnimation") and target tokens are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
    expect(supports('useAnimation', ['static3d'])).toBe(false)
    expect(supports('useAnimation', ['dynamic3d'])).toBe(false)
  })

  test('visionOS WSAppShell/1.5.0: supports("useAnimation") and target tokens are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
    expect(supports('useAnimation', ['static3d'])).toBe(false)
    expect(supports('useAnimation', ['dynamic3d'])).toBe(false)
  })

  test('visionOS WSAppShell/1.6.0: supports("useAnimation") and target tokens are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 (KHTML, like Gecko) WSAppShell/1.6.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
    expect(supports('useAnimation', ['static3d'])).toBe(false)
    expect(supports('useAnimation', ['dynamic3d'])).toBe(false)
  })

  test('Puppeteer UA: supports("useAnimation") is true while all sub-tokens are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Puppeteer WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(true)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
    expect(supports('useAnimation', ['static3d'])).toBe(false)
    expect(supports('useAnimation', ['dynamic3d'])).toBe(false)
  })

  test('visionOS WS_SHELL_VERSION placeholder: supports("useAnimation") is true while all sub-tokens are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/WS_SHELL_VERSION WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(true)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
    expect(supports('useAnimation', ['static3d'])).toBe(false)
    expect(supports('useAnimation', ['dynamic3d'])).toBe(false)
  })

  test('picoOS PicoWebApp/0.1.1: supports("useAnimation") and target tokens are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.1.1 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
    expect(supports('useAnimation', ['static3d'])).toBe(false)
    expect(supports('useAnimation', ['dynamic3d'])).toBe(false)
  })

  test('picoOS PicoWebApp/0.1.2: supports("useAnimation") and target tokens are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.1.2 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
    expect(supports('useAnimation', ['static3d'])).toBe(false)
    expect(supports('useAnimation', ['dynamic3d'])).toBe(false)
  })

  test('picoOS PicoWebApp/0.2.2: supports("useAnimation") and all sub-tokens are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.2.2 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
    expect(supports('useAnimation', ['static3d'])).toBe(false)
    expect(supports('useAnimation', ['dynamic3d'])).toBe(false)
  })

  test('visionOS WSAppShell/1.8.0: supports("useAnimation") is true while all sub-tokens are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 (KHTML, like Gecko) WSAppShell/1.8.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(true)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
    expect(supports('useAnimation', ['static3d'])).toBe(false)
    expect(supports('useAnimation', ['dynamic3d'])).toBe(false)
  })

  test('visionOS WSAppShell/1.7.0: supports("useAnimation") and all sub-tokens are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 (KHTML, like Gecko) WSAppShell/1.7.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
    expect(supports('useAnimation', ['static3d'])).toBe(false)
    expect(supports('useAnimation', ['dynamic3d'])).toBe(false)
  })
})

describe('useAnimation sub-tokens', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('all useAnimation sub-tokens return false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Puppeteer WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(true)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
    expect(supports('useAnimation', ['static3d'])).toBe(false)
    expect(supports('useAnimation', ['dynamic3d'])).toBe(false)
    expect(supports('useAnimation', ['unknown' as any])).toBe(false)
    expect(supports('useAnimation', ['opacity' as any])).toBe(false)
  })
})
