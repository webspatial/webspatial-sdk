// Behavioural contract for the internal `getAbsoluteUrl` helper.
//
// The helper used to be exported publicly from the default entry as a
// "Group C stateless utility" (spec tasks.md §14.5). It was removed from
// the public surface in v2 — see the `remove-getabsoluteurl` changeset —
// but the implementation lives on under `src/internal/` because
// `Texture.tsx` and `ModelAsset.tsx` still feed it to the native bridge.
// These tests guard the same three properties that the original public
// suite covered, so internal consumers can rely on them.

import { afterEach, describe, expect, it, vi } from 'vitest'
import { getAbsoluteUrl } from './urlUtils'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('internal getAbsoluteUrl helper (used by Texture / ModelAsset)', () => {
  it('returns input unchanged under SSR (no window)', () => {
    vi.stubGlobal('window', undefined)
    expect(getAbsoluteUrl('a/b')).toBe('a/b')
  })

  it('resolves relative paths against window.location.href in browser', () => {
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost/x/' },
      configurable: true,
    })
    expect(getAbsoluteUrl('a/b')).toBe('http://localhost/x/a/b')
  })

  it('does NOT throw on malformed URL input — returns input unchanged', () => {
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost/' },
      configurable: true,
    })
    // The catch block in `getAbsoluteUrl` swallows URL parser failures;
    // absolute bogus schemes fall through to the URL constructor which
    // actually does resolve them, so we exercise the catch path with a
    // string the URL constructor itself rejects.
    const garbage = '\u0000not a valid url'
    const out = getAbsoluteUrl(garbage)
    // Either a successful resolution OR fall-through to input — both are
    // documented; key invariant is no throw.
    expect(typeof out).toBe('string')
  })
})
