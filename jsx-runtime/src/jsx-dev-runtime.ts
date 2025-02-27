'use strict'

import { jsxDEV as _jsxDEV, JSXSource } from 'react/jsx-dev-runtime'
import { spatialPolyfill } from './spatialPolyfill'
import { replaceToSpatialPrimitiveType } from './jsx-runtime'

export function jsxDEV(
  type: React.ElementType,
  props: unknown,
  key: React.Key,
  isStatic: boolean,
  source?: JSXSource,
  self?: unknown,
) {
  type = replaceToSpatialPrimitiveType(type, props)
  return _jsxDEV(type, props, key, isStatic, source, self)
}

spatialPolyfill()

export { jsx } from './jsx-runtime'
export { Fragment } from 'react/jsx-runtime'
