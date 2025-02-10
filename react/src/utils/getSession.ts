import { Spatial, SpatialSession } from '@xrsdk/runtime'

// Create the default Spatial session for the app
let spatial = new Spatial()
let _currentSession = null as SpatialSession | null
/** @hidden */
export function getSession() {
  if (__WEB__) return null
  if (!spatial.isSupported()) {
    return null
  }
  if (_currentSession) {
    return _currentSession
  }
  _currentSession = spatial.requestSession()

  return _currentSession
}

// console.log('__WEB__:', __WEB__)

export { spatial }
