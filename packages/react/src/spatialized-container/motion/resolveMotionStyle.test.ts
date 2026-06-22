import { describe, expect, test } from 'vitest'
import { resolveMotionStyle } from './resolveMotionStyle'

describe('resolveMotionStyle', () => {
  test('returns empty style for static3d and dynamic3d targets', () => {
    const values = {
      opacity: 0.5,
      transform: { translate: { x: 12 } },
    }

    expect(
      resolveMotionStyle({
        values,
        targetKind: 'static3d',
        suppressedFields: null,
        nativeElementSupported: true,
        terminalOpacityOwner: null,
        terminalTransformOwner: null,
      }),
    ).toEqual({})

    expect(
      resolveMotionStyle({
        values,
        targetKind: 'dynamic3d',
        suppressedFields: null,
        nativeElementSupported: true,
        terminalOpacityOwner: null,
        terminalTransformOwner: null,
      }),
    ).toEqual({})
  })

  test('masks native-owned spatialized2d fields when suppressed', () => {
    const style = resolveMotionStyle({
      values: {
        opacity: 0.5,
        transform: { translate: { x: 12 } },
      },
      targetKind: 'spatialized2d',
      suppressedFields: new Set(['opacity', 'transform']),
      nativeElementSupported: true,
      terminalOpacityOwner: null,
      terminalTransformOwner: null,
    })

    expect(style.opacity).toBeUndefined()
    expect(style.transform).toBeUndefined()
  })

  test('falls back to web style mapping when native masking is inactive', () => {
    const style = resolveMotionStyle({
      values: {
        opacity: 0.5,
        transform: { translate: { x: 12, y: 4, z: 0 } },
      },
      targetKind: 'spatialized2d',
      suppressedFields: null,
      nativeElementSupported: false,
      terminalOpacityOwner: null,
      terminalTransformOwner: null,
    })

    expect(style.opacity).toBe(0.5)
    expect(String(style.transform)).toContain('translate3d(12px, 4px, 0px)')
  })

  test('restores explicit authored transform after native suppression releases', () => {
    const style = resolveMotionStyle({
      values: {
        transform: { translate: { x: 50, y: 0, z: 0 } },
      },
      targetKind: 'spatialized2d',
      suppressedFields: null,
      nativeElementSupported: true,
      explicitStyleTransform: 'translate3d(12px, 0px, 0px)',
      terminalOpacityOwner: null,
      terminalTransformOwner: 'authored',
    })

    expect(style.transform).toBe('translate3d(12px, 0px, 0px)')
  })

  test('keeps native terminal transform authoritative after suppression releases', () => {
    const style = resolveMotionStyle({
      values: {
        transform: { translate: { x: 50, y: 0, z: 0 } },
      },
      targetKind: 'spatialized2d',
      suppressedFields: null,
      nativeElementSupported: true,
      terminalOpacityOwner: null,
      terminalTransformOwner: 'native',
    })

    expect(style.transform).toBeUndefined()
  })
})
