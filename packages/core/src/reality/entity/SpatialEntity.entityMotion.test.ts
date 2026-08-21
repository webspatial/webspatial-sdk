import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const platformSpy = {
  callJSB: vi.fn(),
  openSpatialSceneSync: vi.fn(),
  createNativeSpatialDiv: vi.fn(),
  createNativeAttachment: vi.fn(),
}

vi.mock('../../platform-adapter', () => ({
  createPlatform: () => Promise.resolve(platformSpy),
  createPlatformSync: () => platformSpy,
}))

import { SpatialWebEvent } from '../../SpatialWebEvent'
import type { SpatialEntityProperties, Vec3 } from '../../types/types'
import { composeSRT } from '../../utils'
import { SpatialEntity } from './SpatialEntity'

describe('SpatialEntity Entity motion', () => {
  beforeEach(() => {
    platformSpy.callJSB.mockReset()
    platformSpy.callJSB.mockResolvedValue({
      success: true,
      data: { id: 'animation-1' },
      errorCode: '',
      errorMessage: '',
    })
    SpatialWebEvent.eventReceiver = {}
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('normalizes config and creates an animation with the target entity id', async () => {
    const entity = new SpatialEntity('entity-1')
    const animation = await entity.createAnimation({
      from: { position: { x: 0 } },
      to: { position: { x: 1 } },
      autoStart: false,
    })

    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'CreateEntityAnimation',
      JSON.stringify({
        id: 'entity-1',
        timeline: {
          duration: 0.3,
          delay: 0,
          playbackRate: 1,
          loop: false,
          tracks: [
            {
              property: 'position.x',
              keyframes: [
                { at: 0, value: 0 },
                { at: 0.3, value: 1 },
              ],
              timingFunction: 'easeInOut',
            },
          ],
        },
      }),
    )
    expect(animation.id).toBe('animation-1')
    expect(animation.playState).toBe('idle')
  })

  it.each([
    ['setPosition', { position: { x: 7, y: 8, z: 9 } }],
    ['setRotation', { rotation: { x: 70, y: 80, z: 90 } }],
    ['setScale', { scale: { x: 7, y: 8, z: 9 } }],
    ['updateTransform', { position: { x: 7, y: 8, z: 9 } }],
  ] as const)(
    'preserves Native-confirmed transform components after %s',
    async (method, update) => {
      const transformUpdate = update as Partial<SpatialEntityProperties>
      const entity = new SpatialEntity('entity-1')
      const animation = await entity.createAnimation({
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
        autoStart: false,
      })
      const confirmed = {
        position: { x: 1, y: 2, z: 3 },
        rotation: { x: 10, y: 20, z: 30 },
        scale: { x: 2, y: 3, z: 4 },
      }

      SpatialWebEvent.eventReceiver[animation.id]?.({
        type: 'spatialanimationstatechanged',
        detail: {
          id: animation.id,
          revision: 0,
          callbackAction: 'complete',
          playState: 'finished',
          values: confirmed,
        },
      })
      platformSpy.callJSB.mockClear()

      if (method === 'updateTransform') {
        await entity.updateTransform(transformUpdate)
      } else {
        await entity[method](Object.values(update)[0] as Vec3)
      }

      const position = transformUpdate.position ?? confirmed.position
      const rotation = transformUpdate.rotation ?? confirmed.rotation
      const scale = transformUpdate.scale ?? confirmed.scale
      expect(platformSpy.callJSB).toHaveBeenCalledOnce()
      expect(platformSpy.callJSB).toHaveBeenCalledWith(
        'UpdateEntityProperties',
        JSON.stringify({
          entityId: 'entity-1',
          transform: composeSRT(position, rotation, scale).toFloat64Array(),
        }),
      )
    },
  )

  it('throws when create succeeds without an animation object id', async () => {
    platformSpy.callJSB.mockResolvedValue({
      success: true,
      data: {},
      errorCode: '',
      errorMessage: '',
    })
    const entity = new SpatialEntity('entity-1')

    await expect(
      entity.createAnimation({
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
      }),
    ).rejects.toThrow('CreateEntityAnimation did not return an id')
  })

  it('reports a classified create command failure exactly once', async () => {
    platformSpy.callJSB.mockResolvedValue({
      success: false,
      data: undefined,
      errorCode: 'UNSUPPORTED_TARGET',
      errorMessage: 'target does not support Entity motion',
    })
    const onError = vi.fn()
    const entity = new SpatialEntity('entity-1')

    await expect(
      entity.createAnimation({
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
        onError,
      }),
    ).rejects.toThrow('target does not support Entity motion')

    expect(onError).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith({
      code: 'UNSUPPORTED_TARGET',
      reason: 'target does not support Entity motion',
    })
  })

  it('throws synchronous config validation without calling onError', () => {
    const onError = vi.fn()
    const entity = new SpatialEntity('entity-1')

    expect(() =>
      entity.createAnimation({
        from: { position: { x: 0 } },
        onError,
      }),
    ).toThrow('both from and to')
    expect(onError).not.toHaveBeenCalled()
    expect(platformSpy.callJSB).not.toHaveBeenCalled()
  })

  it('keeps timeline precedence silent in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const entity = new SpatialEntity('entity-1')

    await entity.createAnimation({
      from: { position: { x: 10 } },
      to: { position: { x: 20 } },
      timeline: {
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
      },
      duration: 1,
    })

    expect(warning).not.toHaveBeenCalled()
    warning.mockRestore()
  })
})
