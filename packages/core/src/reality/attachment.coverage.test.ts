import { beforeEach, describe, expect, it, vi } from 'vitest'

const platformSpy = {
  callJSB: vi.fn(),
  createNativeAttachment: vi.fn(),
}

vi.mock('../platform-adapter', () => ({
  createPlatform: () => Promise.resolve(platformSpy),
  createPlatformSync: () => platformSpy,
}))

function ok(data: any = {}) {
  return Promise.resolve({
    success: true,
    data,
    errorCode: '',
    errorMessage: '',
  })
}

function cornerRadius(radius: number) {
  return {
    topLeading: radius,
    bottomLeading: radius,
    topTrailing: radius,
    bottomTrailing: radius,
  }
}

describe('Attachment entity wire format', () => {
  beforeEach(() => {
    platformSpy.callJSB.mockReset()
    platformSpy.createNativeAttachment.mockReset()
    platformSpy.callJSB.mockImplementation(() => ok())
    platformSpy.createNativeAttachment.mockImplementation(() =>
      ok({
        id: 'att-1',
        windowProxy: { document: { body: {} } },
      }),
    )
  })

  it('initializes with entity-like transform vectors and meter dimensions', async () => {
    const { createAttachmentEntity } = await import('./Attachment')

    await createAttachmentEntity({
      placement: { id: 'entity-1' },
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 10, y: 20, z: 30 },
      scale: { x: 2, y: 3, z: 4 },
      width: 0.4,
      height: 0.2,
      ownerViewId: 'reality-1',
    })

    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'InitializeAttachment',
      JSON.stringify({
        id: 'att-1',
        placementId: 'entity-1',
        position: { x: 1, y: 2, z: 3 },
        rotation: { x: 10, y: 20, z: 30 },
        scale: { x: 2, y: 3, z: 4 },
        width: 0.4,
        height: 0.2,
        ownerViewId: 'reality-1',
        cornerRadius: cornerRadius(0),
        backgroundMaterial: 'transparent',
      }),
    )
  })

  it('updates transform and dimensions without tuple position or size object', async () => {
    const { Attachment } = await import('./Attachment')
    const attachment = new Attachment('att-1', {} as WindowProxy, {
      placement: { id: 'entity-1' },
      ownerViewId: 'reality-1',
    })

    await attachment.update({
      position: { x: 4, y: 5, z: 6 },
      rotation: { x: 0, y: 90, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      width: 0.5,
      height: 0.25,
    })

    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'UpdateAttachmentEntity',
      JSON.stringify({
        id: 'att-1',
        position: { x: 4, y: 5, z: 6 },
        rotation: { x: 0, y: 90, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        width: 0.5,
        height: 0.25,
      }),
    )
  })

  it('initializes with cornerRadius expanded to four corners and validated material', async () => {
    const { createAttachmentEntity } = await import('./Attachment')

    await createAttachmentEntity({
      placement: { id: 'entity-1' },
      width: 0.4,
      height: 0.2,
      cornerRadius: 12,
      backgroundMaterial: 'translucent',
      ownerViewId: 'reality-1',
    })

    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'InitializeAttachment',
      JSON.stringify({
        id: 'att-1',
        placementId: 'entity-1',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        width: 0.4,
        height: 0.2,
        ownerViewId: 'reality-1',
        cornerRadius: cornerRadius(12),
        backgroundMaterial: 'translucent',
      }),
    )
  })

  it('initializes with an explicit zero cornerRadius', async () => {
    const { createAttachmentEntity } = await import('./Attachment')

    await createAttachmentEntity({
      placement: { id: 'entity-1' },
      cornerRadius: 0,
      backgroundMaterial: 'thin',
      ownerViewId: 'reality-1',
    })

    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'InitializeAttachment',
      JSON.stringify({
        id: 'att-1',
        placementId: 'entity-1',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        ownerViewId: 'reality-1',
        cornerRadius: cornerRadius(0),
        backgroundMaterial: 'thin',
      }),
    )
  })

  it.each([
    ['negative', -8],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('normalizes a %s cornerRadius to 0 on initialize', async (_label, bad) => {
    const { createAttachmentEntity } = await import('./Attachment')

    await createAttachmentEntity({
      placement: { id: 'entity-1' },
      cornerRadius: bad,
      ownerViewId: 'reality-1',
    })

    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'InitializeAttachment',
      JSON.stringify({
        id: 'att-1',
        placementId: 'entity-1',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        ownerViewId: 'reality-1',
        cornerRadius: cornerRadius(0),
        backgroundMaterial: 'transparent',
      }),
    )
  })

  it('normalizes an invalid backgroundMaterial to transparent on initialize', async () => {
    const { createAttachmentEntity } = await import('./Attachment')

    await createAttachmentEntity({
      placement: { id: 'entity-1' },
      backgroundMaterial: 'frosted' as any,
      ownerViewId: 'reality-1',
    })

    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'InitializeAttachment',
      JSON.stringify({
        id: 'att-1',
        placementId: 'entity-1',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        ownerViewId: 'reality-1',
        cornerRadius: cornerRadius(0),
        backgroundMaterial: 'transparent',
      }),
    )
  })

  it('updates cornerRadius and backgroundMaterial in place', async () => {
    const { Attachment } = await import('./Attachment')
    const attachment = new Attachment('att-1', {} as WindowProxy, {
      placement: { id: 'entity-1' },
      ownerViewId: 'reality-1',
    })

    await attachment.update({
      cornerRadius: 24,
      backgroundMaterial: 'thick',
    })

    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'UpdateAttachmentEntity',
      JSON.stringify({
        id: 'att-1',
        cornerRadius: cornerRadius(24),
        backgroundMaterial: 'thick',
      }),
    )
  })

  it('normalizes invalid cornerRadius and backgroundMaterial on update', async () => {
    const { Attachment } = await import('./Attachment')
    const attachment = new Attachment('att-1', {} as WindowProxy, {
      placement: { id: 'entity-1' },
      ownerViewId: 'reality-1',
    })

    await attachment.update({
      cornerRadius: -4,
      backgroundMaterial: 'frosted' as any,
    })

    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'UpdateAttachmentEntity',
      JSON.stringify({
        id: 'att-1',
        cornerRadius: cornerRadius(0),
        backgroundMaterial: 'transparent',
      }),
    )
  })

  it('omits cornerRadius and backgroundMaterial from unrelated updates so existing values persist', async () => {
    const { Attachment } = await import('./Attachment')
    const attachment = new Attachment('att-1', {} as WindowProxy, {
      placement: { id: 'entity-1' },
      cornerRadius: 16,
      backgroundMaterial: 'regular',
      ownerViewId: 'reality-1',
    })

    await attachment.update({ position: { x: 7, y: 8, z: 9 } })

    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'UpdateAttachmentEntity',
      JSON.stringify({
        id: 'att-1',
        position: { x: 7, y: 8, z: 9 },
      }),
    )
  })
})
