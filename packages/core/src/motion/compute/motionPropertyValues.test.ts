import { describe, expect, test } from 'vitest'
import type { SpatializedMotionProperty } from '../../types/motion/spatializedMotion'
import { setMotionPropertyValue } from './motionPropertyValues'

describe('setMotionPropertyValue', () => {
  test('writes opacity', () => {
    const values = {}

    setMotionPropertyValue(values, 'opacity', 0.5)

    expect(values).toEqual({ opacity: 0.5 })
  })

  test.each([
    ['transform.translate.x', { transform: { translate: { x: 1 } } }],
    ['transform.translate.y', { transform: { translate: { y: 2 } } }],
    ['transform.translate.z', { transform: { translate: { z: 3 } } }],
    ['transform.rotate.x', { transform: { rotate: { x: 4 } } }],
    ['transform.rotate.y', { transform: { rotate: { y: 5 } } }],
    ['transform.rotate.z', { transform: { rotate: { z: 6 } } }],
    ['transform.scale.x', { transform: { scale: { x: 7 } } }],
    ['transform.scale.y', { transform: { scale: { y: 8 } } }],
    ['transform.scale.z', { transform: { scale: { z: 9 } } }],
  ] as const)('writes %s', (motionProperty, expected) => {
    const values = {}
    const sampledValue = Object.values(
      Object.values(expected.transform ?? {})[0] ?? {},
    )[0] as number

    setMotionPropertyValue(
      values,
      motionProperty as SpatializedMotionProperty,
      sampledValue,
    )

    expect(values).toEqual(expected)
  })

  test('preserves existing transform groups while writing another property', () => {
    const values = {
      transform: {
        translate: { x: 10 },
      },
    }

    setMotionPropertyValue(values, 'transform.rotate.y', 20)

    expect(values).toEqual({
      transform: {
        translate: { x: 10 },
        rotate: { y: 20 },
      },
    })
  })
})
