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
      }),
    ).toEqual({})

    expect(
      resolveMotionStyle({
        values,
        targetKind: 'dynamic3d',
        suppressedFields: null,
        nativeElementSupported: true,
        terminalOpacityOwner: null,
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
    })

    expect(style.opacity).toBe(0.5)
    expect(String(style.transform)).toContain('translate3d(12px, 4px, 0px)')
  })
})
