import { describe, expect, test, vi, beforeEach } from 'vitest'

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
    expect(supports('UnknownThing' as any)).toBe(false)
  })

  test('pico UA: type picoos; matrix 0.1.1 sub-tokens (alpha2.1)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.1.1 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('initScene')).toBe(true)
    expect(supports('Model', ['not-a-token' as any])).toBe(false)
    expect(supports('Model', ['source'])).toBe(true)
    expect(supports('Model', ['stagemode'])).toBe(false)
    expect(supports('WindowScene', ['defaultSize', 'resizability'])).toBe(true)
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

  test('Model HTML + JS sub-tokens from stub table', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 WSAppShell/1.5.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('Model', ['autoplay'])).toBe(true)
    expect(supports('Model', ['poster'])).toBe(false)
    expect(supports('Model', ['ready', 'currentSrc'])).toBe(true)
    expect(supports('Model', ['currentTime'])).toBe(false)
  })
})
