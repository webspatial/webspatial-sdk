import { describe, expect, test } from 'vitest'
import { resolveMotionStyle } from './resolveMotionStyle'

describe('resolveMotionStyle', () => {
  test('maps values to style', () => {
    const values = {
      opacity: 0.5,
      transform: { translate: { x: 12 } },
    }

    expect(resolveMotionStyle({ values })).toEqual({
      opacity: 0.5,
      transform: 'translate3d(12px, 0px, 0px)',
    })

    expect(resolveMotionStyle({ values })).toEqual({
      opacity: 0.5,
      transform: 'translate3d(12px, 0px, 0px)',
    })

    expect(resolveMotionStyle({ values })).toEqual({
      opacity: 0.5,
      transform: 'translate3d(12px, 0px, 0px)',
    })
  })

  test('maps values directly before target resolution', () => {
    const style = resolveMotionStyle({
      values: {
        transform: { translate: { x: 50, y: 0, z: 0 } },
      },
    })

    expect(String(style.transform)).toContain('translate3d(50px, 0px, 0px)')
  })
})
