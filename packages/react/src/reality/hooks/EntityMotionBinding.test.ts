import { describe, expect, test, vi } from 'vitest'
import type {
  EntityMotionConfig,
  EntityMotionProps,
  EntityTransformUpdate,
  SpatializedMotionPlayState,
  SpatializedPlaybackError,
} from '@webspatial/core-sdk'
import { EntityMotionBinding } from './EntityMotionBinding'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function createMockAnimationObject(id = 'animation-1') {
  const listeners: {
    start?: (values: EntityMotionProps) => void
    complete?: (values: EntityMotionProps) => void
    stop?: (values: EntityMotionProps) => void
    reset?: (values: EntityMotionProps) => void
    error?: (error: SpatializedPlaybackError) => void
    values?: (values: EntityMotionProps) => void
    state?: (state: SpatializedMotionPlayState) => void
  } = {}
  const object = {
    id,
    playState: 'idle',
    isAnimating: false,
    isPaused: false,
    finished: false,
    play: vi.fn(async () => undefined),
    pause: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
    reset: vi.fn(async () => undefined),
    finish: vi.fn(async () => undefined),
    set: vi.fn<
      (update: EntityTransformUpdate) => Promise<EntityMotionProps | void>
    >(async () => undefined),
    destroy: vi.fn(async () => undefined),
    onStart: vi.fn((listener: typeof listeners.start) => {
      listeners.start = listener
    }),
    onComplete: vi.fn((listener: typeof listeners.complete) => {
      listeners.complete = listener
    }),
    onStop: vi.fn((listener: typeof listeners.stop) => {
      listeners.stop = listener
    }),
    onReset: vi.fn((listener: typeof listeners.reset) => {
      listeners.reset = listener
    }),
    onError: vi.fn((listener: typeof listeners.error) => {
      listeners.error = listener
    }),
    onValuesChange: vi.fn((listener: typeof listeners.values) => {
      listeners.values = listener
    }),
    onPlayStateChange: vi.fn((listener: typeof listeners.state) => {
      listeners.state = listener
    }),
  }
  return { object, listeners }
}

function createConfig(
  overrides: Partial<EntityMotionConfig> = {},
): EntityMotionConfig {
  return {
    from: { position: { x: 0 } },
    to: { position: { x: 1 } },
    autoStart: false,
    ...overrides,
  }
}

/** Invalid updates that must fail before lifecycle timing is considered. */
const invalidUpdates = [
  {},
  { position: {} },
  { position: { w: 1 } },
  { rotation: { x: Number.NaN } },
  { scale: { z: -1 } },
] as const

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('EntityMotionBinding', () => {
  test('stays idle while creation has no pending playback command', async () => {
    const creation = deferred<any>()
    const binding = new EntityMotionBinding(createConfig())
    const entity = {
      id: 'entity-1',
      createAnimation: vi.fn(() => creation.promise),
      animateTransform: vi.fn(() => {
        throw new Error('legacy path must not run')
      }),
    }

    binding.__bind(entity as any)

    expect(binding.api.playState).toBe('idle')
    expect(binding.api.isAnimating).toBe(false)
    expect(binding.api.isPaused).toBe(false)
    expect(binding.api.finished).toBe(false)
    expect(entity.createAnimation).toHaveBeenCalledWith(
      expect.objectContaining({ autoStart: false }),
    )
    expect(entity.animateTransform).not.toHaveBeenCalled()

    const { object } = createMockAnimationObject()
    creation.resolve(object)
    await flushPromises()

    expect(binding.api.playState).toBe('idle')
  })

  test('enters queued when playback waits for object creation', async () => {
    const creation = deferred<any>()
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(() => creation.promise),
    } as any)

    binding.api.play()

    expect(binding.api.playState).toBe('queued')
    expect(binding.api.isAnimating).toBe(false)
    expect(binding.api.isPaused).toBe(false)
    expect(binding.api.finished).toBe(false)

    const { object } = createMockAnimationObject()
    creation.resolve(object)
    await vi.waitFor(() => expect(object.play).toHaveBeenCalledOnce())
    expect(binding.api.playState).toBe('idle')
  })

  test('enters queued while implicit autoStart waits for object creation', () => {
    const creation = deferred<any>()
    const binding = new EntityMotionBinding(createConfig({ autoStart: true }))

    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(() => creation.promise),
    } as any)

    expect(binding.api.playState).toBe('queued')
  })

  test('flushes autoStart first and pre-create playback commands in FIFO order', async () => {
    const creation = deferred<any>()
    const play = deferred<undefined>()
    const calls: string[] = []
    const { object } = createMockAnimationObject()
    object.play.mockImplementation(async () => {
      calls.push('play')
      await play.promise
    })
    object.pause.mockImplementation(async () => {
      calls.push('pause')
    })
    object.finish.mockImplementation(async () => {
      calls.push('finish')
    })
    const binding = new EntityMotionBinding(createConfig({ autoStart: true }))
    const entity = {
      id: 'entity-1',
      createAnimation: vi.fn(() => creation.promise),
    }

    binding.api.pause()
    binding.__bind(entity as any)
    binding.api.finish()
    creation.resolve(object)
    await flushPromises()

    expect(calls).toEqual(['play'])
    play.resolve(undefined)
    await vi.waitFor(() => {
      expect(calls).toEqual(['play', 'pause', 'finish'])
    })
  })

  test('warns and drops set before native object creation', async () => {
    const creation = deferred<any>()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation: () => creation.promise,
    } as any)

    binding.api.set({ position: { x: 2 } })

    const { object } = createMockAnimationObject()
    creation.resolve(object)
    await flushPromises()
    expect(warning).toHaveBeenCalledOnce()
    expect(object.set).not.toHaveBeenCalled()
    warning.mockRestore()
  })

  test('keeps entityProps empty after create until native confirms values', async () => {
    const { object } = createMockAnimationObject()
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)

    await flushPromises()

    expect(binding.api.playState).toBe('idle')
    expect(binding.entityProps).toEqual({})
  })

  test('keeps api.set void while asynchronously committing confirmed values', async () => {
    const confirmedValues: EntityMotionProps = {
      position: { x: 2, y: 3, z: 4 },
      rotation: { x: 5, y: 6, z: 7 },
      scale: { x: 1, y: 1, z: 1 },
    }
    const { object, listeners } = createMockAnimationObject()
    object.set.mockImplementation(async () => {
      listeners.values?.(confirmedValues)
      return confirmedValues
    })
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()

    const result = binding.api.set({ position: { x: 2 } })

    expect(result).toBeUndefined()
    await vi.waitFor(() => {
      expect(binding.entityProps).toEqual(confirmedValues)
    })
  })

  test('registers object listeners and uses latest callbacks and confirmed values', async () => {
    const onStartBefore = vi.fn()
    const onStartLatest = vi.fn()
    const render = vi.fn()
    const { object, listeners } = createMockAnimationObject()
    const binding = new EntityMotionBinding(
      createConfig({ onStart: onStartBefore }),
    )
    binding.subscribe(render)
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()
    binding.updateConfig(createConfig({ onStart: onStartLatest }))

    const values: EntityMotionProps = {
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 4, y: 5, z: 6 },
      scale: { x: 1, y: 1, z: 1 },
    }
    listeners.values?.(values)
    listeners.start?.(values)

    expect(binding.entityProps).toEqual(values)
    expect(render).toHaveBeenCalled()
    expect(onStartBefore).not.toHaveBeenCalled()
    expect(onStartLatest).toHaveBeenCalledWith(values)
    expect(object.onComplete).toHaveBeenCalledOnce()
    expect(object.onStop).toHaveBeenCalledOnce()
    expect(object.onReset).toHaveBeenCalledOnce()
    expect(object.onError).toHaveBeenCalledOnce()
    expect(object.onPlayStateChange).toHaveBeenCalledOnce()
  })

  test('maps complete native values and exact lifecycle arguments while ignoring callback returns', async () => {
    const onStart = vi.fn(() => 'ignored')
    const onComplete = vi.fn(() => 'ignored')
    const onStop = vi.fn(() => 'ignored')
    const onReset = vi.fn(() => 'ignored')
    const onError = vi.fn(() => 'ignored')
    const { object, listeners } = createMockAnimationObject()
    const binding = new EntityMotionBinding(
      createConfig({ onStart, onComplete, onStop, onReset, onError }),
    )
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()
    const lifecycle = [
      {
        state: 'running',
        values: {
          position: { x: 1, y: 2, z: 3 },
          rotation: { x: 4, y: 5, z: 6 },
          scale: { x: 1, y: 1, z: 1 },
        },
        emit: listeners.start,
        callback: onStart,
      },
      {
        state: 'finished',
        values: {
          position: { x: 7, y: 8, z: 9 },
          rotation: { x: 10, y: 11, z: 12 },
          scale: { x: 2, y: 3, z: 4 },
        },
        emit: listeners.complete,
        callback: onComplete,
      },
      {
        state: 'idle',
        values: {
          position: { x: 13, y: 14, z: 15 },
          rotation: { x: 16, y: 17, z: 18 },
          scale: { x: 5, y: 6, z: 7 },
        },
        emit: listeners.stop,
        callback: onStop,
      },
      {
        state: 'idle',
        values: {
          position: { x: 19, y: 20, z: 21 },
          rotation: { x: 22, y: 23, z: 24 },
          scale: { x: 8, y: 9, z: 10 },
        },
        emit: listeners.reset,
        callback: onReset,
      },
    ] as const

    for (const item of lifecycle) {
      object.playState = item.state
      listeners.state?.(item.state)
      listeners.values?.(item.values)
      item.emit?.(item.values)
      expect(binding.entityProps).toEqual(item.values)
      expect(binding.api.playState).toBe(item.state)
      expect(item.callback).toHaveBeenLastCalledWith(item.values)
    }

    const error = {
      code: 'ANIMATION_NOT_FOUND',
      reason: 'animation was destroyed',
    } as const
    listeners.error?.(error)
    expect(onError).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith(error)
  })

  test('serializes created commands and continues after an ordinary failure', async () => {
    const first = deferred<undefined>()
    const calls: string[] = []
    const onError = vi.fn()
    const { object } = createMockAnimationObject()
    object.play.mockImplementation(async () => {
      calls.push('play')
      await first.promise
      throw new Error('play failed')
    })
    object.stop.mockImplementation(async () => {
      calls.push('stop')
    })
    object.set.mockImplementation(async () => {
      calls.push('set')
    })
    const binding = new EntityMotionBinding(createConfig({ onError }))
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()

    binding.api.play()
    binding.api.stop()
    binding.api.set({ position: { x: 2 } })
    await vi.waitFor(() => {
      expect(calls).toEqual(['play'])
    })

    first.resolve(undefined)
    await vi.waitFor(() => {
      expect(calls).toEqual(['play', 'stop', 'set'])
    })
    expect(onError).toHaveBeenCalledOnce()
  })

  test('updates state from an event before reply while FIFO still waits for reply', async () => {
    const playReply = deferred<undefined>()
    const calls: string[] = []
    const { object, listeners } = createMockAnimationObject()
    object.play.mockImplementation(async () => {
      calls.push('play')
      object.playState = 'running'
      listeners.state?.('running')
      await playReply.promise
    })
    object.pause.mockImplementation(async () => {
      calls.push('pause')
      object.playState = 'paused'
      listeners.state?.('paused')
    })
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()

    binding.api.play()
    binding.api.pause()
    await vi.waitFor(() => expect(calls).toEqual(['play']))

    expect(binding.api.playState).toBe('running')
    playReply.resolve(undefined)
    await vi.waitFor(() => expect(calls).toEqual(['play', 'pause']))
    expect(binding.api.playState).toBe('paused')
  })

  test('keeps state unchanged when reply settles before the later state event', async () => {
    const { object, listeners } = createMockAnimationObject()
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()

    binding.api.play()
    await vi.waitFor(() => expect(object.play).toHaveBeenCalledOnce())
    expect(binding.api.playState).toBe('idle')

    object.playState = 'running'
    listeners.state?.('running')
    expect(binding.api.playState).toBe('running')
  })

  test('keeps post-destroy playback and set local without adding onError', async () => {
    const onError = vi.fn()
    let destroyed = false
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { object } = createMockAnimationObject()
    object.play.mockImplementation(async () => {
      if (!destroyed) throw new Error('unexpected live command')
    })
    object.set.mockImplementation(async () => {
      if (destroyed) {
        console.warn('Entity animation set ignored after destroy')
        return
      }
      throw new Error('unexpected live command')
    })
    const binding = new EntityMotionBinding(createConfig({ onError }))
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()
    destroyed = true

    binding.api.play()
    binding.api.set({ position: { x: 2 } })
    await vi.waitFor(() => expect(object.set).toHaveBeenCalledOnce())

    expect(onError).not.toHaveBeenCalled()
    expect(warning).toHaveBeenCalledOnce()
    warning.mockRestore()
  })

  test('derives public booleans from confirmed non-queued state', async () => {
    const { object, listeners } = createMockAnimationObject()
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()

    object.playState = 'running'
    listeners.state?.('running')
    expect(binding.api.isAnimating).toBe(true)
    expect(binding.api.isPaused).toBe(false)
    expect(binding.api.finished).toBe(false)

    object.playState = 'paused'
    listeners.state?.('paused')
    expect(binding.api.isAnimating).toBe(false)
    expect(binding.api.isPaused).toBe(true)

    object.playState = 'finished'
    listeners.state?.('finished')
    expect(binding.api.finished).toBe(true)
  })

  test('unbind clears mirror, invalidates unsent commands, and destroys the object', async () => {
    const first = deferred<undefined>()
    const { object, listeners } = createMockAnimationObject()
    object.play.mockImplementation(() => first.promise)
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()
    listeners.values?.({
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 4, y: 5, z: 6 },
      scale: { x: 1, y: 1, z: 1 },
    })

    binding.api.play()
    binding.api.finish()
    binding.__unbind()
    first.resolve(undefined)
    await flushPromises()

    expect(binding.entityProps).toEqual({})
    expect(object.finish).not.toHaveBeenCalled()
    expect(object.destroy).toHaveBeenCalledOnce()
  })

  test('terminates on creation failure and recovers only after unbind and rebind', async () => {
    const onError = vi.fn()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const binding = new EntityMotionBinding(createConfig({ onError }))
    const failingEntity = {
      id: 'entity-1',
      createAnimation: vi.fn(async (config: EntityMotionConfig) => {
        const error = {
          code: 'COMPILATION_FAILED' as const,
          reason: 'create failed',
        }
        config.onError?.(error)
        throw new Error(error.reason)
      }),
    }

    binding.__bind(failingEntity as any)
    binding.api.play()
    await flushPromises()

    expect(binding.api.playState).toBe('idle')
    expect(binding.entityProps).toEqual({})
    expect(onError).toHaveBeenCalledOnce()
    binding.api.finish()
    expect(warning).toHaveBeenCalledOnce()

    binding.__unbind()
    const { object } = createMockAnimationObject()
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()
    binding.api.play()
    await flushPromises()
    expect(object.play).toHaveBeenCalledOnce()
    warning.mockRestore()
  })

  test('rejects binding one animation object to multiple entities', () => {
    const creation = deferred<any>()
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation: () => creation.promise,
    } as any)

    expect(() =>
      binding.__bind({
        id: 'entity-2',
        createAnimation: () => creation.promise,
      } as any),
    ).toThrow('multiple entities')
  })

  test('throws invalid set updates synchronously before pre-create timing warnings', () => {
    const onError = vi.fn()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const binding = new EntityMotionBinding(createConfig({ onError }))

    for (const update of invalidUpdates) {
      expect(() => binding.api.set(update as never)).toThrow(Error)
    }

    expect(onError).not.toHaveBeenCalled()
    expect(warning).not.toHaveBeenCalled()
    warning.mockRestore()
  })

  test('throws invalid set updates synchronously without invoking a created object', async () => {
    const onError = vi.fn()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { object } = createMockAnimationObject()
    const binding = new EntityMotionBinding(createConfig({ onError }))
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()

    for (const update of invalidUpdates) {
      expect(() => binding.api.set(update as never)).toThrow(Error)
    }

    await flushPromises()
    expect(object.set).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
    expect(warning).not.toHaveBeenCalled()
    warning.mockRestore()
  })

  test('throws invalid set updates synchronously before terminated timing warnings', async () => {
    const onError = vi.fn()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const binding = new EntityMotionBinding(createConfig({ onError }))
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => {
        throw new Error('creation failed')
      }),
    } as any)
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce())

    for (const update of invalidUpdates) {
      expect(() => binding.api.set(update as never)).toThrow(Error)
    }

    expect(onError).toHaveBeenCalledOnce()
    expect(warning).not.toHaveBeenCalled()
    warning.mockRestore()
  })

  test('keeps one object for equivalent boundary authoring forms', async () => {
    const { object } = createMockAnimationObject()
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()

    for (const config of [
      {
        duration: 0.3,
        timeline: {
          from: { position: { x: 0 } },
          to: { position: { x: 1 } },
        },
        autoStart: false,
      },
      {
        duration: 0.3,
        timeline: {
          '0%': { position: { x: 0 } },
          '100%': { position: { x: 1 } },
        },
        autoStart: false,
      },
    ] satisfies EntityMotionConfig[]) {
      binding.updateConfig(config)
      binding.reconcileConfig()
    }
    await flushPromises()

    expect(object.destroy).not.toHaveBeenCalled()
  })

  test('keeps state and mirror while callback-only updates use the latest callback', async () => {
    const firstOnStart = vi.fn()
    const latestOnStart = vi.fn()
    const { object, listeners } = createMockAnimationObject()
    const binding = new EntityMotionBinding(
      createConfig({ onStart: firstOnStart }),
    )
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()
    const values = {
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 4, y: 5, z: 6 },
      scale: { x: 1, y: 1, z: 1 },
    }
    object.playState = 'running'
    listeners.state?.('running')
    listeners.values?.(values)
    listeners.start?.(values)
    firstOnStart.mockClear()

    binding.updateConfig(createConfig({ onStart: latestOnStart }))
    binding.reconcileConfig()
    listeners.start?.(values)

    expect(object.destroy).not.toHaveBeenCalled()
    expect(binding.api.playState).toBe('running')
    expect(binding.entityProps).toEqual(values)
    expect(firstOnStart).not.toHaveBeenCalled()
    expect(latestOnStart).toHaveBeenCalledOnce()
  })

  test('starts one replacement for a changed execution signature and keeps old events current while destroy is pending', async () => {
    const destruction = deferred<undefined>()
    const replacementCreation = deferred<any>()
    const { object, listeners } = createMockAnimationObject()
    const replacement = createMockAnimationObject('animation-2')
    object.destroy.mockImplementation(() => destruction.promise)
    const createAnimation = vi
      .fn()
      .mockResolvedValueOnce(object)
      .mockImplementationOnce(() => replacementCreation.promise)
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation,
      updateTransform: vi.fn(async () => undefined),
    } as any)
    await flushPromises()

    binding.updateConfig(createConfig({ duration: 2 }))
    binding.reconcileConfig()
    binding.reconcileConfig()

    await vi.waitFor(() => expect(object.destroy).toHaveBeenCalledOnce())
    const values = {
      position: { x: 7, y: 8, z: 9 },
      rotation: { x: 1, y: 2, z: 3 },
      scale: { x: 2, y: 2, z: 2 },
    }
    listeners.values?.(values)
    expect(binding.entityProps).toEqual(values)

    destruction.resolve(undefined)
    await vi.waitFor(() => expect(createAnimation).toHaveBeenCalledTimes(2))
    expect(binding.api.playState).toBe('idle')

    replacementCreation.resolve(replacement.object)
    await flushPromises()
  })

  test('waits for the old command tail, hands off a complete pose, and creates the latest replacement config', async () => {
    const inFlightPlay = deferred<undefined>()
    const destroy = deferred<undefined>()
    const calls: string[] = []
    const first = createMockAnimationObject('animation-1')
    const second = createMockAnimationObject('animation-2')
    first.object.play.mockImplementation(async () => {
      calls.push('old-play')
      await inFlightPlay.promise
    })
    first.object.pause.mockImplementation(async () => {
      calls.push('old-pause')
    })
    first.object.destroy.mockImplementation(async () => {
      calls.push('destroy')
      await destroy.promise
    })
    second.object.play.mockImplementation(async () => {
      calls.push('new-auto-play')
    })
    second.object.finish.mockImplementation(async () => {
      calls.push('new-finish')
    })
    const createAnimation = vi
      .fn()
      .mockResolvedValueOnce(first.object)
      .mockImplementationOnce(async (config: EntityMotionConfig) => {
        calls.push(`create-${config.duration}`)
        return second.object
      })
    const updateTransform = vi.fn(async (values: EntityMotionProps) => {
      calls.push('handoff')
      return values
    })
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation,
      updateTransform,
    } as any)
    await flushPromises()
    const pose = {
      position: { x: 7, y: 8, z: 9 },
      rotation: { x: 1, y: 2, z: 3 },
      scale: { x: 2, y: 2, z: 2 },
    }
    first.listeners.values?.(pose)

    binding.api.play()
    binding.api.pause()
    await vi.waitFor(() => expect(calls).toEqual(['old-play']))
    binding.updateConfig(createConfig({ duration: 2, autoStart: true }))
    binding.reconcileConfig()
    binding.api.finish()
    binding.updateConfig(createConfig({ duration: 3, autoStart: true }))
    binding.reconcileConfig()

    expect(first.object.destroy).not.toHaveBeenCalled()
    inFlightPlay.resolve(undefined)
    await vi.waitFor(() => expect(first.object.destroy).toHaveBeenCalledOnce())
    expect(first.object.pause).not.toHaveBeenCalled()

    destroy.resolve(undefined)
    await vi.waitFor(() => expect(createAnimation).toHaveBeenCalledTimes(2))
    await vi.waitFor(() =>
      expect(calls).toEqual([
        'old-play',
        'destroy',
        'handoff',
        'create-3',
        'new-auto-play',
        'new-finish',
      ]),
    )
    expect(updateTransform).toHaveBeenCalledWith(pose)
    expect(binding.entityProps).toEqual(pose)
  })

  test('skips an empty handoff and preserves explicit command order with autoStart false', async () => {
    const first = createMockAnimationObject('animation-1')
    const second = createMockAnimationObject('animation-2')
    const calls: string[] = []
    second.object.pause.mockImplementation(async () => {
      calls.push('pause')
    })
    second.object.finish.mockImplementation(async () => {
      calls.push('finish')
    })
    const createAnimation = vi
      .fn()
      .mockResolvedValueOnce(first.object)
      .mockResolvedValueOnce(second.object)
    const updateTransform = vi.fn(async () => undefined)
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation,
      updateTransform,
    } as any)
    await flushPromises()

    binding.updateConfig(createConfig({ duration: 2 }))
    binding.reconcileConfig()
    binding.api.pause()
    binding.api.finish()

    expect(binding.api.playState).toBe('queued')
    await vi.waitFor(() => expect(createAnimation).toHaveBeenCalledTimes(2))
    await vi.waitFor(() => expect(calls).toEqual(['pause', 'finish']))
    expect(updateTransform).not.toHaveBeenCalled()
    expect(second.object.play).not.toHaveBeenCalled()
    expect(binding.entityProps).toEqual({})
  })

  test('retains the old generation and reports once when destroy emits an error then rejects', async () => {
    const onError = vi.fn()
    const first = createMockAnimationObject('animation-1')
    const replacementError = {
      code: 'ANIMATION_NOT_FOUND' as const,
      reason: 'destroy failed',
    }
    first.object.destroy.mockImplementation(async () => {
      first.listeners.error?.(replacementError)
      throw new Error(replacementError.reason)
    })
    const createAnimation = vi.fn(async () => first.object)
    const updateTransform = vi.fn(async () => undefined)
    const binding = new EntityMotionBinding(createConfig({ onError }))
    binding.__bind({
      id: 'entity-1',
      createAnimation,
      updateTransform,
    } as any)
    await flushPromises()
    const pose = {
      position: { x: 7, y: 8, z: 9 },
      rotation: { x: 1, y: 2, z: 3 },
      scale: { x: 2, y: 2, z: 2 },
    }
    first.object.playState = 'running'
    first.listeners.values?.(pose)
    first.listeners.start?.(pose)
    onError.mockClear()

    binding.updateConfig(createConfig({ duration: 2, onError }))
    binding.reconcileConfig()
    binding.api.pause()
    binding.api.finish()
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce())

    expect(onError).toHaveBeenCalledWith(replacementError)
    expect(createAnimation).toHaveBeenCalledOnce()
    expect(updateTransform).not.toHaveBeenCalled()
    expect(binding.api.playState).toBe('running')
    expect(binding.entityProps).toEqual(pose)
    expect(first.object.pause).not.toHaveBeenCalled()
    expect(first.object.finish).not.toHaveBeenCalled()

    binding.api.play()
    await vi.waitFor(() => expect(first.object.play).toHaveBeenCalledOnce())
    binding.reconcileConfig()
    await flushPromises()
    expect(first.object.destroy).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledOnce()
  })

  test('reports a destroy rejection once when no native error event arrives', async () => {
    const onError = vi.fn()
    const first = createMockAnimationObject('animation-1')
    first.object.destroy.mockRejectedValue(new Error('destroy rejected'))
    const binding = new EntityMotionBinding(createConfig({ onError }))
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => first.object),
      updateTransform: vi.fn(async () => undefined),
    } as any)
    await flushPromises()

    binding.updateConfig(createConfig({ duration: 2, onError }))
    binding.reconcileConfig()

    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onError.mock.calls[0][0]).toMatchObject({
      code: 'ANIMATION_NOT_FOUND',
      reason: 'destroy rejected',
    })
  })

  test('terminates after pose handoff failure and recovers after explicit unbind and rebind', async () => {
    const onError = vi.fn()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const first = createMockAnimationObject('animation-1')
    const recovered = createMockAnimationObject('animation-2')
    const createAnimation = vi
      .fn()
      .mockResolvedValueOnce(first.object)
      .mockResolvedValueOnce(recovered.object)
    const updateTransform = vi.fn(async () => {
      throw new Error('handoff failed')
    })
    const binding = new EntityMotionBinding(createConfig({ onError }))
    const entity = {
      id: 'entity-1',
      createAnimation,
      updateTransform,
    }
    binding.__bind(entity as any)
    await flushPromises()
    first.listeners.values?.({
      position: { x: 7, y: 8, z: 9 },
      rotation: { x: 1, y: 2, z: 3 },
      scale: { x: 2, y: 2, z: 2 },
    })

    binding.updateConfig(createConfig({ duration: 2, onError }))
    binding.reconcileConfig()
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce())

    expect(createAnimation).toHaveBeenCalledOnce()
    expect(binding.api.playState).toBe('idle')
    expect(binding.entityProps).toEqual({})
    binding.api.play()
    expect(warning).toHaveBeenCalledOnce()

    binding.__unbind()
    binding.__bind(entity as any)
    await vi.waitFor(() => expect(createAnimation).toHaveBeenCalledTimes(2))
    binding.api.play()
    await vi.waitFor(() => expect(recovered.object.play).toHaveBeenCalledOnce())
    warning.mockRestore()
  })

  test('terminates replacement creation failure with one callback and ignores stale old events', async () => {
    const onError = vi.fn()
    const onStart = vi.fn()
    const first = createMockAnimationObject('animation-1')
    const createAnimation = vi
      .fn()
      .mockResolvedValueOnce(first.object)
      .mockImplementationOnce(async (config: EntityMotionConfig) => {
        config.onError?.({
          code: 'COMPILATION_FAILED',
          reason: 'replacement create failed',
        })
        throw new Error('replacement create failed')
      })
    const binding = new EntityMotionBinding(createConfig({ onError, onStart }))
    binding.__bind({
      id: 'entity-1',
      createAnimation,
      updateTransform: vi.fn(async () => undefined),
    } as any)
    await flushPromises()

    binding.updateConfig(createConfig({ duration: 2, onError, onStart }))
    binding.reconcileConfig()
    await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce())

    expect(createAnimation).toHaveBeenCalledTimes(2)
    expect(binding.api.playState).toBe('idle')
    expect(binding.entityProps).toEqual({})
    first.listeners.start?.({
      position: { x: 1, y: 1, z: 1 },
      rotation: { x: 1, y: 1, z: 1 },
      scale: { x: 1, y: 1, z: 1 },
    })
    expect(onStart).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledOnce()
  })

  test('clears the mirror on target replacement and ignores a stale pose handoff', async () => {
    const handoff = deferred<undefined>()
    const first = createMockAnimationObject('animation-1')
    const second = createMockAnimationObject('animation-2')
    const firstEntity = {
      id: 'entity-1',
      createAnimation: vi.fn(async () => first.object),
      updateTransform: vi.fn(() => handoff.promise),
    }
    const secondEntity = {
      id: 'entity-2',
      createAnimation: vi.fn(async () => second.object),
      updateTransform: vi.fn(async () => undefined),
    }
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind(firstEntity as any)
    await flushPromises()
    first.listeners.values?.({
      position: { x: 7, y: 8, z: 9 },
      rotation: { x: 1, y: 2, z: 3 },
      scale: { x: 2, y: 2, z: 2 },
    })

    binding.updateConfig(createConfig({ duration: 2 }))
    binding.reconcileConfig()
    await vi.waitFor(() =>
      expect(firstEntity.updateTransform).toHaveBeenCalledOnce(),
    )

    binding.__unbind()
    binding.__bind(secondEntity as any)
    expect(binding.entityProps).toEqual({})
    await vi.waitFor(() =>
      expect(secondEntity.createAnimation).toHaveBeenCalledOnce(),
    )

    handoff.resolve(undefined)
    first.listeners.values?.({
      position: { x: 10, y: 10, z: 10 },
      rotation: { x: 10, y: 10, z: 10 },
      scale: { x: 10, y: 10, z: 10 },
    })
    await flushPromises()

    expect(firstEntity.createAnimation).toHaveBeenCalledOnce()
    expect(binding.entityProps).toEqual({})
  })
})
