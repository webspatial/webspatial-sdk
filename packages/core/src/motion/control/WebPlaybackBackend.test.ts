import { afterEach, describe, expect, test, vi } from 'vitest'
import type { SpatializedMotionConfig } from '../../types/spatializedMotion'
import type { SpatializedVisualValues } from '../../types/spatializedVisual'
import { WebPlaybackBackend } from './WebPlaybackBackend'

function installFakeRaf() {
  vi.useFakeTimers()
  vi.stubGlobal(
    'requestAnimationFrame',
    (cb: FrameRequestCallback): number =>
      setTimeout(() => cb(performance.now()), 16) as unknown as number,
  )
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    clearTimeout(id)
  })
}

function makeConfig(loop?: boolean | { reverse?: boolean }) {
  const onComplete = vi.fn((_values: SpatializedVisualValues) => {})
  const config: SpatializedMotionConfig & { autoStart: false } = {
    duration: 1,
    autoStart: false,
    loop,
    tracks: [
      {
        property: 'opacity',
        timingFunction: 'linear',
        keyframes: [
          { at: 0, value: 0 },
          { at: 1, value: 1 },
        ],
      },
    ],
    onStart: vi.fn(() => {}),
    onComplete,
  }

  return { config, onComplete }
}

function createBackend(loop?: boolean | { reverse?: boolean }) {
  const values: SpatializedVisualValues[] = []
  const stateChanges: string[] = []
  const { config, onComplete } = makeConfig(loop)
  const ctx = {
    getConfig: () => config,
    emitValues: (value: SpatializedVisualValues) => {
      values.push(value)
    },
    notifyStateChange: () => {
      stateChanges.push('changed')
    },
    isDestroyed: () => false,
    isPendingPlay: () => false,
    clearPendingPlay: vi.fn(),
  }

  return {
    backend: new WebPlaybackBackend(ctx),
    config,
    onComplete,
    values,
    stateChanges,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('WebPlaybackBackend looping behavior', () => {
  test('keeps reset-loop behavior for loop: true', async () => {
    installFakeRaf()
    const { backend, values, onComplete } = createBackend(true)

    backend.play()
    await vi.advanceTimersByTimeAsync(1100)

    const one = values.findIndex(v => v.opacity === 1)
    const zeroAfterOne = values.findIndex(
      (v, index) => index > one && v.opacity === 0,
    )

    expect(one).toBeGreaterThanOrEqual(0)
    expect(zeroAfterOne).toBeGreaterThan(one)
    expect(onComplete).not.toHaveBeenCalled()
  })

  test('ping-pongs for loop: { reverse: true } without jumping back to start', async () => {
    installFakeRaf()
    const { backend, values, onComplete } = createBackend({ reverse: true })

    backend.play()
    await vi.advanceTimersByTimeAsync(1100)

    const one = values.findIndex(v => v.opacity === 1)
    expect(one).toBeGreaterThanOrEqual(0)

    const afterPeak = values.slice(one + 1).map(v => v.opacity ?? -1)
    expect(afterPeak.length).toBeGreaterThan(0)
    expect(afterPeak[0]).toBeLessThan(1)
    expect(afterPeak[0]).toBeGreaterThan(0)
    expect(afterPeak).not.toContain(0)
    expect(onComplete).not.toHaveBeenCalled()
  })

  test('resumes reverse loop without losing direction after pause and starts new plays forward', async () => {
    installFakeRaf()
    const { backend, values } = createBackend({ reverse: true })

    backend.play()
    await vi.advanceTimersByTimeAsync(1100)

    const beforePause = values[values.length - 1].opacity as number
    backend.pause()
    await vi.advanceTimersByTimeAsync(200)
    backend.resume()
    await vi.advanceTimersByTimeAsync(100)

    const afterResume = values[values.length - 1].opacity as number
    expect(afterResume).toBeLessThan(beforePause)

    backend.stop()
    values.length = 0

    backend.play()
    await vi.advanceTimersByTimeAsync(100)

    const restarted = values[values.length - 1].opacity as number
    expect(restarted).toBeGreaterThan(0)
    expect(restarted).toBeLessThan(1)
  })
})
