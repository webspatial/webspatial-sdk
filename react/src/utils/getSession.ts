import { Spatial, SpatialSession } from '@xrsdk/runtime'

// Create the default Spatial session for the app
let spatial: Spatial | null = null
let _currentSession = null as SpatialSession | null
/** @hidden */
export function getSession() {
  if (__WEB__) return null
  else {
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
}

export { spatial }
