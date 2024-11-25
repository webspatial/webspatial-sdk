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
    z: 0,
  }
}
