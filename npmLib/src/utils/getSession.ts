import { Spatial, SpatialSession } from "../core"

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
    _currentSession = spatial.requestSession();

    
    
    return _currentSession
}

(window as any).getSession = getSession;

    (window as any).getStat = async () => {
        const statsInfo = await getSession()!.getStats();
         
        return statsInfo
    };
 

    (window as any).inspectRootWindowGroup = async () => {
        const rootWindowGroupInfo = await getSession()!.inspectRootWindowGroup();
        console.log(rootWindowGroupInfo)
        return rootWindowGroupInfo
    };

export { spatial }