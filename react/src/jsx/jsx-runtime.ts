import { spatialPolyfill } from './spatialPolyfill'

spatialPolyfill()

export { Fragment } from 'react/jsx-runtime'
export { jsx, jsxs } from './jsx-shared'

export type { WebSpatialJSX as JSX } from './jsx-namespace'
