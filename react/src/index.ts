import { injectVersionInfo } from './version'
injectVersionInfo()

export * from './spatial-react-components'
export * from './utils'
export * from './XRApp'
export * from './initScene'
export * from './polyfill'
export { getClientVersion } from './version'

export const version = __reactsdkversion__
