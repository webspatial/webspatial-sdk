import { describe, expect, expectTypeOf, test, vi } from 'vitest'
import { act, render, renderHook } from '@testing-library/react'
import type { EntityTransformUpdate } from '@webspatial/core-sdk'
import {
  createElement,
  StrictMode,
  Suspense,
  useEffect,
  type ReactNode,
} from 'react'
import {
  type EntityMotionAnimation,
  useEntityAnimation,
} from './useEntityAnimation'

describe('useEntityAnimation redesign', () => {
  test('throws an invalid initial config during render without calling onError', () => {
    const onError = vi.fn()

    expect(() =>
      renderHook(() =>
        useEntityAnimation({
          from: { position: { x: 0 } },
          onError,
        }),
      ),
    ).toThrow('both from and to')
    expect(onError).not.toHaveBeenCalled()
  })

  test('throws an invalid config update during render without calling onError', () => {
    const onError = vi.fn()
    const { rerender } = renderHook(
      ({ valid }) =>
        useEntityAnimation(
          valid
            ? {
                from: { position: { x: 0 } },
                to: { position: { x: 1 } },
                onError,
              }
            : {
                from: { position: { x: 0 } },
                onError,
              },
        ),
      { initialProps: { valid: true } },
    )

    expect(() => rerender({ valid: false })).toThrow('both from and to')
    expect(onError).not.toHaveBeenCalled()
  })

  test('returns a stable experimental tuple with an empty confirmed mirror', () => {
    const { result, rerender } = renderHook(
      ({ duration }) =>
        useEntityAnimation({
          from: { position: { x: 0 } },
          to: { position: { x: 1 } },
          duration,
          autoStart: false,
        }),
      { initialProps: { duration: 1 } },
    )
    const [animation, api, entityProps] = result.current

    expect(entityProps).toEqual({})
    expect(api).toMatchObject({
      play: expect.any(Function),
      pause: expect.any(Function),
      stop: expect.any(Function),
      reset: expect.any(Function),
      finish: expect.any(Function),
      set: expect.any(Function),
    })

    act(() => rerender({ duration: 2 }))
    expect(result.current[0]).toBe(animation)
    expect(result.current[1]).toBe(api)
  })

  test('keeps binding methods outside the public opaque animation type', () => {
    expectTypeOf<EntityMotionAnimation>().not.toHaveProperty('__bind')
    expectTypeOf<EntityMotionAnimation>().not.toHaveProperty('__unbind')
  })

  test('exposes a synchronously validated set update through the hook api', () => {
    const onError = vi.fn()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() =>
      useEntityAnimation({
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
        autoStart: false,
        onError,
      }),
    )

    expectTypeOf(result.current[1].set)
      .parameter(0)
      .toEqualTypeOf<EntityTransformUpdate>()
    expect(() => result.current[1].set({})).toThrow(Error)
    expect(onError).not.toHaveBeenCalled()
    expect(warning).not.toHaveBeenCalled()
    warning.mockRestore()
  })

  test('updates the same object across repeated StrictMode renders', async () => {
    const object = {
      id: 'animation-1',
      playState: 'idle',
      isAnimating: false,
      isPaused: false,
      finished: false,
      play: vi.fn(async () => undefined),
      pause: vi.fn(async () => undefined),
      stop: vi.fn(async () => undefined),
      reset: vi.fn(async () => undefined),
      finish: vi.fn(async () => undefined),
      set: vi.fn(async () => undefined),
      update: vi.fn(async () => undefined),
      destroy: vi.fn(async () => undefined),
      onStart: vi.fn(),
      onComplete: vi.fn(),
      onStop: vi.fn(),
      onReset: vi.fn(),
      onError: vi.fn(),
      onPlayStateChange: vi.fn(),
      onValuesChange: vi.fn(),
    }
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(StrictMode, null, children)
    const { result, rerender } = renderHook(
      ({ duration }) =>
        useEntityAnimation({
          from: { position: { x: 0 } },
          to: { position: { x: 1 } },
          duration,
          autoStart: false,
        }),
      { initialProps: { duration: 1 }, wrapper },
    )
    ;(result.current[0] as any).__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
      updateTransform: vi.fn(async () => undefined),
    })
    await vi.waitFor(() => expect(result.current[1].playState).toBe('idle'))

    rerender({ duration: 2 })
    rerender({ duration: 2 })

    await vi.waitFor(() => expect(object.update).toHaveBeenCalled())
    expect(object.destroy).not.toHaveBeenCalled()
    expect(object.id).toBe('animation-1')
  })

  test('keeps an abandoned render from updating callbacks or the desired signature', async () => {
    const onStart = vi.fn()
    const abandonedOnStart = vi.fn()
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const listeners: {
      start?: (values: {
        position: { x: number; y: number; z: number }
        rotation: { x: number; y: number; z: number }
        scale: { x: number; y: number; z: number }
      }) => void
    } = {}
    const object = {
      id: 'animation-1',
      playState: 'running',
      isAnimating: true,
      isPaused: false,
      finished: false,
      play: vi.fn(async () => undefined),
      pause: vi.fn(async () => undefined),
      stop: vi.fn(async () => undefined),
      reset: vi.fn(async () => undefined),
      finish: vi.fn(async () => undefined),
      set: vi.fn(async () => undefined),
      update: vi.fn(async () => undefined),
      destroy: vi.fn(async () => undefined),
      onStart: vi.fn((listener: typeof listeners.start) => {
        listeners.start = listener
      }),
      onComplete: vi.fn(),
      onStop: vi.fn(),
      onReset: vi.fn(),
      onError: vi.fn(),
      onPlayStateChange: vi.fn(),
      onValuesChange: vi.fn(),
    }
    const suspended = new Promise<never>(() => {})
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(Suspense, { fallback: createElement('div') }, children)
    const { result, rerender } = renderHook(
      ({
        duration,
        callback,
        suspend,
        declareBoth,
      }: {
        duration: number
        callback: typeof onStart
        suspend: boolean
        declareBoth: boolean
      }) => {
        const tuple = useEntityAnimation({
          from: { position: { x: 0 } },
          to: { position: { x: 1 } },
          ...(declareBoth
            ? {
                timeline: {
                  from: { position: { x: 0 } },
                  to: { position: { x: 1 } },
                },
              }
            : {}),
          duration,
          autoStart: false,
          onStart: callback,
        })
        if (suspend) throw suspended
        return tuple
      },
      {
        initialProps: {
          duration: 1,
          callback: onStart,
          suspend: false,
          declareBoth: false,
        },
        wrapper,
      },
    )
    const binding = result.current[0] as any
    binding.__bind({
      id: 'entity-1',
      createAnimation: vi.fn(async () => object),
      updateTransform: vi.fn(async () => undefined),
    })
    await vi.waitFor(() => expect(result.current[1].playState).toBe('idle'))

    rerender({
      duration: 2,
      callback: abandonedOnStart,
      suspend: true,
      declareBoth: true,
    })
    const values = {
      position: { x: 1, y: 2, z: 3 },
      rotation: { x: 4, y: 5, z: 6 },
      scale: { x: 1, y: 1, z: 1 },
    }
    listeners.start?.(values)

    expect(onStart).toHaveBeenCalledWith(values)
    expect(abandonedOnStart).not.toHaveBeenCalled()
    expect(object.destroy).not.toHaveBeenCalled()
    expect(warning).not.toHaveBeenCalled()

    rerender({
      duration: 1,
      callback: onStart,
      suspend: false,
      declareBoth: false,
    })
    await Promise.resolve()
    expect(object.destroy).not.toHaveBeenCalled()
    warning.mockRestore()
  })

  test('warns once per committed precedence declaration lifecycle in StrictMode', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(StrictMode, null, children)
    const { rerender } = renderHook(
      ({ declareBoth }) =>
        useEntityAnimation({
          ...(declareBoth
            ? {
                from: { position: { x: 10 } },
                to: { position: { x: 20 } },
              }
            : {}),
          timeline: {
            from: { position: { x: 0 } },
            to: { position: { x: 1 } },
          },
          duration: 1,
          autoStart: false,
        }),
      { initialProps: { declareBoth: true }, wrapper },
    )

    await vi.waitFor(() => expect(warning).toHaveBeenCalledOnce())
    rerender({ declareBoth: true })
    rerender({ declareBoth: true })
    await Promise.resolve()
    expect(warning).toHaveBeenCalledOnce()

    rerender({ declareBoth: false })
    await Promise.resolve()
    rerender({ declareBoth: true })
    await vi.waitFor(() => expect(warning).toHaveBeenCalledTimes(2))
    warning.mockRestore()
  })

  test('commits the latest config before a child binds its late target', async () => {
    const object = {
      id: 'animation-1',
      playState: 'idle',
      isAnimating: false,
      isPaused: false,
      finished: false,
      play: vi.fn(async () => undefined),
      pause: vi.fn(async () => undefined),
      stop: vi.fn(async () => undefined),
      reset: vi.fn(async () => undefined),
      finish: vi.fn(async () => undefined),
      set: vi.fn(async () => undefined),
      update: vi.fn(async () => undefined),
      destroy: vi.fn(async () => undefined),
      onStart: vi.fn(),
      onComplete: vi.fn(),
      onStop: vi.fn(),
      onReset: vi.fn(),
      onError: vi.fn(),
      onPlayStateChange: vi.fn(),
      onValuesChange: vi.fn(),
    }
    const createAnimation = vi.fn(async () => object)
    const entity = {
      id: 'entity-1',
      createAnimation,
      updateTransform: vi.fn(async () => undefined),
    }
    const LateTarget = ({ animation }: { animation: unknown }) => {
      useEffect(() => {
        const binding = animation as {
          __bind(target: typeof entity): void
          __unbind(): void
        }
        binding.__bind(entity)
        return () => binding.__unbind()
      }, [animation])
      return null
    }
    const Parent = ({
      duration,
      autoStart,
      showTarget,
    }: {
      duration: number
      autoStart: boolean
      showTarget: boolean
    }) => {
      const [animation] = useEntityAnimation({
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
        duration,
        autoStart,
      })
      return showTarget ? createElement(LateTarget, { animation }) : null
    }
    const view = render(
      createElement(Parent, {
        duration: 1,
        autoStart: true,
        showTarget: false,
      }),
    )

    view.rerender(
      createElement(Parent, {
        duration: 2,
        autoStart: false,
        showTarget: true,
      }),
    )

    await vi.waitFor(() => expect(createAnimation).toHaveBeenCalledOnce())
    expect(createAnimation).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 2, autoStart: false }),
    )
    await Promise.resolve()
    expect(object.play).not.toHaveBeenCalled()
    view.unmount()
  })
})
