import { describe, expect, test } from 'vitest'
import { composeSRT, decomposeTransformMatrix } from './utils'

function approxEqual(a: number, b: number, eps = 1e-6) {
  return Math.abs(a - b) < eps
}

describe('composeSRT / decomposeTransformMatrix round-trip', () => {
  test('identity transform round-trips', () => {
    const pos = { x: 0, y: 0, z: 0 }
    const rot = { x: 0, y: 0, z: 0 }
    const scl = { x: 1, y: 1, z: 1 }

    const matrix = composeSRT(pos, rot, scl)
    const arr = Array.from(matrix.toFloat64Array())
    const result = decomposeTransformMatrix(arr)

    expect(approxEqual(result.position!.x, 0)).toBe(true)
    expect(approxEqual(result.position!.y, 0)).toBe(true)
    expect(approxEqual(result.position!.z, 0)).toBe(true)
    expect(approxEqual(result.scale!.x, 1)).toBe(true)
    expect(approxEqual(result.scale!.y, 1)).toBe(true)
    expect(approxEqual(result.scale!.z, 1)).toBe(true)
    expect(approxEqual(result.rotation!.x, 0)).toBe(true)
    expect(approxEqual(result.rotation!.y, 0)).toBe(true)
    expect(approxEqual(result.rotation!.z, 0)).toBe(true)
  })

  test('translation-only round-trips', () => {
    const pos = { x: 3, y: -5, z: 10 }
    const rot = { x: 0, y: 0, z: 0 }
    const scl = { x: 1, y: 1, z: 1 }

    const matrix = composeSRT(pos, rot, scl)
    const arr = Array.from(matrix.toFloat64Array())
    const result = decomposeTransformMatrix(arr)

    expect(approxEqual(result.position!.x, 3)).toBe(true)
    expect(approxEqual(result.position!.y, -5)).toBe(true)
    expect(approxEqual(result.position!.z, 10)).toBe(true)
  })

  test('scale-only round-trips', () => {
    const pos = { x: 0, y: 0, z: 0 }
    const rot = { x: 0, y: 0, z: 0 }
    const scl = { x: 2, y: 0.5, z: 3 }

    const matrix = composeSRT(pos, rot, scl)
    const arr = Array.from(matrix.toFloat64Array())
    const result = decomposeTransformMatrix(arr)

    expect(approxEqual(result.scale!.x, 2)).toBe(true)
    expect(approxEqual(result.scale!.y, 0.5)).toBe(true)
    expect(approxEqual(result.scale!.z, 3)).toBe(true)
  })

  test('rotation-only round-trips (45 deg Y)', () => {
    const pos = { x: 0, y: 0, z: 0 }
    const rot = { x: 0, y: 45, z: 0 }
    const scl = { x: 1, y: 1, z: 1 }

    const matrix = composeSRT(pos, rot, scl)
    const arr = Array.from(matrix.toFloat64Array())
    const result = decomposeTransformMatrix(arr)

    expect(approxEqual(result.rotation!.x, 0)).toBe(true)
    expect(approxEqual(result.rotation!.y, 45)).toBe(true)
    expect(approxEqual(result.rotation!.z, 0)).toBe(true)
  })

  test('combined SRT round-trips', () => {
    const pos = { x: 1, y: 2, z: 3 }
    const rot = { x: 30, y: 45, z: 60 }
    const scl = { x: 2, y: 3, z: 0.5 }

    const matrix = composeSRT(pos, rot, scl)
    const arr = Array.from(matrix.toFloat64Array())
    const result = decomposeTransformMatrix(arr)

    expect(approxEqual(result.position!.x, 1)).toBe(true)
    expect(approxEqual(result.position!.y, 2)).toBe(true)
    expect(approxEqual(result.position!.z, 3)).toBe(true)
    expect(approxEqual(result.scale!.x, 2, 1e-4)).toBe(true)
    expect(approxEqual(result.scale!.y, 3, 1e-4)).toBe(true)
    expect(approxEqual(result.scale!.z, 0.5, 1e-4)).toBe(true)
    expect(approxEqual(result.rotation!.x, 30, 0.1)).toBe(true)
    expect(approxEqual(result.rotation!.y, 45, 0.1)).toBe(true)
    expect(approxEqual(result.rotation!.z, 60, 0.1)).toBe(true)
  })
})
