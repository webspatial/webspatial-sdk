import { describe, expect, test, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { AnimatedProps } from '@webspatial/core-sdk'
import { useEntityTransform } from './useEntityTransform'

// ---- Mock Entity ----

function createMockEntity() {
  return {
    id: 'entity-1',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    updateTransform: vi.fn(async () => {}),
  } as any
}

// ---- Mock AnimatedProps ----

function createMockAnimation(opts: {
  animating: boolean
  suppressedFields: ('position' | 'rotation' | 'scale')[] | null
}): AnimatedProps {
  return {
    __animationObjectId: 'anim-1',
    __animatedFields: ['position'] as const,
    get __animating() {
      return opts.animating
    },
    __bind: vi.fn(),
    __unbind: vi.fn(),
    __getSuppressedFields: () => opts.suppressedFields,
  } as any
}

describe('useEntityTransform', () => {
  describe('basic transform sync', () => {
    test('syncs position to entity on mount', () => {
      const entity = createMockEntity()
      const position = { x: 1, y: 2, z: 3 }

      renderHook(() =>
        useEntityTransform(entity, {
          position,
          rotation: undefined,
          scale: undefined,
        }),
      )

      expect(entity.updateTransform).toHaveBeenCalledWith({ position })
    })

    test('does not sync when position has not changed', () => {
      const entity = createMockEntity()
      const position = { x: 1, y: 2, z: 3 }

      const { rerender } = renderHook(
        props => useEntityTransform(entity, props),
        {
          initialProps: {
            position,
            rotation: undefined,
            scale: undefined,
            animation: undefined,
          },
        },
      )

      entity.updateTransform.mockClear()

      // Re-render with same position reference
      rerender({
        position,
        rotation: undefined,
        scale: undefined,
        animation: undefined,
      })

      expect(entity.updateTransform).not.toHaveBeenCalled()
    })
  })

  describe('animation suppression and resync', () => {
    test('does not sync suppressed fields during animation', () => {
      const entity = createMockEntity()
      const position = { x: 0, y: 0.5, z: 0 }
      const animation = createMockAnimation({
        animating: true,
        suppressedFields: ['position'],
      })

      renderHook(() =>
        useEntityTransform(entity, {
          position,
          rotation: undefined,
          scale: undefined,
          animation,
        }),
      )

      // Position is suppressed, should not be synced
      expect(entity.updateTransform).not.toHaveBeenCalled()
    })

    test('resyncs position when animation ends (isAnimating true → false) and entity has position prop', () => {
      const entity = createMockEntity()
      const position = { x: 0, y: 0.5, z: 0 }

      const animState = {
        animating: true,
        suppressedFields: ['position'] as 'position'[] | null,
      }
      const animation = {
        __animationObjectId: 'anim-1',
        __animatedFields: ['position'] as const,
        get __animating() {
          return animState.animating
        },
        __bind: vi.fn(),
        __unbind: vi.fn(),
        __getSuppressedFields: () => animState.suppressedFields,
      } as any as AnimatedProps

      const { rerender } = renderHook(
        props => useEntityTransform(entity, props),
        {
          initialProps: {
            position,
            rotation: undefined,
            scale: undefined,
            animation,
          },
        },
      )

      // During animation: position suppressed, not synced
      expect(entity.updateTransform).not.toHaveBeenCalled()

      // Simulate animation ending
      animState.animating = false
      animState.suppressedFields = null

      entity.updateTransform.mockClear()

      // Re-render (triggered by bumpSyncVersion in useAnimation)
      rerender({
        position,
        rotation: undefined,
        scale: undefined,
        animation,
      })

      // Position should be re-synced back to React-declared value
      expect(entity.updateTransform).toHaveBeenCalledWith({ position })
    })

    test('does NOT resync when entity has no position prop (stays at animation to)', () => {
      const entity = createMockEntity()

      const animState = {
        animating: true,
        suppressedFields: ['position'] as 'position'[] | null,
      }
      const animation = {
        __animationObjectId: 'anim-1',
        __animatedFields: ['position'] as const,
        get __animating() {
          return animState.animating
        },
        __bind: vi.fn(),
        __unbind: vi.fn(),
        __getSuppressedFields: () => animState.suppressedFields,
      } as any as AnimatedProps

      const { rerender } = renderHook(
        props => useEntityTransform(entity, props),
        {
          initialProps: {
            position: undefined,
            rotation: undefined,
            scale: undefined,
            animation,
          },
        },
      )

      expect(entity.updateTransform).not.toHaveBeenCalled()

      // Simulate animation ending
      animState.animating = false
      animState.suppressedFields = null

      entity.updateTransform.mockClear()

      // Re-render — position is undefined, should NOT sync
      rerender({
        position: undefined,
        rotation: undefined,
        scale: undefined,
        animation,
      })

      expect(entity.updateTransform).not.toHaveBeenCalled()
    })

    test('resyncs multiple fields (position + rotation) after animation ends', () => {
      const entity = createMockEntity()
      const position = { x: 0, y: 0.5, z: 0 }
      const rotation = { x: 0, y: 45, z: 0 }

      const animState = {
        animating: true,
        suppressedFields: ['position', 'rotation'] as
          | ('position' | 'rotation')[]
          | null,
      }
      const animation = {
        __animationObjectId: 'anim-1',
        __animatedFields: ['position', 'rotation'] as const,
        get __animating() {
          return animState.animating
        },
        __bind: vi.fn(),
        __unbind: vi.fn(),
        __getSuppressedFields: () => animState.suppressedFields,
      } as any as AnimatedProps

      const { rerender } = renderHook(
        props => useEntityTransform(entity, props),
        {
          initialProps: { position, rotation, scale: undefined, animation },
        },
      )

      expect(entity.updateTransform).not.toHaveBeenCalled()

      // Animation ends
      animState.animating = false
      animState.suppressedFields = null

      entity.updateTransform.mockClear()

      rerender({ position, rotation, scale: undefined, animation })

      expect(entity.updateTransform).toHaveBeenCalledWith({
        position,
        rotation,
      })
    })

    test('non-animated fields still sync during animation', () => {
      const entity = createMockEntity()
      const position = { x: 0, y: 0.5, z: 0 }
      const animation = createMockAnimation({
        animating: true,
        suppressedFields: ['position'],
      })

      const { rerender } = renderHook(
        props => useEntityTransform(entity, props),
        {
          initialProps: {
            position,
            rotation: undefined,
            scale: { x: 1, y: 1, z: 1 },
            animation,
          },
        },
      )

      // scale is not suppressed, first render syncs it
      expect(entity.updateTransform).toHaveBeenCalledWith({
        scale: { x: 1, y: 1, z: 1 },
      })

      entity.updateTransform.mockClear()

      // Update scale during animation — should sync
      const newScale = { x: 2, y: 2, z: 2 }
      rerender({
        position,
        rotation: undefined,
        scale: newScale,
        animation,
      })

      expect(entity.updateTransform).toHaveBeenCalledWith({ scale: newScale })
    })
  })
})
