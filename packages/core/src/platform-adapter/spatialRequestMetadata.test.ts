import { afterEach, describe, expect, it, vi } from 'vitest'

describe('spatial request metadata', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
    delete window.__webspatialsdk__
  })

  it('builds opaque request ids and includes page epoch when available', async () => {
    window.__webspatialsdk__ = { pageEpoch: 7 }
    const { buildSpatialRequestQuery, createSpatialRequestId } = await import(
      './spatialRequestMetadata'
    )

    const first = createSpatialRequestId()
    const second = createSpatialRequestId()
    expect(first).not.toBe(second)

    const params = new URLSearchParams(buildSpatialRequestQuery(first))
    expect(params.get('rid')).toBe(first)
    expect(params.get('wsepoch')).toBe('7')
  })

  it('emits request id without epoch when host state is unavailable', async () => {
    const { buildSpatialRequestQuery, createSpatialRequestId } = await import(
      './spatialRequestMetadata'
    )

    const requestId = createSpatialRequestId()
    const params = new URLSearchParams(buildSpatialRequestQuery(requestId))
    expect(params.get('rid')).toBe(requestId)
    expect(params.get('wsepoch')).toBeNull()
  })

  it('builds refresh-safe request ids across module reinitialization', async () => {
    const nonceValues = [
      [1, 2],
      [3, 4],
    ]
    const getRandomValues = vi.fn((values: Uint32Array) => {
      const next = nonceValues.shift() ?? [5, 6]
      values[0] = next[0]
      values[1] = next[1]
      return values
    })

    vi.stubGlobal('crypto', { getRandomValues })

    const firstModule = await import('./spatialRequestMetadata')
    const first = firstModule.createSpatialRequestId()

    vi.resetModules()

    const secondModule = await import('./spatialRequestMetadata')
    const second = secondModule.createSpatialRequestId()

    expect(first).toMatch(/^wsreq_/)
    expect(second).toMatch(/^wsreq_/)
    expect(first).not.toBe(second)
  })
})

describe('PicoOSPlatform SpatialDiv request correlation', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.resetModules()
    delete window.__webspatialsdk__
    delete (window as any).__SpatialWebEvent
  })

  it('opens SpatialDiv protocol with rid and wsepoch', async () => {
    window.__webspatialsdk__ = { pageEpoch: '3' }
    const { SpatialWebEvent } = await import('../SpatialWebEvent')
    SpatialWebEvent.init()
    const open = vi.fn(() => null)
    vi.spyOn(window, 'open').mockImplementation(open)
    const removeReceiverSpy = vi.spyOn(SpatialWebEvent, 'removeEventReceiver')

    const { PicoOSPlatform } = await import('./pico-os/PicoOSPlatform')
    const platform = new PicoOSPlatform()
    const pending = platform.createNativeSpatialDiv()

    const openedUrl = (open.mock.calls[0] as unknown[])[0] as string
    const url = new URL(openedUrl)
    const requestId = url.searchParams.get('rid')
    expect(url.protocol).toBe('webspatial:')
    expect(url.host).toBe('createSpatialized2DElement')
    expect(requestId).toBeTruthy()
    expect(url.searchParams.get('wsepoch')).toBe('3')

    window.__SpatialWebEvent({
      id: requestId!,
      data: { spatialId: 'spatial-1' },
    })

    await expect(pending).resolves.toMatchObject({
      success: true,
      data: { id: 'spatial-1' },
    })
    expect(removeReceiverSpy).toHaveBeenCalledWith(requestId!)
  })

  it('opens attachment protocol with rid and wsepoch', async () => {
    window.__webspatialsdk__ = { pageEpoch: '4' }
    const { SpatialWebEvent } = await import('../SpatialWebEvent')
    SpatialWebEvent.init()
    const open = vi.fn(() => null)
    vi.spyOn(window, 'open').mockImplementation(open)
    const removeReceiverSpy = vi.spyOn(SpatialWebEvent, 'removeEventReceiver')

    const { PicoOSPlatform } = await import('./pico-os/PicoOSPlatform')
    const platform = new PicoOSPlatform()
    const pending = platform.createNativeAttachment()

    const openedUrl = (open.mock.calls[0] as unknown[])[0] as string
    const url = new URL(openedUrl)
    const requestId = url.searchParams.get('rid')
    expect(url.protocol).toBe('webspatial:')
    expect(url.host).toBe('createAttachment')
    expect(requestId).toBeTruthy()
    expect(url.searchParams.get('wsepoch')).toBe('4')

    window.__SpatialWebEvent({
      id: requestId!,
      data: { spatialId: 'attachment-1' },
    })

    await expect(pending).resolves.toMatchObject({
      success: true,
      data: { id: 'attachment-1' },
    })
    expect(removeReceiverSpy).toHaveBeenCalledWith(requestId!)
  })

  it('times out pending SpatialDiv requests', async () => {
    vi.useFakeTimers()
    vi.spyOn(window, 'open').mockImplementation(() => null)
    const { SpatialWebEvent } = await import('../SpatialWebEvent')
    SpatialWebEvent.init()
    const removeReceiverSpy = vi.spyOn(SpatialWebEvent, 'removeEventReceiver')

    const { PicoOSPlatform } = await import('./pico-os/PicoOSPlatform')
    const { DEFAULT_SPATIAL_REQUEST_TIMEOUT_MS } = await import(
      './spatialRequestMetadata'
    )

    const platform = new PicoOSPlatform()
    const pending = platform.createNativeSpatialDiv()
    await vi.advanceTimersByTimeAsync(DEFAULT_SPATIAL_REQUEST_TIMEOUT_MS)

    await expect(pending).resolves.toMatchObject({
      success: false,
      errorCode: 'E_SPATIAL_REQUEST_TIMEOUT',
    })
    expect(removeReceiverSpy).toHaveBeenCalledTimes(1)
  })
})
