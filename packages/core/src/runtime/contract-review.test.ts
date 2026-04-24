import { describe, expect, test, vi, beforeEach } from 'vitest'
import { ELEMENT_DOM_DEPTH_KEYS, WINDOW_DOM_DEPTH_KEYS } from './keys'

describe('OpenSpec review.md §3.5.1 — Window DOM depth (xrInnerDepth / xrOuterDepth)', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('plain browser UA: unsupported keys absent from window surface', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()

    for (const key of WINDOW_DOM_DEPTH_KEYS) {
      expect(supports(key)).toBe(false)
      expect(key in window).toBe(false)
      expect(Object.prototype.hasOwnProperty.call(window, key)).toBe(false)
    }
  })
})

describe('OpenSpec review.md §3.5.2 — Element depth keys must not use Window surface', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('plain browser: xrClientDepth / xrOffsetBack are not on window (live on spatialized ref)', async () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    } as Navigator)
    const { supports, resetRuntimeCacheForTests } = await import('./supports')
    resetRuntimeCacheForTests()

    for (const key of ELEMENT_DOM_DEPTH_KEYS) {
      expect(supports(key)).toBe(false)
      expect(key in window).toBe(false)
      expect(Object.prototype.hasOwnProperty.call(window, key)).toBe(false)
    }
  })
})
