import { describe, expect, test } from 'vitest'
import { validateNormalizedMotionConfig } from './validate'

describe('validateNormalizedMotionConfig', () => {
  test('accepts a canonical track-based motion config', () => {
    expect(() =>
      validateNormalizedMotionConfig({
        duration: 1,
        tracks: [
          {
            property: 'transform.translate.x',
            keyframes: [
              { at: 0, value: 0 },
              { at: 1, value: 10 },
            ],
          },
        ],
      }),
    ).not.toThrow()
  })

  test('rejects opacity tracks for static3d targets', () => {
    expect(() =>
      validateNormalizedMotionConfig(
        {
          duration: 1,
          tracks: [
            {
              property: 'opacity',
              keyframes: [
                { at: 0, value: 0 },
                { at: 1, value: 1 },
              ],
            },
          ],
        },
        { targetKind: 'static3d' },
      ),
    ).toThrow(/static3d targets do not support opacity tracks/)
  })
})
