import { RectType } from '../types'

export function getInheritedStyleProps(from: HTMLElement): any {
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
  var styleObject = getComputedStyle(from)
  for (var cssName of propNames) {
    if ((styleObject as any)[cssName]) {
      props[cssName] = (styleObject as any)[cssName]
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
