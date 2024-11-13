
export * from './core' 
export * from './spatial-react-components'
export * from './utils'

// expose WebSpatialLogger for temp use, should be deleted later
import { WebSpatial } from './core/private/WebSpatial'
export const WebSpatialLogger = WebSpatial.logger
