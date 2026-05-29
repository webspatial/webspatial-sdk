import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('@webspatial/core-sdk', async () => {
  const actual = await vi.importActual('@webspatial/core-sdk')
  return {
    ...actual,
    supports: (name: string, tokens?: readonly string[]) =>
      name === 'useSpatializedMotion' &&
      !!tokens?.some(token => token === 'spatialized2d'),
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

describe('useSpatializedMotion tuple api native backend', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('uses native spatialized2d motion capability without legacy element token', async () => {
    const element = createMockElement()

    const { result } = renderHook(() =>
      useSpatializedMotion({
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
      result.current[0].__setElement?.(element as any, 'spatialized2d')
      result.current[1].play()
    })
    await waitFor(() => {
      expect(element.animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'play',
          targetKind: 'spatialized2d',
        }),
      )
    })
  })

  test('pre-bind play queues until the target resolves', async () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame')
    const element = createMockElement()

    const { result } = renderHook(() =>
      useSpatializedMotion({
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
      result.current[1].play()
    })
    expect(result.current[1].playState).toBe('queued')

    await act(async () => {
      result.current[0].__setElement?.(element as any, 'spatialized2d')
    })
    await waitFor(() => {
      expect(element.animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'play' }),
      )
    })

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
          ]),
        }),
      }),
    )
    expect(rafSpy).not.toHaveBeenCalled()
  })

  test('native pause syncs style to timeline sample at elapsed progress', async () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    const element = createMockElement()

    const { result } = renderHook(() =>
      useSpatializedMotion({
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
      result.current[0].__setElement?.(element as any, 'spatialized2d')
      result.current[1].play()
    })
    await waitFor(() => {
      expect(element.animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'play' }),
      )
    })

    now = 1500

    await act(async () => {
      result.current[1].pause()
    })
    await flushPromises()

    expect(String(result.current[2].transform)).toContain('translate3d(30px')
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
      result.current[0].__setElement?.(element as any, 'spatialized2d')
      result.current[1].play()
    })
    await flushPromises()

    await act(async () => {
      result.current[1].pause()
    })
    await waitFor(() => {
      expect(String(result.current[2].transform)).toContain('translate3d(42px')
    })
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
      result.current[0].__setElement?.(element as any, 'spatialized2d')
      result.current[1].play()
    })
    await waitFor(() => {
      expect(element.animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'play' }),
      )
    })

    await act(async () => {
      resolveFinished({ transform: { translate: { x: 99 } } })
    })
    await flushPromises()

    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        transform: { translate: { x: 99 } },
      }),
    )
    expect(String(result.current[2].transform)).toContain('translate3d(99px')
  })

  test('__onUnbind does not invoke onReset', async () => {
    const element = createMockElement()
    const onReset = vi.fn()

    const { result } = renderHook(() =>
      useSpatializedMotion({
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
        onReset,
      }),
    )

    await act(async () => {
      result.current[0].__setElement?.(element as any, 'spatialized2d')
      result.current[1].play()
    })
    await waitFor(() => {
      expect(element.animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'play' }),
      )
    })

    await act(async () => {
      result.current[0].__onUnbind?.()
    })
    await waitFor(() => {
      expect(element.animateMotion).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cancel',
          targetKind: 'spatialized2d',
        }),
      )
    })

    expect(onReset).not.toHaveBeenCalled()
  })
})
