import { Vec3 } from './types/types'

function parseBorderRadius(borderProperty: string, width: number) {
  if (borderProperty === '') {
    return 0
  }
  if (borderProperty.endsWith('%')) {
    return (width * parseFloat(borderProperty)) / 100
  }
  return parseFloat(borderProperty)
}

export function parseCornerRadius(computedStyle: CSSStyleDeclaration) {
  const width = parseFloat(computedStyle.getPropertyValue('width'))

  const topLeftPropertyValue = computedStyle.getPropertyValue(
    'border-top-left-radius',
  )
  const topRightPropertyValue = computedStyle.getPropertyValue(
    'border-top-right-radius',
  )
  const bottomLeftPropertyValue = computedStyle.getPropertyValue(
    'border-bottom-left-radius',
  )
  const bottomRightPropertyValue = computedStyle.getPropertyValue(
    'border-bottom-right-radius',
  )

  const cornerRadius = {
    topLeading: parseBorderRadius(topLeftPropertyValue, width),
    bottomLeading: parseBorderRadius(bottomLeftPropertyValue, width),
    topTrailing: parseBorderRadius(topRightPropertyValue, width),
    bottomTrailing: parseBorderRadius(bottomRightPropertyValue, width),
  }

  return cornerRadius
}

/**
 *
 * compose SRT matrix
 * @export
 * @param {Vec3} position meter
 * @param {Vec3} rotation degree
 * @param {Vec3} scale
 * @return {*}  {DOMMatrix}
 */
export function composeSRT(position: Vec3, rotation: Vec3, scale: Vec3) {
  const { x: px, y: py, z: pz } = position
  const { x: rx, y: ry, z: rz } = rotation
  const { x: sx, y: sy, z: sz } = scale

  let m = new DOMMatrix()
  m = m.scale(sx, sy, sz)
  m = m.rotate(rx, ry, rz)
  m = m.translate(px, py, pz)

  return m
}
