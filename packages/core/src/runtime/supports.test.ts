import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

describe('getRuntime / supports', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('plain browser: no shell token → supports is false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('Model')).toBe(false)
    expect(supports('useMetrics')).toBe(false)
  })

  test('like Quest without Pico tokens does not force picoos (WSAppShell + no Mac → type null)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, getRuntime, resetRuntimeCacheForTests } = await import(
      './supports'
    )
    resetRuntimeCacheForTests()
    const rt = getRuntime()
    expect(rt.type).toBe(null)
    expect(rt.shellVersion).toBe('1.5.0')
    expect(supports('Model')).toBe(false)
  })

  test('WSAppShell without Mac OS X: not visionos; spatial supports false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 WSAppShell/9.9.9 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, getRuntime, resetRuntimeCacheForTests } = await import(
      './supports'
    )
    resetRuntimeCacheForTests()
    const rt = getRuntime()
    expect(rt.type).toBe(null)
    expect(rt.shellVersion).toBe('9.9.9')
    expect(supports('Model')).toBe(false)
  })

  test('visionOS UA with WSAppShell: resolves and Model can be true (stub table)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 (KHTML, like Gecko) WSAppShell/1.5.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, getRuntime, resetRuntimeCacheForTests } = await import(
      './supports'
    )
    resetRuntimeCacheForTests()
    const rt = getRuntime()
    expect(rt.type).toBe('visionos')
    expect(rt.shellVersion).toBe('1.5.0')
    expect(supports('Model')).toBe(true)
    expect(supports('xrInnerDepth')).toBe(true)
    expect(supports('xrOuterDepth')).toBe(true)
    expect(supports('UnknownThing' as any)).toBe(false)
  })

  test('pico UA: type picoos; matrix 0.1.1 sub-tokens (alpha2.0 baseline)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.1.1 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('initScene')).toBe(true)
    expect(supports('Model', ['not-a-token' as any])).toBe(false)
    expect(supports('Model', ['source'])).toBe(false)
    expect(supports('Model', ['ready', 'currentSrc'])).toBe(true)
    expect(supports('Model', ['stagemode'])).toBe(false)
    expect(supports('WindowScene', ['defaultSize', 'resizability'])).toBe(true)
    expect(supports('xrInnerDepth')).toBe(false)
    expect(supports('xrOuterDepth')).toBe(false)
  })

  test('pico UA PicoWebApp/0.1.2: matrix playback row (beta2.0)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.1.2 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('Model', ['autoplay', 'loop', 'source'])).toBe(true)
    expect(supports('Model', ['currentTime'])).toBe(true)
    expect(supports('Model', ['poster'])).toBe(true)
    expect(supports('Model', ['loading'])).toBe(false)
    expect(supports('xrInnerDepth')).toBe(false)
    expect(supports('xrOuterDepth')).toBe(false)
  })

  test('pico UA PicoWebApp/0.3.1: beta2.1 enables Model loading', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.3.1 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('Model', ['currentTime', 'poster', 'loading'])).toBe(true)
    expect(supports('Model', ['stagemode'])).toBe(false)
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('xrInnerDepth')).toBe(false)
    expect(supports('xrOuterDepth')).toBe(false)
  })

  test('pico UA above PicoWebApp/0.3.1 keeps its capabilities before OTA0', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.3.2 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('Model', ['currentTime', 'poster', 'loading'])).toBe(true)
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
  })

  test('alias Box → BoxEntity', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('Box')).toBe(supports('BoxEntity'))
  })

  test('supports(name, []) ≡ supports(name)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('Reality')).toBe(supports('Reality', []))
  })

  test('initScene is top-level only; WindowScene / VolumeScene sub-tokens', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('initScene')).toBe(true)
    expect(supports('initScene', ['defaultSize' as any])).toBe(false)
    expect(supports('WindowScene')).toBe(true)
    expect(supports('WindowScene', ['defaultSize', 'resizability'])).toBe(true)
    expect(supports('VolumeScene', ['baseplateVisibility'])).toBe(true)
  })

  test('Puppeteer UA: type puppeteer; all valid supports() true', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Puppeteer WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, getRuntime, resetRuntimeCacheForTests } = await import(
      './supports'
    )
    resetRuntimeCacheForTests()
    const rt = getRuntime()
    expect(rt.type).toBe('puppeteer')
    expect(rt.shellVersion).toBe('1.5.0')
    expect(supports('Model')).toBe(true)
    expect(supports('Model', ['poster'])).toBe(true)
    expect(supports('UnknownThing' as any)).toBe(false)
    expect(supports('Model', ['not-a-token' as any])).toBe(false)
  })

  test('Puppeteer UA without shell token: still puppeteer; valid supports() true', async () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 Puppeteer HeadlessChrome/120.0.0.0',
    } as Navigator)
    const { supports, getRuntime, resetRuntimeCacheForTests } = await import(
      './supports'
    )
    resetRuntimeCacheForTests()
    expect(getRuntime().type).toBe('puppeteer')
    expect(getRuntime().shellVersion).toBe(null)
    expect(supports('Model')).toBe(true)
  })

  test('visionOS WS_SHELL_VERSION placeholder: debug mode; all valid supports() true', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/WS_SHELL_VERSION WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, getRuntime, resetRuntimeCacheForTests } = await import(
      './supports'
    )
    resetRuntimeCacheForTests()
    const rt = getRuntime()
    expect(rt.type).toBe('visionos')
    expect(rt.shellVersion).toBe('WS_SHELL_VERSION')
    expect(supports('Model')).toBe(true)
    expect(supports('Model', ['poster'])).toBe(true)
    expect(supports('Model', ['stagemode'])).toBe(true)
    expect(supports('UnknownThing' as any)).toBe(false)
    expect(supports('Model', ['not-a-token' as any])).toBe(false)
  })

  test('visionOS WSAppShell/1.5.0: Model sub-tokens (alpha2.0 baseline)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('Model', ['autoplay'])).toBe(false)
    expect(supports('Model', ['poster'])).toBe(false)
    expect(supports('Model', ['ready', 'currentSrc'])).toBe(true)
    expect(supports('Model', ['currentTime'])).toBe(false)
  })

  test('visionOS WSAppShell/1.6.0: Model playback row (WebSpatial April)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 (KHTML, like Gecko) WSAppShell/1.6.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('Model', ['autoplay', 'loop', 'source'])).toBe(true)
    expect(supports('Model', ['currentTime'])).toBe(false)
    expect(supports('Model', ['poster'])).toBe(false)
    expect(supports('Model', ['play', 'pause', 'duration'])).toBe(true)
  })

  test('visionOS WSAppShell/1.7.0: Model currentTime, loading, and poster are supported', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 (KHTML, like Gecko) WSAppShell/1.7.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('Model', ['currentTime', 'loading', 'poster'])).toBe(true)
    expect(supports('Model', ['stagemode'])).toBe(false)
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
  })

  test('visionOS WSAppShell/1.8.0: useAnimation is true while sub-tokens are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/1.8.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(true)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
  })

  test('useAnimation rejects all sub-tokens', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/1.7.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
    expect(supports('useAnimation', ['static3d'])).toBe(false)
    expect(supports('useAnimation', ['dynamic3d'])).toBe(false)

    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const mod2 = await import('./supports')
    mod2.resetRuntimeCacheForTests()
    expect(mod2.supports('useAnimation')).toBe(false)
    expect(mod2.supports('useAnimation', ['entity'])).toBe(false)
    expect(mod2.supports('useAnimation', ['element'])).toBe(false)
  })

  test('useAnimation result is stable across repeated calls', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/1.8.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    const first = supports('useAnimation')
    const second = supports('useAnimation')
    const third = supports('useAnimation')
    expect(first).toBe(true)
    expect(second).toBe(true)
    expect(third).toBe(true)
  })
})

describe('supports("useAnimation") for motion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('visionOS WSAppShell/1.8.0: useAnimation is true while sub-tokens are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/1.8.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(true)
    expect(supports('useAnimation', [])).toBe(true)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
    expect(supports('useAnimation', ['static3d'])).toBe(false)
    expect(supports('useAnimation', ['dynamic3d'])).toBe(false)
  })

  test('visionOS WSAppShell/1.7.0: useAnimation and sub-tokens are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/1.7.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', [])).toBe(false)
    expect(supports('useAnimation', ['entity'])).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
    expect(supports('useAnimation', ['static3d'])).toBe(false)
    expect(supports('useAnimation', ['dynamic3d'])).toBe(false)
  })

  test('visionOS WSAppShell/1.6.0: element token remains false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/1.6.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('useAnimation')).toBe(false)
    expect(supports('useAnimation', ['element'])).toBe(false)
  })
})
