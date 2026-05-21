import { afterEach, describe, expect, it, vi } from 'vitest'

describe('scene polyfill request metadata forwarding', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
    delete (window as any).webSpatial
    delete (window as any).__webspatialShell__
  })

  it('forwards rid and wsepoch without introducing extra request fields', async () => {
    ;(window as any).webSpatial = {
      genToken: vi.fn(() => 'token-123'),
    }
    const originalOpen = vi.fn(() => null)
    vi.spyOn(window, 'open').mockImplementation(originalOpen)

    const { hijackWindowOpen } = await import('./scene-polyfill')
    hijackWindowOpen(window)

    window.open(
      'webspatial://createSpatialized2DElement?rid=req_1&wsepoch=9',
      '_blank',
    )

    expect(originalOpen).toHaveBeenCalled()
    const redirectedUrl = (originalOpen.mock.calls as unknown[][])[0]?.[0]
    expect(typeof redirectedUrl).toBe('string')
    const redirected = new URL(String(redirectedUrl))
    if (redirected.protocol === 'webspatial:') {
      expect(redirected.host).toBe('createSpatialized2DElement')
    } else {
      expect(redirected.searchParams.get('command')).toBe(
        'createSpatialized2DElement',
      )
    }
    expect(redirected.searchParams.get('rid')).toBe('req_1')
    expect(redirected.searchParams.get('wsepoch')).toBe('9')
    expect(redirected.searchParams.get('wsrid')).toBeNull()
  })
})
