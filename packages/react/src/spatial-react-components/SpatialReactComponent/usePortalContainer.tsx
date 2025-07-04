import { useContext, useRef, useEffect } from 'react'
import { SpatialIsStandardInstanceContext } from './SpatialIsStandardInstanceContext'
import { getSession } from '../../utils/getSession'
import { SpatialWindowManager } from './SpatialWindowManager'
import { SpatialWindowManagerContext } from './SpatialWindowManagerContext'
import { useForceUpdate } from '../hooks/useForceUpdate'

type PortalContainerOption = {
  inSpatialPortalContext?: boolean

  onContainerSpawned: (
    spatialWindowManager: SpatialWindowManager,
  ) => Promise<any>
  onContainerDestroyed: (
    spatialWindowManager: SpatialWindowManager,
    spawnedResult: any,
  ) => void
}

export function usePortalContainer(options: PortalContainerOption) {
  const isStandard = useContext(SpatialIsStandardInstanceContext) // Spatial components render both a standard (hidden) and spatial instance (displayed), this prop lets us know which context we are in
  const parentSpatialWindowManager = useContext(SpatialWindowManagerContext)

  const forceUpdate = useForceUpdate()

  const spatialWindowManagerRef = useRef<SpatialWindowManager>()

  useEffect(() => {
    let isDestroyed = false
    let spawnedResult: any

    async function asyncCreatePortalContainer() {
      const session = getSession()!
      // session?.log("TREVORX " + props.debugName + " " + (parentSpatialReactComponent !== null ? "hasParent" : "NoParent"))

      // Create spatial window
      let windowMgr = new SpatialWindowManager({
        // if inSpatialPortalContext is true, then the new entity should be created in the root
        // don't support createPortal in another spatialdiv
        parentSpatialWindowManager: options.inSpatialPortalContext
          ? undefined
          : parentSpatialWindowManager || undefined,
      })
      await windowMgr.initFromWidow()

      if (isDestroyed) {
        windowMgr.destroy()
        return
      }

      spawnedResult = await options.onContainerSpawned(windowMgr)
      if (isDestroyed) {
        options.onContainerDestroyed(windowMgr, spawnedResult)
        windowMgr.destroy()
        return
      }

      spatialWindowManagerRef.current = windowMgr
      forceUpdate()
    }

    if (isStandard !== true) {
      asyncCreatePortalContainer()
    }

    return () => {
      isDestroyed = true
      const spatialWindowManager = spatialWindowManagerRef.current

      if (spatialWindowManager) {
        options.onContainerDestroyed(spatialWindowManager, spawnedResult)
        spatialWindowManager.destroy()
      }
    }
  }, [])

  return [spatialWindowManagerRef.current]
}
