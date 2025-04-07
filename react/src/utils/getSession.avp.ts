import { Spatial, SpatialSession } from '@webspatial/core-sdk'
import { GetSessionShape } from './getSession'
// Create the default Spatial session for the app
let spatial: GetSessionShape['spatial'] = null
let _currentSession: SpatialSession | null = null
/** @hidden */
export const getSession: GetSessionShape['getSession'] = () => {
  if (!spatial) {
    spatial = new Spatial()
  }
  if (!spatial.isSupported()) {
    return null
  }
  if (_currentSession) {
    return _currentSession
  }
  _currentSession = spatial.requestSession()
  return _currentSession
}

export { spatial }
