import { describe, expect, test } from 'vitest'
import { normalizeMotionConfig } from './normalize'

describe('normalizeMotionConfig', () => {
  test('normalizes mixed timeline entries into numeric tracks', () => {
    expect(
      normalizeMotionConfig({
        duration: 2,
        timeline: {
          from: { opacity: 0, transform: { translate: { x: 0 } } },
          '50%': { opacity: 0.5 },
          to: { opacity: 1, transform: { translate: { x: 10 } } },
        },
      }),
    ).toMatchObject({
      duration: 2,
      tracks: [
        {
          property: 'opacity',
          keyframes: [
            { at: 0, value: 0 },
            { at: 1, value: 0.5 },
            { at: 2, value: 1 },
          ],
        },
        {
          property: 'transform.translate.x',
          keyframes: [
            { at: 0, value: 0 },
            { at: 2, value: 10 },
          ],
        },
      ],
    })
  })

  test('uses only timeline values when top-level boundaries are present', () => {
    expect(
      normalizeMotionConfig({
        from: { opacity: 0.25 },
        to: { opacity: 0.75 },
        timeline: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }),
    ).toMatchObject({
      duration: 0.3,
      tracks: [
        {
          property: 'opacity',
          keyframes: [
            { at: 0, value: 0 },
            { at: 0.3, value: 1 },
          ],
        },
      ],
    })
  })

  test('preserves sparse property keyframe ranges', () => {
    expect(
      normalizeMotionConfig({
        duration: 2,
        timeline: {
          '0%': { transform: { rotate: { z: -20 } } },
          '50%': {
            opacity: 0,
            transform: { rotate: { z: 80 } },
          },
          '100%': { opacity: 1 },
        },
      }),
    ).toMatchObject({
      duration: 2,
      tracks: [
        {
          property: 'transform.rotate.z',
          keyframes: [
            { at: 0, value: -20 },
            { at: 1, value: 80 },
          ],
        },
        {
          property: 'opacity',
          keyframes: [
            { at: 1, value: 0 },
            { at: 2, value: 1 },
          ],
        },
      ],
    })
  })
})
