import { Spatial, SpatialEntity, SpatialIFrameComponent, SpatialModelUIComponent, SpatialSession } from '../index';


// Create the default Spatial session for the app
let spatial = new Spatial()
let _currentSession = null as SpatialSession | null
/** @hidden */
export function getSessionAsync() {
    if (!spatial.isSupported()) {
        return null
    }
    if (_currentSession) {
        return _currentSession
    }
    _currentSession = spatial.requestSession()
    return _currentSession
}

export {spatial}