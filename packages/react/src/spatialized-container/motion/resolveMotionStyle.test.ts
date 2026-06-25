import { describe, expect, test } from 'vitest'
import { resolveMotionStyle } from './resolveMotionStyle'

describe('resolveMotionStyle', () => {
  test('returns empty style for native-backed targets', () => {
    const values = {
      opacity: 0.5,
      transform: { translate: { x: 12 } },
    }

    expect(
      resolveMotionStyle({
        values,
        targetKind: 'spatialized2d',
        nativeElementSupported: true,
      }),
    ).toEqual({})

    expect(
      resolveMotionStyle({
        values,
        targetKind: 'static3d',
        nativeElementSupported: true,
      }),
    ).toEqual({})

    expect(
      resolveMotionStyle({
        values,
        targetKind: 'dynamic3d',
        nativeElementSupported: true,
      }),
    ).toEqual({})
  })

  test('falls back to web style mapping for non-native rendering', () => {
    const style = resolveMotionStyle({
      values: {
        opacity: 0.5,
        transform: { translate: { x: 12, y: 4, z: 0 } },
      },
      targetKind: 'spatialized2d',
      nativeElementSupported: false,
    })

    expect(style.opacity).toBe(0.5)
    expect(String(style.transform)).toContain('translate3d(12px, 4px, 0px)')
  })

  test('maps values directly before target resolution', () => {
    const style = resolveMotionStyle({
      values: {
        transform: { translate: { x: 50, y: 0, z: 0 } },
      },
      targetKind: null,
      nativeElementSupported: true,
    })

    expect(String(style.transform)).toContain('translate3d(50px, 0px, 0px)')
  })
})
