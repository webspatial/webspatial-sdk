import { describe, expect, test } from 'vitest'
import { parseSpatialDivAnimatedValues } from './parseSpatialDivAnimatedValues'

describe('parseSpatialDivAnimatedValues', () => {
  test('parses pause payload with nested transform', () => {
    const values = parseSpatialDivAnimatedValues({
      type: 'paused',
      values: {
        opacity: 0.25,
        transform: {
          translate: { x: 30, y: 0, z: 0 },
          rotate: { y: 15 },
        },
      },
    })
    expect(values.opacity).toBe(0.25)
    expect(values.transform?.translate?.x).toBe(30)
    expect(values.transform?.rotate?.y).toBe(15)
  })
})
