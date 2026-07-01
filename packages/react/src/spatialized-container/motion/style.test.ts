import { describe, expect, test } from 'vitest'
import { valuesToMotionStyle } from './style'

describe('valuesToMotionStyle', () => {
  test('keeps simple transform output readable for single-axis motion', () => {
    const style = valuesToMotionStyle({
      transform: {
        translate: { x: 12 },
        rotate: { x: 30 },
      },
    })

    expect(style.transform).toBe('translate3d(12px, 0px, 0px) rotateX(30deg)')
  })

  test('orders multi-axis rotation so style replay matches native composition', () => {
    const style = valuesToMotionStyle({
      transform: {
        translate: { y: 12 },
        rotate: { x: 20, z: 80 },
        scale: { x: 2 },
      },
    })

    expect(style.transform).toBe(
      'translate3d(0px, 12px, 0px) rotateZ(80deg) rotateX(20deg) scaleX(2)',
    )
  })
})
