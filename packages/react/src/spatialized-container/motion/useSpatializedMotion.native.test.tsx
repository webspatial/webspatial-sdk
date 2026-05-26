import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('@webspatial/core-sdk', async () => {
  const actual = await vi.importActual('@webspatial/core-sdk')
  return {
    ...actual,
    supports: (name: string, tokens?: readonly string[]) =>
      name === 'useSpatializedMotion' && !!tokens?.includes('spatialized2d'),
  }
})

const { useSpatializedMotion } = await import('./useSpatializedMotion')

function createMockElement(id = 'motion-element-1') {
  const animateMotion = vi.fn().mockImplementation(async (cmd: any) => {
    if (cmd.type === 'play') {
      return {
        animationId: cmd.animationId,
        finished: new Promise(() => {}),
        canceled: new Promise(() => {}),
        failed: new Promise(() => {}),
      }
    }
    return undefined
  })
  return {
    id,
    animateMotion,
    /** Legacy alias; motion bridge uses {@link animateMotion}. */
    animateSpatialDiv: animateMotion,
    cleanupSpatialDivAnimationListeners: vi.fn(),
  }
}

async function flushPromises() {
  await act(async () => {
    await new Promise(r => setTimeout(r, 0))
  })
}

describe('useSpatializedMotion (spatialized2d) native backend', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('multi-track native playback sends timeline without starting Web RAF', async () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame')
    const element = createMockElement()

    const { result } = renderHook(() =>
      useSpatializedMotion({
        kind: 'spatialized2d',
        duration: 5,
        autoStart: false,
        tracks: [
          {
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 5, value: 100 },
            ],
            easing: 'linear',
          },
          {
            property: 'opacity',
            keyframes: [
              { at: 3, value: 0 },
              { at: 5, value: 1 },
            ],
            easing: 'easeOut',
          },
        ],
      }),
    )

    await act(async () => {
      expect(result.current.motion).toBeDefined()
      result.current.motion!.__setElement!(element as any)
      result.current.api.play()
    })
    await flushPromises()

    const playCalls = element.animateMotion.mock.calls.filter(
      ([cmd]) => cmd.type === 'play',
    )
    expect(playCalls).toHaveLength(1)
    expect(playCalls[0][0]).toEqual(
      expect.objectContaining({
        type: 'play',
        targetKind: 'spatialized2d',
        elementId: element.id,
        timeline: expect.objectContaining({
          duration: 5,
          tracks: expect.arrayContaining([
            expect.objectContaining({ property: 'transform.translate.x' }),
            expect.objectContaining({ property: 'opacity' }),
          ]),
        }),
      }),
    )
    expect(playCalls[0][0].from).toBeUndefined()
    expect(playCalls[0][0].to).toBeUndefined()
    expect(rafSpy).not.toHaveBeenCalled()
  })

  test('native pause syncs style to timeline sample at elapsed progress', async () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    const element = createMockElement()

    const { result } = renderHook(() =>
      useSpatializedMotion({
        kind: 'spatialized2d',
        duration: 5,
        autoStart: false,
        tracks: [
          {
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 5, value: 100 },
            ],
            easing: 'linear',
          },
        ],
      }),
    )

    await act(async () => {
      result.current.motion!.__setElement!(element as any)
      result.current.api.play()
    })
    await flushPromises()

    now = 1500

    await act(async () => {
      result.current.api.pause()
    })
    await flushPromises()

    expect(result.current.kind).toBe('spatialized2d')
    if (result.current.kind !== 'spatialized2d') return
    expect(String(result.current.style.transform)).toContain('translate3d(30px')
  })

  test('native pause prefers bridge-reported values over wall-clock estimate', async () => {
    const element = createMockElement()
    element.animateMotion.mockImplementation(async (cmd: any) => {
      if (cmd.type === 'play') {
        return {
          animationId: cmd.animationId,
          finished: new Promise(() => {}),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      if (cmd.type === 'pause') {
        return { transform: { translate: { x: 42 } } }
      }
      return undefined
    })

    const { result } = renderHook(() =>
      useSpatializedMotion({
        kind: 'spatialized2d',
        duration: 5,
        autoStart: false,
        tracks: [
          {
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 5, value: 100 },
            ],
            easing: 'linear',
          },
        ],
      }),
    )

    await act(async () => {
      result.current.motion!.__setElement!(element as any)
      result.current.api.play()
    })
    await flushPromises()

    await act(async () => {
      result.current.api.pause()
    })
    await flushPromises()

    expect(result.current.kind).toBe('spatialized2d')
    if (result.current.kind !== 'spatialized2d') return
    expect(String(result.current.style.transform)).toContain('translate3d(42px')
  })

  test('native onComplete applies finalValues to style', async () => {
    let resolveFinished!: (v: {
      transform?: { translate?: { x?: number } }
    }) => void
    const element = createMockElement()
    element.animateMotion.mockImplementation(async (cmd: any) => {
      if (cmd.type === 'play') {
        return {
          animationId: cmd.animationId,
          finished: new Promise(r => {
            resolveFinished = r
          }),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    })

    const onComplete = vi.fn()
    const { result } = renderHook(() =>
      useSpatializedMotion({
        kind: 'spatialized2d',
        duration: 5,
        autoStart: false,
        tracks: [
          {
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 5, value: 100 },
            ],
            easing: 'linear',
          },
        ],
        onComplete,
      }),
    )

    await act(async () => {
      result.current.motion!.__setElement!(element as any)
      result.current.api.play()
    })
    await flushPromises()

    await act(async () => {
      resolveFinished({ transform: { translate: { x: 99 } } })
    })
    await flushPromises()

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: { translate: { x: 99 } },
      }),
    )
    expect(result.current.kind).toBe('spatialized2d')
    if (result.current.kind !== 'spatialized2d') return
    expect(String(result.current.style.transform)).toContain('translate3d(99px')
  })

  test('__onUnbind does not invoke onCancel', async () => {
    const element = createMockElement()
    const onCancel = vi.fn()

    const { result } = renderHook(() =>
      useSpatializedMotion({
        kind: 'spatialized2d',
        duration: 1,
        autoStart: false,
        tracks: [
          {
            property: 'opacity',
            keyframes: [
              { at: 0, value: 0 },
              { at: 1, value: 1 },
            ],
          },
        ],
        onCancel,
      }),
    )

    await act(async () => {
      result.current.motion!.__setElement!(element as any)
      result.current.api.play()
    })
    await flushPromises()

    await act(async () => {
      result.current.motion!.__onUnbind!()
    })
    await flushPromises()

    expect(onCancel).not.toHaveBeenCalled()
    expect(element.animateMotion).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'cancel', targetKind: 'spatialized2d' }),
    )
  })
})
