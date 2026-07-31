import { beforeEach, describe, expect, it, vi } from 'vitest'

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
})
