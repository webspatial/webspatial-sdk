import { beforeEach, describe, expect, it, vi } from 'vitest'

const platformSpy = {
  callJSB: vi.fn(),
}

vi.mock('../../platform-adapter', () => ({
  createPlatform: () => Promise.resolve(platformSpy),
  createPlatformSync: () => platformSpy,
}))

function ok(data: Record<string, string> = {}) {
  return Promise.resolve({
    success: true,
    data,
    errorCode: '',
    errorMessage: '',
  })
}

function lastPayload(): { cmd: string; body: Record<string, unknown> } {
  const last = platformSpy.callJSB.mock.calls.at(-1)
  expect(last).toBeDefined()
  return {
    cmd: last![0] as string,
    body: JSON.parse(last![1] as string) as Record<string, unknown>,
  }
}

describe('SpatialPBRMaterial JSB payloads', () => {
  beforeEach(() => {
    platformSpy.callJSB.mockReset()
    platformSpy.callJSB.mockImplementation((cmd: string) => {
      if (cmd === 'CreatePBRMaterial') return ok({ id: 'pbr-1' })
      return ok()
    })
  })

  it('create serializes only supplied SpatialPBRMaterialOptions fields', async () => {
    const { CreateSpatialPBRMaterialCommand } = await import('../../JSBCommand')

    await new CreateSpatialPBRMaterialCommand({
      color: '#c0c0c0',
      metalness: 0,
      roughness: 0.2,
    }).execute()

    const { cmd, body } = lastPayload()
    expect(cmd).toBe('CreatePBRMaterial')
    expect(body).toEqual({
      color: '#c0c0c0',
      metalness: 0,
      roughness: 0.2,
    })
    expect(body).not.toHaveProperty('textureId')
    expect(body).not.toHaveProperty('transparent')
    expect(body).not.toHaveProperty('opacity')
  })

  it('createSpatialPBRMaterial returns a pbr SpatialPBRMaterial', async () => {
    const { createSpatialPBRMaterial } = await import('../realityCreator')
    const { SpatialPBRMaterial } = await import('./SpatialPBRMaterial')

    const material = await createSpatialPBRMaterial({ metalness: 1 })
    expect(material).toBeInstanceOf(SpatialPBRMaterial)
    expect(material.id).toBe('pbr-1')
    expect(material.type).toBe('pbr')
    expect(material.options).toEqual({ metalness: 1 })
  })

  it('updateProperties sends explicit zeros and omits undefined fields', async () => {
    const { SpatialPBRMaterial } = await import('./SpatialPBRMaterial')
    const material = new SpatialPBRMaterial('pbr-1', { color: '#fff' })

    await material.updateProperties({
      metalness: 0,
      roughness: 0.5,
    })

    const { cmd, body } = lastPayload()
    expect(cmd).toBe('UpdatePBRMaterialProperties')
    expect(body).toEqual({
      id: 'pbr-1',
      metalness: 0,
      roughness: 0.5,
    })
    expect(body).not.toHaveProperty('color')
    expect(body).not.toHaveProperty('textureId')
    expect(body).not.toHaveProperty('transparent')
    expect(body).not.toHaveProperty('opacity')
  })
})
