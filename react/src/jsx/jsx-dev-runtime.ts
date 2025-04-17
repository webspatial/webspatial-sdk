import { spatialPolyfill } from '../polyfill'
import { injectVersionInfo } from '../version'

spatialPolyfill()

export { Fragment } from 'react/jsx-runtime'
export { jsxDEV, jsx } from './jsx-shared'

export type { WebSpatialJSX as JSX } from './jsx-namespace'
export * from './xr-css-extension'

injectVersionInfo('avp')
