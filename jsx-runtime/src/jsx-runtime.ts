'use strict'

import reactJSXRuntime from 'react/jsx-runtime'
import { withCSSSpatial } from '@webspatial/react-sdk'
import { spatialPolyfill } from './spatialPolyfill'

const attributeFlag = 'enable-xr'
const styleFlag = 'enableXr'
const classFlag = '__enableXr__'

function replaceToSpatialPrimitiveType(
  type: React.ElementType,
  props: unknown,
) {
  const propsObject = props as Record<string, any>
  if (attributeFlag in propsObject) {
    delete propsObject[attributeFlag]
    return withCSSSpatial(type)
  }

  if (propsObject && propsObject.style && styleFlag in propsObject.style) {
    delete propsObject.style[styleFlag]
    return withCSSSpatial(type)
  }

  if (propsObject && propsObject.className) {
    const originalClassNames = propsObject.className.split(' ')
    const idx = originalClassNames.indexOf(classFlag)
    if (idx !== -1) {
      originalClassNames.splice(idx, 1)
      propsObject.className = originalClassNames.join(' ')
      return withCSSSpatial(type)
    }
  }

  return type
}

function jsxs(type: React.ElementType, props: unknown, key?: React.Key) {
  type = replaceToSpatialPrimitiveType(type, props)
  return reactJSXRuntime.jsxs(type, props, key)
}

function jsx(type: React.ElementType, props: unknown, key?: React.Key) {
  type = replaceToSpatialPrimitiveType(type, props)
  return reactJSXRuntime.jsx(type, props, key)
}

spatialPolyfill()

module.exports = {
  jsxs: jsxs,
  jsx: jsx,
  Fragment: reactJSXRuntime.Fragment,
}
