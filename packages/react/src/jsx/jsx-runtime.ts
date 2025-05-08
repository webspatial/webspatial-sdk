import { spatialPolyfill } from '../polyfill'

spatialPolyfill()

export { Fragment } from 'react/jsx-runtime'
export { jsx, jsxs } from './jsx-shared'

export type { WebSpatialJSX as JSX } from './jsx-namespace'
export * from './xr-css-extension'
