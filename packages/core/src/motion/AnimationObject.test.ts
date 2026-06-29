import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpatialWebEvent } from '../SpatialWebEvent'

const spies = vi.hoisted(() => ({
  createCommandSpy: vi.fn(),
  controlCommandSpy: vi.fn(),
  destroyCommandSpy: vi.fn(),
  failNextControlType: undefined as string | undefined,
}))

vi.mock('../JSBCommand', () => {
  const ok = (data: any = {}) => ({
    success: true,
    data,
    errorCode: '',
    errorMessage: '',
  })

  class CreateSpatializedElementAnimationJSBCommand {
    constructor(public command: any) {
      spies.createCommandSpy(command)
    }
    execute = vi.fn().mockResolvedValue(ok({ id: 'native-anim-1' }))
  }

  class ControlSpatializedElementAnimationJSBCommand {
    constructor(public command: any) {
      spies.controlCommandSpy(command)
    }
    execute = vi.fn().mockImplementation(() => {
      if (spies.failNextControlType === this.command.type) {
        spies.failNextControlType = undefined
        return Promise.resolve({
          success: false,
          data: undefined,
          errorCode: 'E_CONTROL',
          errorMessage: `${this.command.type} failed`,
        })
      }
      return Promise.resolve(ok())
    })
  }

  class DestroyCommand {
    constructor(public id: string) {
      spies.destroyCommandSpy(id)
    }
    execute = vi.fn().mockResolvedValue(ok({ destroyed: true }))
  }

  class InspectCommand {
    constructor(public id: string = '') {}
    execute = vi.fn().mockResolvedValue(ok({ inspected: true }))
  }

  return {
    CreateSpatializedElementAnimationJSBCommand,
    ControlSpatializedElementAnimationJSBCommand,
    DestroyCommand,
    InspectCommand,
  }
})

describe('AnimationObject', () => {
  beforeEach(() => {
    spies.createCommandSpy.mockClear()
    spies.controlCommandSpy.mockClear()
    spies.destroyCommandSpy.mockClear()
    spies.failNextControlType = undefined
    SpatialWebEvent.eventReceiver = {}
  })

  async function createAnimation() {
    const { SpatializedElement } = await import('../SpatializedElement')

    class TestSpatializedElement extends SpatializedElement {
      /** Identifies the supported motion target kind for this test element. */
      readonly kind = 'static3d' as const

      async updateProperties() {
        return {
          success: true,
          data: undefined,
          errorCode: '',
          errorMessage: '',
        }
      }
    }

    const element = new TestSpatializedElement('element-1')
    return element.createAnimation({
      duration: 1,
      from: {
        transform: { translate: { x: 0 } },
      },
      to: {
        transform: { translate: { x: 10 } },
      },
    })
  }

  it('creates from the native create command and tracks native state directly', async () => {
    const { AnimationObject } = await import('./AnimationObject')

    const animation = await createAnimation()

    expect(animation).toBeInstanceOf(AnimationObject)
    expect(animation.id).toBe('native-anim-1')
    expect('uuid' in animation).toBe(false)
    expect(spies.createCommandSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        elementId: 'element-1',
        timeline: expect.any(Object),
      }),
    )

    const receiver = SpatialWebEvent.eventReceiver[animation.id]
    expect(receiver).toEqual(expect.any(Function))

    const onValuesChange = vi.fn()
    const onStateChange = vi.fn()
    const onComplete = vi.fn()
    animation.setCallbacks({
      onValuesChange,
      onStateChange,
      onComplete,
    })

    receiver?.({
      detail: {
        animationId: 'other-animation',
        action: 'play',
        playState: 'running',
        finished: false,
        values: { transform: { translate: { x: 2.5 } } },
      },
    })

    expect(animation.playState).toBe('idle')
    expect(onValuesChange).not.toHaveBeenCalled()
    expect(onStateChange).not.toHaveBeenCalled()

    receiver?.({
      detail: {
        animationId: animation.id,
        action: 'play',
        playState: 'running',
        finished: false,
        values: { transform: { translate: { x: 5 } } },
      },
    })

    expect(animation.playState).toBe('running')
    expect(animation.isAnimating).toBe(true)
    expect(animation.isPaused).toBe(false)
    expect(animation.finished).toBe(false)
    expect(onValuesChange).toHaveBeenCalledWith({
      transform: { translate: { x: 5 } },
    })
    expect(onStateChange).toHaveBeenCalledTimes(1)

    receiver?.({
      detail: {
        animationId: animation.id,
        action: 'complete',
        playState: 'finished',
        finished: true,
        values: { transform: { translate: { x: 10 } } },
      },
    })

    expect(animation.playState).toBe('finished')
    expect(animation.finished).toBe(true)
    expect(onComplete).toHaveBeenCalledWith({
      transform: { translate: { x: 10 } },
    })
    expect(onStateChange).toHaveBeenCalledTimes(2)
  })

  it('uses the inherited destroy path and unregisters its native WebMsg receiver', async () => {
    const animation = await createAnimation()

    expect(SpatialWebEvent.eventReceiver[animation.id]).toEqual(
      expect.any(Function),
    )

    await animation.destroy()

    expect(spies.destroyCommandSpy).toHaveBeenCalledWith(animation.id)
    expect(spies.controlCommandSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'destroy' }),
    )
    expect(animation.isDestroyed).toBe(true)
    expect(SpatialWebEvent.eventReceiver[animation.id]).toBeUndefined()
  })

  it('cleans up local lifecycle when native reports destroy', async () => {
    const animation = await createAnimation()
    const receiver = SpatialWebEvent.eventReceiver[animation.id]

    expect(receiver).toEqual(expect.any(Function))

    receiver?.({
      detail: {
        animationId: animation.id,
        action: 'destroy',
        playState: 'idle',
        finished: false,
      },
    })

    expect(animation.isDestroyed).toBe(true)
    expect(SpatialWebEvent.eventReceiver[animation.id]).toBeUndefined()

    await animation.play()
    expect(spies.controlCommandSpy).not.toHaveBeenCalled()
  })

  it('fires onStart only after the native start event arrives', async () => {
    const animation = await createAnimation()
    const onStart = vi.fn()
    animation.setCallbacks({ onStart })
    const receiver = SpatialWebEvent.eventReceiver[animation.id]

    await animation.play()
    expect(onStart).not.toHaveBeenCalled()

    receiver?.({
      detail: {
        animationId: animation.id,
        action: 'play',
        playState: 'running',
        finished: false,
        values: { transform: { translate: { x: 1 } } },
      },
    })
    expect(onStart).not.toHaveBeenCalled()

    receiver?.({
      detail: {
        animationId: animation.id,
        action: 'start',
        playState: 'running',
        finished: false,
        values: { transform: { translate: { x: 1 } } },
      },
    })
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('does not fire onStart when play control fails and retries only start after native start', async () => {
    const animation = await createAnimation()
    const onStart = vi.fn()
    const onError = vi.fn()
    animation.setCallbacks({ onStart, onError })
    const receiver = SpatialWebEvent.eventReceiver[animation.id]

    spies.failNextControlType = 'play'

    await expect(animation.play()).rejects.toThrow('play failed')
    expect(onStart).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        animationId: animation.id,
        command: 'play',
        reason: 'play failed',
      }),
    )

    await animation.play()
    expect(onStart).not.toHaveBeenCalled()

    receiver?.({
      detail: {
        animationId: animation.id,
        action: 'start',
        playState: 'running',
        finished: false,
        values: { transform: { translate: { x: 2 } } },
      },
    })
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it.each(['stop', 'reset', 'finish'] as const)(
    'does not re-fire onStart after %s until native terminal event arrives',
    async controlType => {
      const animation = await createAnimation()
      const onStart = vi.fn()
      animation.setCallbacks({ onStart })
      const receiver = SpatialWebEvent.eventReceiver[animation.id]

      receiver?.({
        detail: {
          animationId: animation.id,
          action: 'start',
          playState: 'running',
          finished: false,
          values: { transform: { translate: { x: 1 } } },
        },
      })
      expect(onStart).toHaveBeenCalledTimes(1)

      await animation[controlType]()

      receiver?.({
        detail: {
          animationId: animation.id,
          action: 'start',
          playState: 'running',
          finished: false,
          values: { transform: { translate: { x: 2 } } },
        },
      })
      expect(onStart).toHaveBeenCalledTimes(1)

      receiver?.({
        detail: {
          animationId: animation.id,
          action: controlType,
          playState: controlType === 'finish' ? 'finished' : 'idle',
          finished: controlType === 'finish',
          values: { transform: { translate: { x: 3 } } },
        },
      })

      receiver?.({
        detail: {
          animationId: animation.id,
          action: 'start',
          playState: 'running',
          finished: false,
          values: { transform: { translate: { x: 4 } } },
        },
      })
      expect(onStart).toHaveBeenCalledTimes(2)
    },
  )

  it('sends all playback controls to the same native animation id without recreating', async () => {
    const animation = await createAnimation()
    spies.createCommandSpy.mockClear()

    await animation.play()
    await animation.pause()
    await animation.resume()
    await animation.stop()
    await animation.reset()
    await animation.finish()

    expect(spies.createCommandSpy).not.toHaveBeenCalled()
    expect(spies.controlCommandSpy.mock.calls.map(call => call[0])).toEqual([
      { animationId: animation.id, type: 'play' },
      { animationId: animation.id, type: 'pause' },
      { animationId: animation.id, type: 'resume' },
      { animationId: animation.id, type: 'stop' },
      { animationId: animation.id, type: 'reset' },
      { animationId: animation.id, type: 'finish' },
    ])
  })
})

describe('Core exports', () => {
  it('does not require bridge architecture objects in the public Core export surface', async () => {
    const mod = await import('../index')

    expect(mod.AnimationObject).toBeDefined()
    expect((mod as any).AnimationObjectChannel).toBeUndefined()
    expect((mod as any).AnimationObjectBridge).toBeUndefined()
    expect((mod as any).SpatialObjectBridge).toBeUndefined()
  })

  it('exports AnimationObject from the motion entrypoint', async () => {
    const mod = await import('./index')

    expect(mod.AnimationObject).toBeDefined()
  })

  it('keeps the top-level AnimationObject export aligned with the motion entrypoint', async () => {
    const root = await import('../index')
    const motion = await import('./index')

    expect(root.AnimationObject).toBe(motion.AnimationObject)
  })

  it('removes legacy animateMotion entry points from spatialized elements', async () => {
    const mod = await import('../index')

    expect('animateMotion' in mod.Spatialized2DElement.prototype).toBe(false)
    expect('animateMotion' in mod.SpatializedStatic3DElement.prototype).toBe(
      false,
    )
    expect('animateMotion' in mod.SpatializedDynamic3DElement.prototype).toBe(
      false,
    )
  })
})
