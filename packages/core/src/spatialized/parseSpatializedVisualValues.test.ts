import { describe, expect, test } from 'vitest'
import { parseSpatializedVisualValues } from './parseSpatializedVisualValues'

describe('parseSpatializedVisualValues', () => {
  test('parses nested values payload', () => {
    const values = parseSpatializedVisualValues({
      values: {
        opacity: 0.5,
        transform: { translate: { x: 1, y: 2, z: 3 } },
      },
    })
    expect(values.opacity).toBe(0.5)
    expect(values.transform?.translate).toEqual({ x: 1, y: 2, z: 3 })
  })
})
