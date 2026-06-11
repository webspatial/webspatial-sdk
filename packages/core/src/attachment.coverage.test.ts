import { beforeEach, describe, expect, it, vi } from 'vitest'

const platformSpy = {
  callJSB: vi.fn(),
  openSpatialSceneSync: vi.fn(),
  createNativeSpatialDiv: vi.fn(),
  createNativeAttachment: vi.fn(),
}

vi.mock('./platform-adapter', () => ({
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

function lastPayload(commandType: string) {
  const call = platformSpy.callJSB.mock.calls
    .filter(c => c[0] === commandType)
    .at(-1)
  expect(call).toBeDefined()
  return JSON.parse(call![1])
}

describe('toVec3Tuple', () => {
  it('normalizes Vec3 objects and tuples, passes undefined through', async () => {
    const { toVec3Tuple } = await import('./utils')
    expect(toVec3Tuple({ x: 1, y: 2, z: 3 })).toEqual([1, 2, 3])
    expect(toVec3Tuple([4, 5, 6])).toEqual([4, 5, 6])
    expect(toVec3Tuple(undefined)).toBeUndefined()
  })
})

describe('Attachment JSB commands', () => {
  beforeEach(() => {
    platformSpy.callJSB.mockReset()
    platformSpy.createNativeAttachment.mockReset()
    platformSpy.callJSB.mockImplementation(() => ok({ id: 'att-1' }))
    platformSpy.createNativeAttachment.mockImplementation(() =>
      ok({ windowProxy: {}, id: 'att-1' }),
    )
  })

  it('InitializeAttachmentCommand applies transform defaults and omits sizing when not set', async () => {
    const { InitializeAttachmentCommand } = await import('./JSBCommand')
    await new InitializeAttachmentCommand('att-1', {
      parentEntityId: 'parent-1',
      ownerViewId: 'view-1',
    }).execute()
    const payload = lastPayload('InitializeAttachment')
    expect(payload).toEqual({
      id: 'att-1',
      parentEntityId: 'parent-1',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      ownerViewId: 'view-1',
    })
    expect('size' in payload).toBe(false)
    expect('widthMeters' in payload).toBe(false)
    expect('heightMeters' in payload).toBe(false)
  })

  it('InitializeAttachmentCommand normalizes Vec3 and tuple inputs and maps width/height to meters fields', async () => {
    const { InitializeAttachmentCommand } = await import('./JSBCommand')
    await new InitializeAttachmentCommand('att-1', {
      parentEntityId: 'parent-1',
      ownerViewId: 'view-1',
      position: [1, 2, 3],
      rotation: { x: 0, y: 90, z: 0 },
      scale: { x: 2, y: 2, z: 2 },
      size: { width: 300, height: 200 },
      width: 0.5,
      height: 0.25,
    }).execute()
    const payload = lastPayload('InitializeAttachment')
    expect(payload.position).toEqual([1, 2, 3])
    expect(payload.rotation).toEqual([0, 90, 0])
    expect(payload.scale).toEqual([2, 2, 2])
    expect(payload.size).toEqual({ width: 300, height: 200 })
    expect(payload.widthMeters).toBe(0.5)
    expect(payload.heightMeters).toBe(0.25)
  })

  it('UpdateAttachmentEntityCommand includes only defined fields', async () => {
    const { UpdateAttachmentEntityCommand } = await import('./JSBCommand')
    await new UpdateAttachmentEntityCommand('att-1', {
      rotation: { x: 45, y: 0, z: 0 },
    }).execute()
    const payload = lastPayload('UpdateAttachmentEntity')
    expect(payload).toEqual({ id: 'att-1', rotation: [45, 0, 0] })

    await new UpdateAttachmentEntityCommand('att-1', {
      position: { x: 0, y: 1, z: 0 },
      scale: [3, 3, 3],
      size: { width: 100, height: 50 },
      width: 1,
      height: 2,
    }).execute()
    const full = lastPayload('UpdateAttachmentEntity')
    expect(full).toEqual({
      id: 'att-1',
      position: [0, 1, 0],
      scale: [3, 3, 3],
      size: { width: 100, height: 50 },
      widthMeters: 1,
      heightMeters: 2,
    })
  })
})

describe('Attachment entity-like setters', () => {
  beforeEach(() => {
    platformSpy.callJSB.mockReset()
    platformSpy.createNativeAttachment.mockReset()
    platformSpy.callJSB.mockImplementation(() => ok({ id: 'att-1' }))
    platformSpy.createNativeAttachment.mockImplementation(() =>
      ok({
        windowProxy: { document: { body: {} } },
        id: 'att-1',
      }),
    )
  })

  it('setPosition/setRotation/setScale delegate to UpdateAttachmentEntity', async () => {
    const { createAttachmentEntity } = await import('./reality/Attachment')
    const att = await createAttachmentEntity({
      parentEntityId: 'parent-1',
      ownerViewId: 'view-1',
      size: { width: 100, height: 100 },
    })

    await att.setPosition({ x: 1, y: 2, z: 3 })
    expect(lastPayload('UpdateAttachmentEntity')).toEqual({
      id: 'att-1',
      position: [1, 2, 3],
    })

    await att.setRotation([0, 0, 90])
    expect(lastPayload('UpdateAttachmentEntity')).toEqual({
      id: 'att-1',
      rotation: [0, 0, 90],
    })

    await att.setScale({ x: 2, y: 2, z: 2 })
    expect(lastPayload('UpdateAttachmentEntity')).toEqual({
      id: 'att-1',
      scale: [2, 2, 2],
    })
  })

  it('update is a no-op after destroy', async () => {
    const { createAttachmentEntity } = await import('./reality/Attachment')
    const att = await createAttachmentEntity({
      parentEntityId: 'parent-1',
      ownerViewId: 'view-1',
      width: 0.5,
      height: 0.5,
    })
    await att.destroy()
    platformSpy.callJSB.mockClear()
    await att.update({ position: [1, 1, 1] })
    expect(platformSpy.callJSB).not.toHaveBeenCalled()
  })
})
