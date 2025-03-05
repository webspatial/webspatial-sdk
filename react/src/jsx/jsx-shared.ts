import { jsxDEV as _jsxDEV, JSXSource } from 'react/jsx-dev-runtime'
import reactJSXRuntime from 'react/jsx-runtime'
import { withCSSSpatial } from '../spatial-react-components'
// import { withCSSSpatial } from '@webspatial/react-sdk'
const attributeFlag = 'enable-xr'
const styleFlag = 'enableXr'
const classFlag = '__enableXr__'

export function replaceToSpatialPrimitiveType(
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

export function jsxs(type: React.ElementType, props: unknown, key?: React.Key) {
  type = replaceToSpatialPrimitiveType(type, props)
  return reactJSXRuntime.jsxs(type, props, key)
}

export function jsx(type: React.ElementType, props: unknown, key?: React.Key) {
  type = replaceToSpatialPrimitiveType(type, props)
  return reactJSXRuntime.jsx(type, props, key)
}

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
