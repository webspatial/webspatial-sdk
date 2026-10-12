import { describe, expect, test, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEntityTransform } from './useEntityTransform'

function createMockEntity() {
  return {
    id: 'entity-1',
    updateTransform: vi.fn(async () => undefined),
  } as any
}

describe('useEntityTransform', () => {
  test('syncs React position without animation suppression', () => {
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

  test('syncs all changed React transform fields together', () => {
    const entity = createMockEntity()
    const position = { x: 1, y: 2, z: 3 }
    const rotation = { x: 4, y: 5, z: 6 }
    const scale = { x: 2, y: 2, z: 2 }

    renderHook(() => useEntityTransform(entity, { position, rotation, scale }))

    expect(entity.updateTransform).toHaveBeenCalledWith({
      position,
      rotation,
      scale,
    })
  })

  test('does not rewrite unchanged React transform values', () => {
    const entity = createMockEntity()
    const position = { x: 1, y: 2, z: 3 }
    const { rerender } = renderHook(
      props => useEntityTransform(entity, props),
      {
        initialProps: {
          position,
          rotation: undefined,
          scale: undefined,
        },
      },
    )
    entity.updateTransform.mockClear()

    rerender({ position, rotation: undefined, scale: undefined })

    expect(entity.updateTransform).not.toHaveBeenCalled()
  })

  test('rewrites declared React transform values when sync revision changes', () => {
    const entity = createMockEntity()
    const position = { x: 1, y: 2, z: 3 }
    const { rerender } = renderHook(
      ({ syncRevision }) =>
        useEntityTransform(
          entity,
          {
            position,
            rotation: undefined,
            scale: undefined,
          },
          syncRevision,
        ),
      { initialProps: { syncRevision: 0 } },
    )
    entity.updateTransform.mockClear()

    rerender({ syncRevision: 1 })

    expect(entity.updateTransform).toHaveBeenCalledWith({ position })
  })
})
