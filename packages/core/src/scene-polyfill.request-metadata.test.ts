import { afterEach, describe, expect, it, vi } from 'vitest'

describe('scene polyfill request metadata forwarding', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
    delete (window as any).webSpatial
    delete (window as any).__webspatialShell__
  })

  it.each(['createSpatialized2DElement', 'createAttachment', 'createOrnament'])(
    'forwards rid and wsepoch for %s without introducing extra request fields',
    async command => {
      ;(window as any).webSpatial = {
        genToken: vi.fn(() => 'token-123'),
      }
      const originalOpen = vi.fn(() => null)
      const testWindow = { open: originalOpen } as unknown as WindowProxy

      const { hijackWindowOpen } = await import('./scene-polyfill')
      hijackWindowOpen(testWindow)

      const ornamentParams =
        command === 'createOrnament'
          ? '&attachmentAnchor=bottomTrailingFront&contentAlignment=back&visibility=visible&width=240&height=120'
          : ''
      testWindow.open(
        `webspatial://${command}?rid=req_1&wsepoch=9${ornamentParams}`,
        '_blank',
      )

      expect(originalOpen).toHaveBeenCalled()
      const redirectedUrl = (originalOpen.mock.calls as unknown[][])[0]?.[0]
      expect(typeof redirectedUrl).toBe('string')
      const redirected = new URL(String(redirectedUrl))
      expect(redirected.origin).toBe(window.location.origin)
      expect(redirected.pathname).toBe('/token-123/')
      expect(redirected.searchParams.get('command')).toBe(command)
      expect(redirected.searchParams.get('rid')).toBe('req_1')
      expect(redirected.searchParams.get('wsepoch')).toBe('9')
      expect(redirected.searchParams.get('wsrid')).toBeNull()
      if (command === 'createOrnament') {
        expect(redirected.searchParams.get('attachmentAnchor')).toBe(
          'bottomTrailingFront',
        )
        expect(redirected.searchParams.get('contentAlignment')).toBe('back')
        expect(redirected.searchParams.get('visibility')).toBe('visible')
        expect(redirected.searchParams.get('width')).toBe('240')
        expect(redirected.searchParams.get('height')).toBe('120')
      }
    },
  )

  it.each(['createSpatialized2DElement', 'createAttachment', 'createOrnament'])(
    'rewrites %s to about:blank on visionOS when no Swan token is available',
    async command => {
      const userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) WSAppShell/1.8.0 WebSpatial/1.7.0'
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent)
      const originalOpen = vi.fn(() => null)
      const testWindow = { open: originalOpen } as unknown as WindowProxy

      const { hijackWindowOpen } = await import('./scene-polyfill')
      hijackWindowOpen(testWindow)

      const sourceUrl = `webspatial://${command}?rid=req_2&wsepoch=10&command=${command}&width=240`
      testWindow.open(sourceUrl, '_blank')

      expect(originalOpen).toHaveBeenCalledTimes(1)
      const redirectedUrl = (originalOpen.mock.calls as unknown[][])[0]?.[0]
      const redirected = new URL(String(redirectedUrl))
      expect(redirected.protocol).toBe('about:')
      expect(redirected.pathname).toBe('blank')
      expect(redirected.searchParams.getAll('command')).toEqual([command])
      expect(redirected.searchParams.get('rid')).toBe('req_2')
      expect(redirected.searchParams.get('wsepoch')).toBe('10')
      expect(redirected.searchParams.get('width')).toBe('240')
    },
  )

  it.each([
    [
      'Pico OS without token injection',
      'Mozilla/5.0 PicoBrowser PicoWebApp/1.0.0 WebSpatial/1.0.0',
    ],
    ['Puppeteer', 'Mozilla/5.0 Puppeteer HeadlessChrome/120.0.0.0'],
  ])('keeps webspatial URL unchanged on %s', async (_label, userAgent) => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent)
    const originalOpen = vi.fn(() => null)
    const testWindow = { open: originalOpen } as unknown as WindowProxy

    const { hijackWindowOpen } = await import('./scene-polyfill')
    hijackWindowOpen(testWindow)

    const sourceUrl =
      'webspatial://createOrnament?rid=req_3&wsepoch=11&command=createOrnament'
    testWindow.open(sourceUrl, '_blank')

    expect(originalOpen).toHaveBeenCalledOnce()
    const openCall = (originalOpen.mock.calls as unknown[][])[0]
    expect(openCall?.[0]).toBe(sourceUrl)
    expect(openCall?.[1]).toBe('_blank')
  })
})
