import { describe, expect, it } from 'vitest'
import { detectSpatialRuntime } from './index'

// Representative UA strings — each one exercises a different branch of the
// lightweight parser shared by the default and server entries. Here we assert:
//   (a) the wrapper relays an input UA into the parser correctly, and
//   (b) the `Headers`-like input narrowing works.
const VISIONOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 WSAppShell/1.2.3'
const PICOOS_UA = 'Mozilla/5.0 PicoBrowser PicoWebApp/2.0.0 ' // see packages/core/src/runtime/userAgent.ts
const PLAIN_BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'

describe('@webspatial/react-sdk/server — detectSpatialRuntime', () => {
  describe('input narrowing', () => {
    it('accepts a raw user-agent string', () => {
      const result = detectSpatialRuntime(VISIONOS_UA)
      expect(result.type).toBe('visionos')
      expect(result.shellVersion).toBe('1.2.3')
    })

    it('accepts a Headers-like object via .get("user-agent")', () => {
      const headers = new Headers({ 'user-agent': VISIONOS_UA })
      const result = detectSpatialRuntime(headers)
      expect(result.type).toBe('visionos')
      expect(result.shellVersion).toBe('1.2.3')
    })

    it('accepts a custom getter object', () => {
      const customHeaders = {
        get(name: string): string | null {
          return name.toLowerCase() === 'user-agent' ? PICOOS_UA : null
        },
      }
      const result = detectSpatialRuntime(customHeaders)
      expect(result.type).toBe('picoos')
      expect(result.shellVersion).toBe('2.0.0')
    })

    it('falls back to "User-Agent" capitalisation when "user-agent" missing', () => {
      const headers = {
        get(name: string): string | null {
          return name === 'User-Agent' ? VISIONOS_UA : null
        },
      }
      const result = detectSpatialRuntime(headers)
      expect(result.type).toBe('visionos')
    })

    it('returns `{ type: null }` for null / undefined input', () => {
      expect(detectSpatialRuntime(null)).toEqual({
        type: null,
        shellVersion: null,
      })
      expect(detectSpatialRuntime(undefined)).toEqual({
        type: null,
        shellVersion: null,
      })
    })

    it('returns `{ type: null }` for empty string input', () => {
      expect(detectSpatialRuntime('')).toEqual({
        type: null,
        shellVersion: null,
      })
    })

    it('returns `{ type: null }` for a Headers-like object missing the UA header', () => {
      const headers = new Headers({ accept: 'text/html' })
      expect(detectSpatialRuntime(headers)).toEqual({
        type: null,
        shellVersion: null,
      })
    })

    it('returns `{ type: null }` for a non-string, non-Headers-like object', () => {
      // Defensive narrowing — wrong-shape inputs MUST NOT throw.
      // `as any` is a deliberate test of the input narrowing.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bogus: any = { foo: 'bar' }
      expect(detectSpatialRuntime(bogus)).toEqual({
        type: null,
        shellVersion: null,
      })
    })
  })

  describe('non-spatial UAs', () => {
    it('returns `{ type: null }` for a plain browser UA', () => {
      expect(detectSpatialRuntime(PLAIN_BROWSER_UA)).toEqual({
        type: null,
        shellVersion: null,
      })
    })
  })

  describe('module shape', () => {
    it('exports only documented surface (detectSpatialRuntime + types)', async () => {
      const mod = await import('./index')
      // Runtime exports — `detectSpatialRuntime` is the only one this PR
      // promises. Any future runtime export should be added explicitly to
      // this assertion + documented in `packages/react/README.md`.
      const runtimeExports = Object.keys(mod).filter(
        k => typeof (mod as Record<string, unknown>)[k] !== 'undefined',
      )
      expect(runtimeExports.sort()).toEqual(['detectSpatialRuntime'])
    })
  })
})
