import { Spatial } from "../Spatial"
import { SpatialSession } from "../SpatialSession"

// Create the default Spatial session for the app
let spatial = new Spatial()
let _currentSession = null as SpatialSession | null
/** @hidden */
export function getSession() {
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