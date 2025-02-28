import { RectType } from '../types'

export function getInheritedStyleProps(
  computedStyle: CSSStyleDeclaration,
): any {
  //https://stackoverflow.com/questions/5612302/which-css-properties-are-inherited
  var propNames = [
    'azimuth',
    'borderCollapse',
    'borderSpacing',
    'captionSide',
    'color',
    'cursor',
    'direction',
    'elevation',
    'emptyCells',
    'fontFamily',
    'fontSize',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'font',
    'letterSpacing',
    'lineHeight',
    'listStyleImage',
    'listStylePosition',
    'listStyleType',
    'listStyle',
    'orphans',
    'pitchRange',
    'pitch',
    'quotes',
    'richness',
    'speakHeader',
    'speakNumeral',
    'speakPunctuation',
    'speak',
    'speechRate',
    'stress',
    'textAlign',
    'textIndent',
    'textTransform',
    'visibility',
    'voiceFamily',
    'volume',
    'whiteSpace',
    'widows',
    'wordSpacing',
    // background also need to be synced
    'background',

    // position also need to be synced
    'position',
  ]
  var props = {} as any
  for (var cssName of propNames) {
    if ((computedStyle as any)[cssName]) {
      props[cssName] = (computedStyle as any)[cssName]
    }
  }
  return props
}

export function domRect2rectType(from: DOMRect): RectType {
  return {
    x: from.x,
    y: from.y,
    width: from.width,
    height: from.height,
  }
}

export function parseTransformOrigin(computedStyle: CSSStyleDeclaration) {
  const transformOriginProperty =
    computedStyle.getPropertyValue('transform-origin')
  const [x, y] = transformOriginProperty.split(' ').map(parseFloat)
  const width = parseFloat(computedStyle.getPropertyValue('width'))
  const height = parseFloat(computedStyle.getPropertyValue('height'))

  return {
    x: width > 0 ? x / width : 0.5,
    y: height > 0 ? y / height : 0.5,
    z: 0.5,
  }
}

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
