import { useContext, useRef, useState, useEffect } from 'react'
import { SpatialIsStandardInstanceContext } from './SpatialIsStandardInstanceContext'
import { getSession } from '../../utils/getSession'
import { SpatialWindowManager } from './SpatialWindowManager'
import { SpatialWindowManagerContext } from './SpatialWindowManagerContext'

type PortalContainerOption = {
    onContainerSpawned: (spatialWindowManager: SpatialWindowManager) => Promise<any>,
    onContainerDestroyed: (spatialWindowManager: SpatialWindowManager, spawnedResult: any) => void
}

export function usePortalContainer(options: PortalContainerOption) {
    const isStandard = useContext(SpatialIsStandardInstanceContext) // Spatial components render both a standard (hidden) and spatial instance (displayed), this prop lets us know which context we are in
    const parentSpatialWindowManager = useContext(SpatialWindowManagerContext);

    const spawnedResultRef = useRef<any>();

    const [spatialWindowManager, setSpatialWindowManager] = useState<SpatialWindowManager | null>(null)

    useEffect(() => {
        let isDestroyed = false;

        async function asyncCreatePortalContainer () {
            const session = getSession()!;
            // session?.log("TREVORX " + props.debugName + " " + (parentSpatialReactComponent !== null ? "hasParent" : "NoParent"))
            
            // Create spatial window
            let windowMgr = new SpatialWindowManager();
            await windowMgr.initFromWidow(parentSpatialWindowManager)

            if (isDestroyed) {
                windowMgr.destroy()
                return;
            }

            spawnedResultRef.current = await options.onContainerSpawned(windowMgr);
            if (isDestroyed) {
                options.onContainerDestroyed(windowMgr, spawnedResultRef.current)
                windowMgr.destroy()
                spawnedResultRef.current = undefined
                return;
            }

            setSpatialWindowManager(windowMgr);
        }

        if (isStandard !== true) {
            asyncCreatePortalContainer();
        } 

        return () => {
            isDestroyed = true;

            if (spatialWindowManager) {
                options.onContainerDestroyed(spatialWindowManager, spawnedResultRef.current)
                spatialWindowManager.destroy()
            }
        }
    }, []);

    return [spatialWindowManager];
}
