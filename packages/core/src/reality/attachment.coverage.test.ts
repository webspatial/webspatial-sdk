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
})
