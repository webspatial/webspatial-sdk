import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SpatialObject } from './SpatialObject'

const bridge = vi.hoisted(() => ({
  destroy: vi.fn(),
  inspect: vi.fn(),
}))

vi.mock('./JSBCommand', () => ({
  DestroyCommand: class {
    constructor(private id: string) {}
    execute() {
      return bridge.destroy(this.id)
    }
  },
  InspectCommand: class {
    constructor(private id: string) {}
    execute() {
      return bridge.inspect(this.id)
    }
  },
}))

class TestSpatialObject extends SpatialObject {
  cleanup = vi.fn()
  protected onDestroy() {
    this.cleanup()
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const missingNativeObject = {
  success: false,
  errorMessage:
    'Failed to destroy SpatialObject: invalid inspect spatial object id obj-1 not exsit!',
}

beforeEach(() => {
  vi.resetAllMocks()
  bridge.destroy.mockResolvedValue({ success: true, data: undefined })
})

describe('SpatialObject destroy lifecycle', () => {
  it('coalesces concurrent destroy calls and runs cleanup once', async () => {
    const result = deferred<{ success: boolean; data: { released: boolean } }>()
    bridge.destroy.mockReturnValue(result.promise)
    const object = new TestSpatialObject('obj-1')
    const first = object.destroy()
    const second = object.destroy()
    const third = object.destroy()

    expect(bridge.destroy).toHaveBeenCalledTimes(1)
    expect(bridge.destroy).toHaveBeenCalledWith('obj-1')
    expect(object.isDestroyed).toBe(false)
    result.resolve({ success: true, data: { released: true } })

    await expect(Promise.all([first, second, third])).resolves.toEqual([
      { released: true },
      { released: true },
      { released: true },
    ])
    expect(object.cleanup).toHaveBeenCalledTimes(1)
    expect(object.isDestroyed).toBe(true)
  })

  it('makes sequential destruction a no-op after success', async () => {
    const object = new TestSpatialObject('obj-1')
    await object.destroy()
    await object.destroy()
    expect(bridge.destroy).toHaveBeenCalledTimes(1)
    expect(object.cleanup).toHaveBeenCalledTimes(1)
  })

  it('tolerates native pre-teardown and runs local cleanup once', async () => {
    bridge.destroy.mockResolvedValue(missingNativeObject)
    const object = new TestSpatialObject('obj-1')

    await expect(object.destroy()).resolves.toBeUndefined()
    await expect(object.destroy()).resolves.toBeUndefined()

    expect(object.isDestroyed).toBe(true)
    expect(object.cleanup).toHaveBeenCalledTimes(1)
    expect(bridge.destroy).toHaveBeenCalledTimes(1)
  })

  it('shares a missing-native-object completion between overlapping owners', async () => {
    const result = deferred<typeof missingNativeObject>()
    bridge.destroy.mockReturnValue(result.promise)
    const object = new TestSpatialObject('obj-1')
    const first = object.destroy()
    const second = object.destroy()
    expect(bridge.destroy).toHaveBeenCalledTimes(1)
    result.resolve(missingNativeObject)

    await expect(Promise.all([first, second])).resolves.toEqual([
      undefined,
      undefined,
    ])
    expect(object.cleanup).toHaveBeenCalledTimes(1)
    expect(object.isDestroyed).toBe(true)
  })

  it('preserves real command errors and allows a later retry', async () => {
    bridge.destroy.mockResolvedValueOnce({
      success: false,
      errorMessage: 'Permission denied',
    })
    const object = new TestSpatialObject('obj-1')
    await expect(object.destroy()).rejects.toThrow('Permission denied')
    expect(object.isDestroyed).toBe(false)
    expect(object.cleanup).not.toHaveBeenCalled()

    await expect(object.destroy()).resolves.toBeUndefined()
    expect(bridge.destroy).toHaveBeenCalledTimes(2)
    expect(object.cleanup).toHaveBeenCalledTimes(1)
  })

  it('shares a transport rejection without issuing duplicate requests', async () => {
    const result = deferred<{ success: boolean }>()
    bridge.destroy.mockReturnValueOnce(result.promise)
    const object = new TestSpatialObject('obj-1')
    const first = object.destroy()
    const second = object.destroy()
    const settled = Promise.allSettled([first, second])
    const error = new Error('Bridge transport failed')
    result.reject(error)

    await expect(settled).resolves.toEqual([
      { status: 'rejected', reason: error },
      { status: 'rejected', reason: error },
    ])
    expect(bridge.destroy).toHaveBeenCalledTimes(1)
    expect(object.cleanup).not.toHaveBeenCalled()
    expect(object.isDestroyed).toBe(false)

    await object.destroy()
    expect(bridge.destroy).toHaveBeenCalledTimes(2)
    expect(object.cleanup).toHaveBeenCalledTimes(1)
  })

  it('shares a command failure and leaves cleanup retryable', async () => {
    const result = deferred<{ success: boolean; errorMessage: string }>()
    bridge.destroy.mockReturnValueOnce(result.promise)
    const object = new TestSpatialObject('obj-1')
    const settled = Promise.allSettled([object.destroy(), object.destroy()])
    result.resolve({ success: false, errorMessage: 'Runtime unavailable' })

    const outcomes = await settled
    for (const outcome of outcomes) {
      expect(outcome.status).toBe('rejected')
      if (outcome.status === 'rejected') {
        expect(outcome.reason.message).toBe('Runtime unavailable')
      }
    }
    expect(bridge.destroy).toHaveBeenCalledTimes(1)
    expect(object.isDestroyed).toBe(false)

    await object.destroy()
    expect(bridge.destroy).toHaveBeenCalledTimes(2)
    expect(object.cleanup).toHaveBeenCalledTimes(1)
  })

  it('ignores a failed reply when a native event already marked the object destroyed', async () => {
    const result = deferred<typeof missingNativeObject>()
    bridge.destroy.mockReturnValue(result.promise)
    const object = new TestSpatialObject('obj-1')
    const destruction = object.destroy()
    object.isDestroyed = true
    result.resolve(missingNativeObject)

    await expect(destruction).resolves.toBeUndefined()
    expect(object.cleanup).not.toHaveBeenCalled()
  })

  it('preserves cleanup errors instead of suppressing them', async () => {
    const error = new Error('Local cleanup failed')
    const object = new TestSpatialObject('obj-1')
    object.cleanup.mockImplementationOnce(() => {
      throw error
    })
    await expect(object.destroy()).rejects.toBe(error)
    expect(object.isDestroyed).toBe(false)

    bridge.destroy.mockResolvedValueOnce(missingNativeObject)
    await object.destroy()
    expect(bridge.destroy).toHaveBeenCalledTimes(2)
    expect(object.cleanup).toHaveBeenCalledTimes(2)
    expect(object.isDestroyed).toBe(true)
  })

  it('preserves successful inspect results', async () => {
    bridge.inspect.mockResolvedValue({ success: true, data: { id: 'obj-1' } })
    await expect(new SpatialObject('obj-1').inspect()).resolves.toEqual({
      id: 'obj-1',
    })
  })

  it('preserves inspect failures', async () => {
    bridge.inspect.mockResolvedValue({
      success: false,
      errorMessage: 'Inspect unavailable',
    })
    await expect(new SpatialObject('obj-1').inspect()).rejects.toThrow(
      'Inspect unavailable',
    )
  })
})
