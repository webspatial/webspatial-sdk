import { describe, expect, test, vi } from 'vitest'
import type {
  EntityMotionConfig,
  EntityMotionProps,
  EntityPlaybackApi,
  EntityPlaybackError,
  SpatializedMotionPlayState,
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
    error?: (error: EntityPlaybackError) => void
    values?: (values: EntityMotionProps) => void
    state?: (state: SpatializedMotionPlayState) => void
  } = {}
  const object = {
    id,
    isDestroyed: false,
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
      (
        update: Parameters<EntityPlaybackApi['set']>[0],
      ) => Promise<EntityMotionProps | void>
    >(async () => undefined),
    update: vi.fn(async () => undefined),
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
  test('lets Core validate an invalid initial config synchronously without calling onError', () => {
    const onError = vi.fn()
    const binding = new EntityMotionBinding({
      from: { position: { x: 0 } },
      onError,
    })
    const createAnimation = vi.fn(() => {
      throw new Error(
        '[useEntityAnimation] top-level config requires both from and to',
      )
    })

    expect(() =>
      binding.__bind({
        id: 'entity-1',
        createAnimation,
      } as any),
    ).toThrow('both from and to')
    expect(createAnimation).toHaveBeenCalledOnce()
    expect(onError).not.toHaveBeenCalled()
  })

  test('rolls back binding state after synchronous creation failure', async () => {
    const binding = new EntityMotionBinding(createConfig({ autoStart: false }))
    const failingEntity = {
      id: 'entity-1',
      createAnimation: vi.fn(() => {
        throw new Error('invalid initial config')
      }),
    }

    expect(() => binding.__bind(failingEntity as any)).toThrow(
      'invalid initial config',
    )
    expect(binding.api.playState).toBe('idle')
    expect(binding.entityProps).toEqual({})

    const { object } = createMockAnimationObject()
    const replacementEntity = {
      id: 'entity-2',
      createAnimation: vi.fn(async () => object),
    }

    expect(() => binding.__bind(replacementEntity as any)).not.toThrow()
    await flushPromises()
    binding.api.play()
    await flushPromises()

    expect(object.play).toHaveBeenCalledOnce()
  })

  test('lets Core validate an invalid config update synchronously without calling onError', async () => {
    const onError = vi.fn()
    const { object } = createMockAnimationObject()
    const binding = new EntityMotionBinding(createConfig({ onError }))
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()

    object.update.mockImplementation(() => {
      throw new Error(
        '[useEntityAnimation] top-level config requires both from and to',
      )
    })
    expect(() =>
      binding.updateConfig({
        from: { position: { x: 0 } },
        onError,
      }),
    ).not.toThrow()

    expect(() => binding.reconcileConfig()).not.toThrow()
    expect(object.update).toHaveBeenCalledOnce()
    expect(binding.synchronousError?.message).toContain('both from and to')
    expect(onError).not.toHaveBeenCalled()
  })

  test('captures a Core synchronous config error before queued Native work', async () => {
    const onError = vi.fn()
    const play = deferred<undefined>()
    const { object } = createMockAnimationObject()
    object.play.mockImplementation(() => play.promise)
    object.update.mockImplementation(() => {
      throw new Error(
        '[useEntityAnimation] top-level config requires both from and to',
      )
    })
    const binding = new EntityMotionBinding(createConfig({ onError }))
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()

    binding.api.play()
    binding.updateConfig({
      from: { position: { x: 0 } },
      onError,
    })
    binding.reconcileConfig()
    expect(binding.synchronousError?.message).toContain('both from and to')

    play.resolve(undefined)
    await flushPromises()
    expect(object.update).toHaveBeenCalledOnce()
    expect(onError).not.toHaveBeenCalled()
  })

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

  test('passes timeline precedence declarations to Core on create and update', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { object } = createMockAnimationObject()
    const precedenceConfig = createConfig({
      timeline: {
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
      },
      duration: 1,
    })
    const entity = {
      id: 'entity-1',
      createAnimation: vi.fn(async (config: EntityMotionConfig) => {
        if (config.from !== undefined || config.to !== undefined) {
          console.warn('[Core] duplicate precedence warning')
        }
        return object
      }),
    }
    const binding = new EntityMotionBinding(createConfig({ autoStart: false }))

    try {
      binding.updateConfig(precedenceConfig)
      expect(warning).not.toHaveBeenCalled()
      binding.__bind(entity as any)
      await flushPromises()
      expect(warning).toHaveBeenCalledOnce()
      expect(entity.createAnimation).toHaveBeenCalledWith(
        expect.objectContaining({
          from: precedenceConfig.from,
          to: precedenceConfig.to,
          timeline: precedenceConfig.timeline,
        }),
      )

      object.update.mockImplementation(async (...args: unknown[]) => {
        const config = args[0] as EntityMotionConfig
        if (config.from !== undefined || config.to !== undefined) {
          console.warn('[Core] duplicate precedence warning')
        }
      })
      binding.updateConfig({ duration: 2 })
      binding.updateConfig({ ...precedenceConfig, duration: 2 })
      binding.reconcileConfig()
      await flushPromises()
      expect(warning).toHaveBeenCalledTimes(2)
      expect(object.update).toHaveBeenCalledWith(
        expect.objectContaining({
          from: precedenceConfig.from,
          to: precedenceConfig.to,
          timeline: precedenceConfig.timeline,
        }),
      )
    } finally {
      warning.mockRestore()
    }
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

  test('delegates autoStart first and pre-create playback commands in call order', async () => {
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

    expect(calls).toEqual(['play', 'pause', 'finish'])
    play.resolve(undefined)
    await flushPromises()
  })

  test('warns and drops set before native object creation', async () => {
    const creation = deferred<any>()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation: () => creation.promise,
    } as any)

    expect(() => binding.api.set({} as never)).not.toThrow()
    binding.api.set({ position: { x: 2 } })

    const { object } = createMockAnimationObject()
    creation.resolve(object)
    await flushPromises()
    expect(warning).toHaveBeenCalledTimes(2)
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

  test('delegates created commands immediately in call order', async () => {
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
    expect(calls).toEqual(['play', 'stop', 'set'])

    first.resolve(undefined)
    await flushPromises()
    expect(onError).toHaveBeenCalledOnce()
  })

  test('delegates consecutive controls and consumes Core state events', async () => {
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
    expect(calls).toEqual(['play', 'pause'])
    expect(binding.api.playState).toBe('paused')
    playReply.resolve(undefined)
    await flushPromises()
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

  test('unbind clears the mirror and delegates invalidation to Core destroy', async () => {
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
    expect(object.finish).toHaveBeenCalledOnce()
    expect(object.destroy).toHaveBeenCalledOnce()
  })

  test('delegates commands immediately so Core handles native destruction', async () => {
    const first = deferred<undefined>()
    const { object } = createMockAnimationObject()
    object.play.mockImplementation(() => first.promise)
    const binding = new EntityMotionBinding(createConfig())
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()

    binding.api.play()
    binding.api.finish()
    await vi.waitFor(() => expect(object.play).toHaveBeenCalledOnce())

    object.isDestroyed = true
    first.resolve(undefined)
    await flushPromises()

    expect(object.finish).toHaveBeenCalledOnce()
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

  test('warns and drops set updates before Core object creation', () => {
    const onError = vi.fn()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const binding = new EntityMotionBinding(createConfig({ onError }))

    for (const update of invalidUpdates) {
      expect(() => binding.api.set(update as never)).not.toThrow()
    }

    expect(onError).not.toHaveBeenCalled()
    expect(warning).toHaveBeenCalledTimes(invalidUpdates.length)
    warning.mockRestore()
  })

  test('delegates set synchronously to the created Core object', async () => {
    const onError = vi.fn()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { object } = createMockAnimationObject()
    object.set.mockImplementation(() => {
      throw new Error('Core set validation failed')
    })
    const binding = new EntityMotionBinding(createConfig({ onError }))
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
    } as any)
    await flushPromises()

    expect(() => binding.api.set({ position: { x: 2 } })).toThrow(
      'Core set validation failed',
    )

    await flushPromises()
    expect(object.set).toHaveBeenCalledOnce()
    expect(onError).not.toHaveBeenCalled()
    expect(warning).not.toHaveBeenCalled()
    warning.mockRestore()
  })

  test('warns and drops set updates after binding termination', async () => {
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
      expect(() => binding.api.set(update as never)).not.toThrow()
    }

    expect(onError).toHaveBeenCalledOnce()
    expect(warning).toHaveBeenCalledTimes(invalidUpdates.length)
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
})
