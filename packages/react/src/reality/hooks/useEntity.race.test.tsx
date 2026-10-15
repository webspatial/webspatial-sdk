import React, { Component, createRef, type ReactNode } from 'react'
import { renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import type { SpatialEntity } from '@webspatial/core-sdk'
import {
  ParentContext,
  RealityContext,
  type RealityContextValue,
} from '../context'
import { EntityMotionBinding } from './EntityMotionBinding'
import { EntityRef, type EntityRefShape } from './useEntityRef'
import { useEntity } from './useEntity'

/** Creates a manually resolved promise for the pending scene insertion. */
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(res => {
    resolve = res
  })
  return { promise, resolve }
}

class TestErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    return this.state.error ? (
      <div data-testid="use-entity-binding-error">
        {this.state.error.message}
      </div>
    ) : (
      this.props.children
    )
  }
}

function preventDuplicateBindingError(event: ErrorEvent) {
  if (
    event.error instanceof Error &&
    event.error.message.includes('multiple entities')
  ) {
    event.preventDefault()
  }
}

describe('useEntity pending addEntity cleanup', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('binds only the committed animation after async Entity creation', async () => {
    const insertion = deferred<{ success: boolean }>()
    const addEntity = vi.fn(() => insertion.promise)
    const entity = {
      id: 'entity-1',
      updateTransform: vi.fn(async () => undefined),
      destroy: vi.fn(),
    }
    const animationA = {
      __bind: vi.fn(),
      __unbind: vi.fn(),
    }
    const animationB = {
      __bind: vi.fn(),
      __unbind: vi.fn(),
    }
    const realityContext = {
      reality: { addEntity },
      resourceRegistry: {},
      attachmentRegistry: {},
    } as unknown as RealityContextValue
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RealityContext.Provider value={realityContext}>
        {children}
      </RealityContext.Provider>
    )

    const { rerender, unmount } = renderHook(
      ({ animation }) =>
        useEntity({
          ref: createRef<EntityRefShape>(),
          animation: animation as never,
          createEntity: vi.fn(async () => entity as never),
        }),
      {
        initialProps: { animation: animationA },
        wrapper,
      },
    )

    await waitFor(() => expect(addEntity).toHaveBeenCalledOnce())
    rerender({ animation: animationB })
    insertion.resolve({ success: true })

    await waitFor(() => expect(animationB.__bind).toHaveBeenCalledOnce())
    expect(animationA.__bind).not.toHaveBeenCalled()
    expect(animationA.__unbind).not.toHaveBeenCalled()

    unmount()
    expect(animationB.__unbind).toHaveBeenCalledOnce()
    expect(entity.destroy).toHaveBeenCalledOnce()
  })

  test('does not bind an animation removed before async Entity creation completes', async () => {
    const insertion = deferred<{ success: boolean }>()
    const addEntity = vi.fn(() => insertion.promise)
    const entity = {
      id: 'entity-1',
      updateTransform: vi.fn(async () => undefined),
      destroy: vi.fn(),
    }
    const animationA = {
      __bind: vi.fn(),
      __unbind: vi.fn(),
    }
    const ref = createRef<EntityRefShape>()
    const realityContext = {
      reality: { addEntity },
      resourceRegistry: {},
      attachmentRegistry: {},
    } as unknown as RealityContextValue
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RealityContext.Provider value={realityContext}>
        {children}
      </RealityContext.Provider>
    )

    const { rerender, unmount } = renderHook(
      ({ animation }) =>
        useEntity({
          ref,
          animation: animation as never,
          createEntity: vi.fn(async () => entity as never),
        }),
      {
        initialProps: { animation: animationA as object | undefined },
        wrapper,
      },
    )

    await waitFor(() => expect(addEntity).toHaveBeenCalledOnce())
    rerender({ animation: undefined })
    insertion.resolve({ success: true })

    await waitFor(() => expect(ref.current?.entity).toBe(entity))
    expect(animationA.__bind).not.toHaveBeenCalled()
    expect(animationA.__unbind).not.toHaveBeenCalled()

    unmount()
    expect(entity.destroy).toHaveBeenCalledOnce()
  })

  test('restores the latest declared transform after animation unbind completes', async () => {
    const destroyed = deferred<void>()
    const entity = {
      id: 'entity-1',
      updateTransform: vi.fn(async () => undefined),
      destroy: vi.fn(),
    }
    const animation = {
      __bind: vi.fn(),
      __unbind: vi.fn(() => destroyed.promise),
    }
    const realityContext = {
      reality: {
        addEntity: vi.fn(async () => ({ success: true })),
      },
      resourceRegistry: {},
      attachmentRegistry: {},
    } as unknown as RealityContextValue
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RealityContext.Provider value={realityContext}>
        {children}
      </RealityContext.Provider>
    )
    const { rerender } = renderHook(
      ({ animationProp, position }) =>
        useEntity({
          ref: createRef<EntityRefShape>(),
          animation: animationProp as never,
          position,
          createEntity: vi.fn(async () => entity as never),
        }),
      {
        initialProps: {
          animationProp: animation as object | undefined,
          position: { x: 0, y: 0, z: 0 },
        },
        wrapper,
      },
    )

    await waitFor(() => expect(animation.__bind).toHaveBeenCalledOnce())
    entity.updateTransform.mockClear()

    rerender({
      animationProp: undefined,
      position: { x: 2, y: 0, z: 0 },
    })
    await waitFor(() => expect(animation.__unbind).toHaveBeenCalledOnce())
    entity.updateTransform.mockClear()
    await Promise.resolve()
    expect(entity.updateTransform).not.toHaveBeenCalled()
    destroyed.resolve()

    await waitFor(() =>
      expect(entity.updateTransform).toHaveBeenCalledWith({
        position: { x: 2, y: 0, z: 0 },
      }),
    )
  })

  test('does not restore declared transform after a newer animation binds', async () => {
    const destroyed = deferred<void>()
    const entity = {
      id: 'entity-1',
      updateTransform: vi.fn(async () => undefined),
      destroy: vi.fn(),
    }
    const animationA = {
      __bind: vi.fn(),
      __unbind: vi.fn(() => destroyed.promise),
    }
    const animationB = {
      __bind: vi.fn(),
      __unbind: vi.fn(async () => undefined),
    }
    const realityContext = {
      reality: {
        addEntity: vi.fn(async () => ({ success: true })),
      },
      resourceRegistry: {},
      attachmentRegistry: {},
    } as unknown as RealityContextValue
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RealityContext.Provider value={realityContext}>
        {children}
      </RealityContext.Provider>
    )
    const position = { x: 0, y: 0, z: 0 }
    const { rerender } = renderHook(
      ({ animationProp }) =>
        useEntity({
          ref: createRef<EntityRefShape>(),
          animation: animationProp as never,
          position,
          createEntity: vi.fn(async () => entity as never),
        }),
      {
        initialProps: { animationProp: animationA as object | undefined },
        wrapper,
      },
    )

    await waitFor(() => expect(animationA.__bind).toHaveBeenCalledOnce())
    rerender({ animationProp: undefined })
    await waitFor(() => expect(animationA.__unbind).toHaveBeenCalledOnce())
    rerender({ animationProp: animationB })
    await waitFor(() => expect(animationB.__bind).toHaveBeenCalledOnce())
    entity.updateTransform.mockClear()

    destroyed.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(entity.updateTransform).not.toHaveBeenCalled()
  })

  test.each([
    ['parent', true],
    ['parent', false],
    ['reality', true],
    ['reality', false],
  ] as const)(
    'destroys the resolved entity without publishing or binding it through %s.addEntity when success is %s',
    async (target, success) => {
      const insertion = deferred<{ success: boolean }>()
      const addEntity = vi.fn(() => insertion.promise)
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const entity = {
        id: 'entity-1',
        updateTransform: vi.fn(async () => undefined),
        createAnimation: vi.fn(),
        destroy: vi.fn(),
      }
      const binding = new EntityMotionBinding({
        from: { position: { x: 0 } },
        to: { position: { x: 1 } },
        autoStart: false,
      })
      const bind = vi.spyOn(binding, '__bind')
      const updateEntity = vi.spyOn(EntityRef.prototype, 'updateEntity')
      const realityContext = {
        reality: {
          addEntity: target === 'reality' ? addEntity : vi.fn(),
        },
        resourceRegistry: {},
        attachmentRegistry: {},
      } as unknown as RealityContextValue
      const parent =
        target === 'parent' ? ({ addEntity } as unknown as SpatialEntity) : null
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RealityContext.Provider value={realityContext}>
          <ParentContext.Provider value={parent}>
            {children}
          </ParentContext.Provider>
        </RealityContext.Provider>
      )

      const { unmount } = renderHook(
        () =>
          useEntity({
            ref: createRef<EntityRefShape>(),
            animation: binding as never,
            createEntity: vi.fn(async () => entity as never),
          }),
        { wrapper },
      )
      await waitFor(() => expect(addEntity).toHaveBeenCalledOnce())

      unmount()
      insertion.resolve({ success })

      await waitFor(() => expect(entity.destroy).toHaveBeenCalledOnce())
      expect(updateEntity).not.toHaveBeenCalled()
      expect(bind).not.toHaveBeenCalled()
      expect(entity.createAnimation).not.toHaveBeenCalled()
      expect(consoleError).not.toHaveBeenCalled()
    },
  )

  test('publishes and binds normally, then unbinds and destroys once on unmount', async () => {
    const animationObject = {
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
      destroy: vi.fn(async () => undefined),
      onStart: vi.fn(),
      onComplete: vi.fn(),
      onStop: vi.fn(),
      onReset: vi.fn(),
      onError: vi.fn(),
      onValuesChange: vi.fn(),
      onPlayStateChange: vi.fn(),
    }
    const entity = {
      id: 'entity-1',
      updateTransform: vi.fn(async () => undefined),
      createAnimation: vi.fn(async () => animationObject),
      destroy: vi.fn(),
    }
    const binding = new EntityMotionBinding({
      from: { position: { x: 0 } },
      to: { position: { x: 1 } },
      autoStart: false,
    })
    const bind = vi.spyOn(binding, '__bind')
    const unbind = vi.spyOn(binding, '__unbind')
    const updateEntity = vi.spyOn(EntityRef.prototype, 'updateEntity')
    const realityContext = {
      reality: {
        addEntity: vi.fn(async () => ({ success: true })),
      },
      resourceRegistry: {},
      attachmentRegistry: {},
    } as unknown as RealityContextValue
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <RealityContext.Provider value={realityContext}>
        {children}
      </RealityContext.Provider>
    )

    const { unmount } = renderHook(
      () =>
        useEntity({
          ref: createRef<EntityRefShape>(),
          animation: binding as never,
          createEntity: vi.fn(async () => entity as never),
        }),
      { wrapper },
    )

    await waitFor(() => expect(entity.createAnimation).toHaveBeenCalledOnce())
    expect(updateEntity).toHaveBeenCalledOnce()
    expect(bind).toHaveBeenCalledOnce()

    unmount()

    await waitFor(() => expect(animationObject.destroy).toHaveBeenCalledOnce())
    unmount()
    await Promise.resolve()
    expect(unbind).toHaveBeenCalledOnce()
    expect(entity.destroy).toHaveBeenCalledOnce()
    expect(animationObject.destroy).toHaveBeenCalledOnce()
  })
})

describe('useEntity binding errors', () => {
  afterEach(() => {
    window.removeEventListener('error', preventDuplicateBindingError)
    vi.restoreAllMocks()
  })

  test('surfaces an initial duplicate binding without an external rerender', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    window.addEventListener('error', preventDuplicateBindingError)
    const pendingCreation = deferred<never>()
    const firstEntity = {
      id: 'entity-1',
      createAnimation: vi.fn(() => pendingCreation.promise),
    }
    const secondEntity = {
      id: 'entity-2',
      updateTransform: vi.fn(async () => undefined),
      createAnimation: vi.fn(),
      destroy: vi.fn(),
    }
    const binding = new EntityMotionBinding({
      from: { position: { x: 0 } },
      to: { position: { x: 1 } },
      autoStart: false,
    })
    binding.__bind(firstEntity as never)
    const realityContext = {
      reality: {
        addEntity: vi.fn(async () => ({ success: true })),
      },
      resourceRegistry: {},
      attachmentRegistry: {},
    } as unknown as RealityContextValue
    const wrapper = ({ children }: { children: ReactNode }) => (
      <TestErrorBoundary>
        <RealityContext.Provider value={realityContext}>
          {children}
        </RealityContext.Provider>
      </TestErrorBoundary>
    )

    renderHook(
      () =>
        useEntity({
          ref: createRef<EntityRefShape>(),
          animation: binding as never,
          createEntity: vi.fn(async () => secondEntity as never),
        }),
      { wrapper },
    )

    await waitFor(() =>
      expect(
        screen.getByTestId('use-entity-binding-error').textContent,
      ).toContain('multiple entities'),
    )
    expect(secondEntity.createAnimation).not.toHaveBeenCalled()
    expect(() => binding.__bind(firstEntity as never)).not.toThrow()
    await waitFor(() => expect(secondEntity.destroy).toHaveBeenCalledOnce())
  })
})
