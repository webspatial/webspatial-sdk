import { afterEach, describe, expect, test, vi } from 'vitest'
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

function makeConfig(loop?: boolean | { reverse?: boolean }): {
  duration: number
  autoStart: false
  loop?: boolean | { reverse?: boolean }
  tracks: Array<{
    property: 'opacity'
    timingFunction: 'linear'
    keyframes: Array<{ at: number; value: number }>
  }>
  onStart: ReturnType<typeof vi.fn>
  onComplete: ReturnType<typeof vi.fn>
} {
  return {
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
    onStart: vi.fn(),
    onComplete: vi.fn(),
  }
}

function createBackend(loop?: boolean | { reverse?: boolean }) {
  const values: SpatializedVisualValues[] = []
  const stateChanges: string[] = []
  const config = makeConfig(loop)
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
    const { backend, values, config } = createBackend(true)

    backend.play()
    await vi.advanceTimersByTimeAsync(1100)

    const one = values.findIndex(v => v.opacity === 1)
    const zeroAfterOne = values.findIndex(
      (v, index) => index > one && v.opacity === 0,
    )

    expect(one).toBeGreaterThanOrEqual(0)
    expect(zeroAfterOne).toBeGreaterThan(one)
    expect(config.onComplete).not.toHaveBeenCalled()
  })

  test('ping-pongs for loop: { reverse: true } without jumping back to start', async () => {
    installFakeRaf()
    const { backend, values, config } = createBackend({ reverse: true })

    backend.play()
    await vi.advanceTimersByTimeAsync(1100)

    const one = values.findIndex(v => v.opacity === 1)
    expect(one).toBeGreaterThanOrEqual(0)

    const afterPeak = values.slice(one + 1).map(v => v.opacity ?? -1)
    expect(afterPeak.length).toBeGreaterThan(0)
    expect(afterPeak[0]).toBeLessThan(1)
    expect(afterPeak[0]).toBeGreaterThan(0)
    expect(afterPeak).not.toContain(0)
    expect(config.onComplete).not.toHaveBeenCalled()
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
