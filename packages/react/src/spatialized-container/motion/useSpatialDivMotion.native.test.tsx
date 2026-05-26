import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('@webspatial/core-sdk', async () => {
  const actual = await vi.importActual('@webspatial/core-sdk')
  return {
    ...actual,
    supports: (name: string, tokens?: readonly string[]) =>
      name === 'useAnimation' && !!tokens?.includes('element'),
  }
})

const { useSpatialDivMotion } = await import('./useSpatialDivMotion')

function createMockElement(id = 'motion-element-1') {
  return {
    id,
    animateSpatialDiv: vi.fn().mockImplementation(async (cmd: any) => {
      if (cmd.type === 'play') {
        return {
          animationId: cmd.animationId,
          finished: new Promise(() => {}),
          canceled: new Promise(() => {}),
          failed: new Promise(() => {}),
        }
      }
      return undefined
    }),
    cleanupSpatialDivAnimationListeners: vi.fn(),
  }
}

async function flushPromises() {
  await act(async () => {
    await new Promise(r => setTimeout(r, 0))
  })
}

describe('useSpatialDivMotion native backend', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('multi-track native playback sends timeline without starting Web RAF', async () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame')
    const element = createMockElement()

    const { result } = renderHook(() =>
      useSpatialDivMotion({
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

    const playCalls = element.animateSpatialDiv.mock.calls.filter(
      ([cmd]) => cmd.type === 'play',
    )
    expect(playCalls).toHaveLength(1)
    expect(playCalls[0][0]).toEqual(
      expect.objectContaining({
        type: 'play',
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
      useSpatialDivMotion({
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

    expect(String(result.current.style.transform)).toContain('translate3d(30px')
  })
})
