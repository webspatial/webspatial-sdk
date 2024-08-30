
export * from './core' 
export * from './spatial-react-components'
export * from './utils'
export { WebSpatialHydrate } from './webSpatialHydrate'

// expose WebSpatialLogger for temp use, should be deleted later
import { WebSpatial } from './core/private/WebSpatial'
export const WebSpatialLogger = WebSpatial.logger
