import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

describe('supports("PBRMaterial") / supports("Material", ["pbr"])', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('visionOS WSAppShell/1.9.0 without manifest: table row enables PBR', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/1.9.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('PBRMaterial')).toBe(true)
    expect(supports('Material', ['pbr'])).toBe(true)
  })

  test('visionOS native manifest without PBR keys hides PBR', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/1.9.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    vi.stubGlobal('__webspatialCapabilities', {
      manifestVersion: 1,
      runtime: { type: 'visionos', buildId: 'pbr-missing' },
      supported: ['Material', 'Material:unlit', 'UnlitMaterial'],
    })
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('PBRMaterial')).toBe(false)
    expect(supports('Material', ['pbr'])).toBe(false)
  })

  test('checked-in visionOS native manifest enables PBR (not only the version table)', async () => {
    const manifest = (
      await import('../../../visionOS/runtime-capabilities.json', {
        with: { type: 'json' },
      })
    ).default as {
      manifestVersion: number
      runtime: { type: string }
      supported: string[]
    }
    expect(manifest.supported).toContain('PBRMaterial')
    expect(manifest.supported).toContain('Material:pbr')

    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/1.8.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    vi.stubGlobal('__webspatialCapabilities', manifest)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('PBRMaterial')).toBe(true)
    expect(supports('Material', ['pbr'])).toBe(true)
  })

  test('visionOS WSAppShell/1.8.0 without manifest: PBR stays false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7; wv) AppleWebKit/605.1.15 WSAppShell/1.8.0 WebSpatial/1.5.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('PBRMaterial')).toBe(false)
    expect(supports('Material', ['pbr'])).toBe(false)
  })

  test('picoOS PicoWebApp/0.4.90: PBR flags are false', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64; unknown OS0.11.0 like Quest) AppleWebKit/537.36 PicoWebApp/0.4.90 (like PicoBrowser) Chrome/138.0 WebSpatial/1.5.0',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()
    expect(supports('PBRMaterial')).toBe(false)
    expect(supports('Material', ['pbr'])).toBe(false)
  })
})
