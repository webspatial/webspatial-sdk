import React, { createRef } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
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

describe('useEntity pending addEntity cleanup', () => {
  afterEach(() => {
    vi.restoreAllMocks()
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
