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
import { SpatialWebMsgType } from '../../WebMsgCommand'
import type {
  EntityMotionConfig,
  EntityMotionProps,
  EntityMotionTimelinePayload,
} from '../../types/motion/entityMotion'
import {
  createEntityAnimationObject,
  EntityAnimationObject,
} from './EntityAnimationObject'
import { normalizeEntityMotionConfig } from './normalizeEntityMotionConfig'

const config: EntityMotionConfig = {
  from: { position: { x: 0 } },
  to: { position: { x: 1 } },
}

const timeline: EntityMotionTimelinePayload =
  normalizeEntityMotionConfig(config)

const values: EntityMotionProps = {
  position: { x: 1, y: 2, z: 3 },
  rotation: { x: 4, y: 5, z: 6 },
  scale: { x: 1, y: 1, z: 1 },
}

function ok(data: unknown = {}) {
  return Promise.resolve({
    success: true,
    data,
    errorCode: '',
    errorMessage: '',
  })
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('EntityAnimationObject', () => {
  beforeEach(() => {
    platformSpy.callJSB.mockReset()
    platformSpy.callJSB.mockImplementation(() => ok())
    SpatialWebEvent.eventReceiver = {}
  })

  it('uses dedicated state and error event channels', () => {
    expect(SpatialWebMsgType.spatialanimationstatechanged).toBe(
      'spatialanimationstatechanged',
    )
    expect(SpatialWebMsgType.entityanimationerror).toBe('entityanimationerror')
  })

  it('uses the animation object id for every control and destroy command', async () => {
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })

    await animation.play()
    await animation.pause()
    await animation.stop()
    await animation.reset()
    await animation.finish()
    await animation.destroy()

    expect(platformSpy.callJSB.mock.calls).toEqual(
      ['play', 'pause', 'stop', 'reset', 'finish', 'destroy'].map(type => [
        'ControlEntityAnimation',
        JSON.stringify({ id: 'animation-1', type }),
      ]),
    )
    expect(animation.isDestroyed).toBe(true)
    expect(SpatialWebEvent.eventReceiver['animation-1']).toBeUndefined()
  })

  it('serializes commands inside each Core animation object', async () => {
    const playReply =
      deferred<ReturnType<typeof ok> extends Promise<infer T> ? T : never>()
    const calls: string[] = []
    platformSpy.callJSB.mockImplementation((name: string, payload: string) => {
      const command = JSON.parse(payload) as { type?: string }
      calls.push(command.type ?? name)
      if (command.type === 'play') return playReply.promise
      if (name === 'SetEntityAnimation') return ok({ values })
      return ok()
    })
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })

    const play = animation.play()
    const set = animation.set({ position: { x: 2 } })
    const finish = animation.finish()
    await vi.waitFor(() => expect(calls).toEqual(['play']))

    playReply.resolve(await ok())
    await Promise.all([play, set, finish])

    expect(calls).toEqual(['play', 'SetEntityAnimation', 'finish'])
  })

  it('continues the Core queue after one command rejects', async () => {
    const calls: string[] = []
    platformSpy.callJSB.mockImplementation((name: string, payload: string) => {
      const command = JSON.parse(payload) as { type?: string }
      calls.push(command.type ?? name)
      if (command.type === 'play') {
        return Promise.reject(new Error('play failed'))
      }
      return ok()
    })
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })

    const play = animation.play()
    const finish = animation.finish()

    await expect(play).rejects.toThrow('play failed')
    await expect(finish).resolves.toBeUndefined()
    expect(calls).toEqual(['play', 'finish'])
  })

  it('invalidates unsent Core commands when destroy starts', async () => {
    const playReply =
      deferred<ReturnType<typeof ok> extends Promise<infer T> ? T : never>()
    const calls: string[] = []
    platformSpy.callJSB.mockImplementation((name: string, payload: string) => {
      const command = JSON.parse(payload) as { type?: string }
      calls.push(command.type ?? name)
      if (command.type === 'play') return playReply.promise
      return ok()
    })
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })

    const play = animation.play()
    const finish = animation.finish()
    await vi.waitFor(() => expect(calls).toEqual(['play']))
    const destroy = animation.destroy()
    playReply.resolve(await ok())
    await Promise.all([play, finish, destroy])

    expect(calls).toEqual(['play', 'destroy'])
  })

  it('returns confirmed set values without changing playback state', async () => {
    platformSpy.callJSB.mockImplementation(() => ok({ values }))
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    const valuesListener = vi.fn()
    animation.onValuesChange(valuesListener)

    await expect(animation.set({ position: { x: 1 } })).resolves.toEqual(values)

    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'SetEntityAnimation',
      JSON.stringify({
        id: 'animation-1',
        update: { position: { x: 1 } },
      }),
    )
    expect(valuesListener).toHaveBeenCalledOnce()
    expect(valuesListener).toHaveBeenCalledWith(values)
    expect(animation.playState).toBe('idle')
  })

  it('maps an active set rejection to one warning and a no-op', async () => {
    platformSpy.callJSB.mockResolvedValue({
      success: false,
      data: undefined,
      errorCode: 'INVALID_CONTROL_STATE',
      errorMessage: 'animation is active',
    })
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    const errorListener = vi.fn()
    animation.onError(errorListener)

    await expect(animation.set({ scale: { x: 2 } })).resolves.toBeUndefined()

    expect(warning).toHaveBeenCalledOnce()
    expect(errorListener).not.toHaveBeenCalled()
    warning.mockRestore()
  })

  it('converts one command reply failure into one playback error', async () => {
    platformSpy.callJSB.mockResolvedValue({
      success: false,
      data: undefined,
      errorCode: 'ANIMATION_NOT_FOUND',
      errorMessage: 'animation was removed',
    })
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    const errorListener = vi.fn()
    animation.onError(errorListener)

    await animation.play()

    expect(errorListener).toHaveBeenCalledOnce()
    expect(errorListener).toHaveBeenCalledWith({
      code: 'ANIMATION_NOT_FOUND',
      reason: 'animation was removed',
    })
  })

  it('keeps state authoritative to messages when a control reply is empty', async () => {
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })

    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'spatialanimationstatechanged',
      detail: {
        id: 'animation-1',
        revision: 0,
        playState: 'paused',
      },
    })

    await animation.play()

    expect(animation.playState).toBe('paused')
    expect(animation.isAnimating).toBe(false)
    expect(animation.isPaused).toBe(true)
  })

  it('keeps a newer native event state when an empty control reply arrives later', async () => {
    let resolveReply!: (value: unknown) => void
    platformSpy.callJSB.mockImplementation(
      () => new Promise(resolve => (resolveReply = resolve)),
    )
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })

    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'spatialanimationstatechanged',
      detail: {
        id: 'animation-1',
        revision: 0,
        playState: 'paused',
      },
    })

    const play = animation.play()
    await Promise.resolve()
    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'spatialanimationstatechanged',
      detail: {
        id: 'animation-1',
        revision: 0,
        callbackAction: 'complete',
        playState: 'finished',
        values,
      },
    })
    resolveReply({
      success: true,
      data: undefined,
      errorCode: '',
      errorMessage: '',
    })
    await play

    expect(animation.playState).toBe('finished')
  })

  it('deduplicates the same reply and asynchronous error in either order', async () => {
    let resolveReply!: (value: unknown) => void
    platformSpy.callJSB.mockImplementation(
      () => new Promise(resolve => (resolveReply = resolve)),
    )
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    const errorListener = vi.fn()
    animation.onError(errorListener)

    const play = animation.play()
    await Promise.resolve()
    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'entityanimationerror',
      detail: {
        id: 'animation-1',
        error: {
          code: 'COMPILATION_FAILED',
          reason: 'resource generation failed',
        },
      },
    })
    resolveReply({
      success: false,
      errorCode: 'COMPILATION_FAILED',
      errorMessage: 'resource generation failed',
    })
    await play
    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'entityanimationerror',
      detail: {
        id: 'animation-1',
        error: {
          code: 'COMPILATION_FAILED',
          reason: 'resource generation failed',
        },
      },
    })

    expect(errorListener).toHaveBeenCalledOnce()
  })

  it('consumes state and dedicated error events addressed by id', () => {
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    const startListener = vi.fn()
    const completeListener = vi.fn()
    const errorListener = vi.fn()
    animation.onStart(startListener)
    animation.onComplete(completeListener)
    animation.onError(errorListener)

    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'spatialanimationstatechanged',
      detail: {
        id: 'animation-1',
        revision: 0,
        callbackAction: 'start',
        playState: 'running',
        values,
      },
    })
    expect(animation.playState).toBe('running')
    expect(animation.isAnimating).toBe(true)
    expect(startListener).toHaveBeenCalledOnce()
    expect(startListener).toHaveBeenCalledWith(values)

    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'spatialanimationstatechanged',
      detail: {
        id: 'another-animation',
        revision: 0,
        callbackAction: 'complete',
        playState: 'finished',
        values,
      },
    })
    expect(completeListener).not.toHaveBeenCalled()

    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'spatialanimationstatechanged',
      detail: {
        id: 'animation-1',
        revision: 0,
        callbackAction: 'complete',
        playState: 'finished',
        values,
      },
    })
    expect(animation.finished).toBe(true)
    expect(completeListener).toHaveBeenCalledOnce()
    expect(completeListener).toHaveBeenCalledWith(values)

    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'entityanimationerror',
      detail: {
        id: 'animation-1',
        error: {
          code: 'COMPILATION_FAILED',
          reason: 'native compilation failed',
        },
      },
    })
    expect(errorListener).toHaveBeenCalledOnce()
    expect(errorListener).toHaveBeenCalledWith({
      code: 'COMPILATION_FAILED',
      reason: 'native compilation failed',
    })
  })

  it('maps an idle finish to completion without changing the start count', () => {
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    const startListener = vi.fn()
    const completeListener = vi.fn()
    const valuesListener = vi.fn()
    animation.onStart(startListener)
    animation.onComplete(completeListener)
    animation.onValuesChange(valuesListener)

    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'spatialanimationstatechanged',
      detail: {
        id: 'animation-1',
        revision: 0,
        callbackAction: 'complete',
        playState: 'finished',
        values,
      },
    })

    expect(startListener).not.toHaveBeenCalled()
    expect(completeListener).toHaveBeenCalledOnce()
    expect(completeListener).toHaveBeenCalledWith(values)
    expect(valuesListener).toHaveBeenCalledOnce()
    expect(valuesListener).toHaveBeenCalledWith(values)
    expect(animation.finished).toBe(true)
  })

  it('consumes state-only pause and resume without values or callbacks', () => {
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    const startListener = vi.fn()
    const valuesListener = vi.fn()
    animation.onStart(startListener)
    animation.onValuesChange(valuesListener)

    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'spatialanimationstatechanged',
      detail: {
        id: 'animation-1',
        revision: 0,
        playState: 'paused',
      },
    })

    expect(animation.playState).toBe('paused')
    expect(animation.isAnimating).toBe(false)
    expect(animation.isPaused).toBe(true)
    expect(animation.finished).toBe(false)

    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'spatialanimationstatechanged',
      detail: {
        id: 'animation-1',
        revision: 0,
        playState: 'running',
      },
    })

    expect(animation.playState).toBe('running')
    expect(animation.isAnimating).toBe(true)
    expect(animation.isPaused).toBe(false)
    expect(startListener).not.toHaveBeenCalled()
    expect(valuesListener).not.toHaveBeenCalled()
  })

  it('ignores missing and stale state revisions after an update commits', async () => {
    platformSpy.callJSB.mockImplementation(() => ok({ values, revision: 1 }))
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    const playStateListener = vi.fn()
    animation.onPlayStateChange(playStateListener)

    await animation.update({
      from: { position: { x: 0 } },
      to: { position: { x: 2 } },
      duration: 1,
    })

    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'spatialanimationstatechanged',
      detail: {
        id: 'animation-1',
        revision: 0,
        playState: 'finished',
      },
    })
    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'spatialanimationstatechanged',
      detail: {
        id: 'animation-1',
        playState: 'running',
      },
    })

    expect(animation.playState).toBe('idle')
    expect(playStateListener).not.toHaveBeenCalled()

    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'spatialanimationstatechanged',
      detail: {
        id: 'animation-1',
        revision: 1,
        playState: 'paused',
      },
    })

    expect(animation.playState).toBe('paused')
    expect(playStateListener).toHaveBeenCalledOnce()
    expect(playStateListener).toHaveBeenCalledWith('paused')
  })

  it('ignores invalid event envelopes and unpaired callback values', () => {
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    const startListener = vi.fn()
    const errorListener = vi.fn()
    const valuesListener = vi.fn()
    animation.onStart(startListener)
    animation.onError(errorListener)
    animation.onValuesChange(valuesListener)

    for (const event of [
      {
        type: 'spatialanimationstatechanged',
        detail: {
          id: 'animation-1',
          revision: 0,
          callbackAction: 'error',
          playState: 'running',
          values,
        },
      },
      {
        type: 'spatialanimationstatechanged',
        detail: {
          id: 'animation-1',
          revision: 0,
          callbackAction: 'start',
          playState: 'waiting',
          values,
        },
      },
      {
        type: 'spatialanimationstatechanged',
        detail: {
          id: 'animation-1',
          revision: 0,
          playState: 'running',
          values,
        },
      },
      {
        type: 'spatialanimationstatechanged',
        detail: {
          id: 'animation-1',
          revision: 0,
          callbackAction: 'complete',
          playState: 'finished',
        },
      },
    ]) {
      SpatialWebEvent.eventReceiver['animation-1']?.(event)
    }

    SpatialWebEvent.eventReceiver['animation-1']?.({
      type: 'spatialanimationstatechanged',
      detail: {
        id: 'animation-1',
        revision: 0,
        playState: 'paused',
      },
    })

    expect(animation.playState).toBe('paused')
    expect(startListener).not.toHaveBeenCalled()
    expect(errorListener).not.toHaveBeenCalled()
    expect(valuesListener).not.toHaveBeenCalled()
  })

  it('consumes objectdestroy and keeps later APIs local without reporting errors', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    const errorListener = vi.fn()
    animation.onError(errorListener)
    const receiver = SpatialWebEvent.eventReceiver['animation-1']

    receiver?.({ type: 'objectdestroy' })

    expect(animation.isDestroyed).toBe(true)
    expect(SpatialWebEvent.eventReceiver['animation-1']).toBeUndefined()

    await animation.play()
    await animation.pause()
    await animation.stop()
    await animation.reset()
    await animation.finish()
    await animation.set({ position: { x: 2 } })

    expect(platformSpy.callJSB).not.toHaveBeenCalled()
    expect(warning).toHaveBeenCalledOnce()
    expect(errorListener).not.toHaveBeenCalled()
    warning.mockRestore()
  })

  it('allows an in-flight command to report ANIMATION_NOT_FOUND after objectdestroy', async () => {
    let resolveReply!: (value: unknown) => void
    platformSpy.callJSB.mockImplementation(
      () => new Promise(resolve => (resolveReply = resolve)),
    )
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    const errorListener = vi.fn()
    animation.onError(errorListener)
    const receiver = SpatialWebEvent.eventReceiver['animation-1']

    const play = animation.play()
    await Promise.resolve()
    receiver?.({ type: 'objectdestroy' })
    resolveReply({
      success: false,
      data: undefined,
      errorCode: 'ANIMATION_NOT_FOUND',
      errorMessage: 'animation was removed with its target',
    })
    await play

    expect(animation.isDestroyed).toBe(true)
    expect(SpatialWebEvent.eventReceiver['animation-1']).toBeUndefined()
    expect(errorListener).toHaveBeenCalledOnce()
    expect(errorListener).toHaveBeenCalledWith({
      code: 'ANIMATION_NOT_FOUND',
      reason: 'animation was removed with its target',
    })
  })

  it.each([
    [{}, 'position'],
    [
      {
        position: { x: 1, y: 2 },
        rotation: { x: 4, y: 5, z: 6 },
        scale: { x: 1, y: 1, z: 1 },
      },
      'position.z',
    ],
    [
      {
        position: { x: 1, y: 2, z: 3 },
        rotation: { x: 4, y: 5 },
        scale: { x: 1, y: 1, z: 1 },
      },
      'rotation.z',
    ],
    [
      {
        position: { x: 1, y: 2, z: 3 },
        rotation: { x: 4, y: 5, z: 6 },
        scale: { x: 1, y: 1 },
      },
      'scale.z',
    ],
    [
      {
        position: { x: 1, y: 2, z: 3 },
        rotation: { x: 4, y: 5, z: 6 },
      },
      'scale',
    ],
    [
      {
        position: { x: 1, y: 2, z: Number.NaN },
        rotation: { x: 4, y: 5, z: 6 },
        scale: { x: 1, y: 1, z: 1 },
      },
      'finite',
    ],
    [
      {
        position: { x: 1, y: 2, z: 3 },
        rotation: { x: 4, y: Number.POSITIVE_INFINITY, z: 6 },
        scale: { x: 1, y: 1, z: 1 },
      },
      'finite',
    ],
    [
      {
        position: { x: 1, y: 2, z: 3 },
        rotation: { x: 4, y: 5, z: 6 },
        scale: { x: -1, y: 1, z: 1 },
      },
      'non-negative',
    ],
  ])(
    'rejects incomplete confirmed set values %#',
    async (resultValues, reason) => {
      platformSpy.callJSB.mockImplementation(() => ok({ values: resultValues }))
      const animation = createEntityAnimationObject('animation-1', {
        config,
        timeline,
      })
      const valuesListener = vi.fn()
      const errorListener = vi.fn()
      animation.onValuesChange(valuesListener)
      animation.onError(errorListener)

      await expect(
        animation.set({ position: { x: 1 } }),
      ).resolves.toBeUndefined()

      expect(valuesListener).not.toHaveBeenCalled()
      expect(errorListener).toHaveBeenCalledOnce()
      expect(errorListener).toHaveBeenCalledWith({
        code: 'INVALID_SET_VALUES',
        reason: expect.stringContaining(reason),
      })
    },
  )

  it('keeps the object alive and rejects when destroy fails', async () => {
    platformSpy.callJSB.mockResolvedValue({
      success: false,
      data: undefined,
      errorCode: 'ANIMATION_NOT_FOUND',
      errorMessage: 'destroy failed',
    })
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    const errorListener = vi.fn()
    animation.onError(errorListener)

    await expect(animation.destroy()).rejects.toThrow('destroy failed')

    expect(animation.isDestroyed).toBe(false)
    expect(SpatialWebEvent.eventReceiver['animation-1']).toBeDefined()
    expect(errorListener).toHaveBeenCalledOnce()
    expect(errorListener).toHaveBeenCalledWith({
      code: 'ANIMATION_NOT_FOUND',
      reason: 'destroy failed',
    })
  })

  it('validates update config synchronously without sending a command', () => {
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })

    expect(() =>
      animation.update({
        from: { position: { x: 0 } },
      }),
    ).toThrow()
    expect(platformSpy.callJSB).not.toHaveBeenCalled()
  })

  it('skips equivalent execution config including callback and autoStart changes', async () => {
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })

    await animation.update({
      timeline: {
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
      },
      duration: 0.3,
      autoStart: false,
      onComplete: vi.fn(),
    })

    expect(platformSpy.callJSB).not.toHaveBeenCalled()
  })

  it('commits a successful config update and confirmed pose', async () => {
    platformSpy.callJSB.mockImplementation(() => ok({ values, revision: 1 }))
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    const valuesListener = vi.fn()
    animation.onValuesChange(valuesListener)
    const nextConfig: EntityMotionConfig = {
      from: { position: { x: 0 } },
      to: { position: { x: 2 } },
      duration: 1,
    }

    await animation.update(nextConfig)
    await animation.update(nextConfig)

    expect(platformSpy.callJSB).toHaveBeenCalledOnce()
    expect(platformSpy.callJSB).toHaveBeenCalledWith(
      'UpdateEntityAnimation',
      JSON.stringify({
        id: 'animation-1',
        timeline: normalizeEntityMotionConfig(nextConfig),
      }),
    )
    expect(valuesListener).toHaveBeenCalledOnce()
    expect(valuesListener).toHaveBeenCalledWith(values)
  })

  it('keeps the committed config when an update fails', async () => {
    platformSpy.callJSB.mockResolvedValue({
      success: false,
      data: undefined,
      errorCode: 'COMPILATION_FAILED',
      errorMessage: 'update failed',
    })
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    const errorListener = vi.fn()
    animation.onError(errorListener)

    await animation.update({
      from: { position: { x: 0 } },
      to: { position: { x: 2 } },
    })
    await animation.update(config)

    expect(platformSpy.callJSB).toHaveBeenCalledOnce()
    expect(errorListener).toHaveBeenCalledOnce()
    expect(errorListener).toHaveBeenCalledWith({
      code: 'COMPILATION_FAILED',
      reason: 'update failed',
    })
  })

  it('keeps update local after object destruction', async () => {
    const animation = createEntityAnimationObject('animation-1', {
      config,
      timeline,
    })
    SpatialWebEvent.eventReceiver['animation-1']?.({ type: 'objectdestroy' })

    await animation.update({
      from: { position: { x: 0 } },
      to: { position: { x: 2 } },
    })

    expect(platformSpy.callJSB).not.toHaveBeenCalled()
  })
})

void EntityAnimationObject
