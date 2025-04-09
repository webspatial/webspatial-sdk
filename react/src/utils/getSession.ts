import { Spatial, SpatialSession } from '@webspatial/core-sdk'
// Create the default Spatial session for the app
let spatial: Spatial | null = null
let _currentSession: SpatialSession | null = null
/** @hidden */
export function getSession() {
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
