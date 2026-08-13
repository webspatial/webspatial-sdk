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
      vi.spyOn(window, 'open').mockImplementation(originalOpen)

      const { hijackWindowOpen } = await import('./scene-polyfill')
      hijackWindowOpen(window)

      const ornamentParams =
        command === 'createOrnament'
          ? '&attachmentAnchor=bottomTrailingFront&contentAlignment=back&visibility=visible&width=240&height=120'
          : ''
      window.open(
        `webspatial://${command}?rid=req_1&wsepoch=9${ornamentParams}`,
        '_blank',
      )

      expect(originalOpen).toHaveBeenCalled()
      const redirectedUrl = (originalOpen.mock.calls as unknown[][])[0]?.[0]
      expect(typeof redirectedUrl).toBe('string')
      const redirected = new URL(String(redirectedUrl))
      if (redirected.protocol === 'webspatial:') {
        expect(redirected.host).toBe(command)
      } else {
        expect(redirected.searchParams.get('command')).toBe(command)
      }
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
})
