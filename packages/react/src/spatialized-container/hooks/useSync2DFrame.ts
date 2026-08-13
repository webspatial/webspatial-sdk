import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import type { SpatializedElement } from '@webspatial/core-sdk'
import { scheduleSyncParentHeadToChild } from '../../utils/windowStyleSync'
import { SpatializedContainerObject } from '../context/SpatializedContainerContext'
import { PortalInstanceObject } from '../context/PortalInstanceContext'

function useForceUpdate() {
  const [, setToggle] = useState(false)
  return useCallback(() => setToggle(toggle => !toggle), [])
}

function getChildWindow(spatializedElement?: SpatializedElement) {
  return (
    spatializedElement as SpatializedElement & {
      windowProxy?: WindowProxy
    }
  )?.windowProxy
}

export function useSync2DFrame(
  spatialId: string,
  portalInstanceObject: PortalInstanceObject,
  spatializedContainerObject: SpatializedContainerObject,
  spatializedElement?: SpatializedElement,
) {
  const forceUpdate = useForceUpdate()
  const childWindow = getChildWindow(spatializedElement)

  const sync = useCallback(() => {
    portalInstanceObject.notify2DFrameChange()
    if (childWindow) {
      scheduleSyncParentHeadToChild(childWindow, 'afterHostLayout', () => {
        forceUpdate()
      })
      return
    }
    forceUpdate()
  }, [portalInstanceObject, childWindow, forceUpdate])

  useEffect(() => {
    spatializedContainerObject.on2DFrameChange(spatialId, sync)
    sync()

    return () => {
      spatializedContainerObject.off2DFrameChange(spatialId)
    }
  }, [spatialId, portalInstanceObject, spatializedContainerObject, sync])

  useLayoutEffect(() => {
    if (!spatializedElement) return
    portalInstanceObject.notify2DFrameChange()
    if (childWindow) {
      scheduleSyncParentHeadToChild(childWindow, 'afterHostLayout', () => {
        forceUpdate()
      })
      return
    }
    forceUpdate()
  }, [spatializedElement, childWindow, portalInstanceObject, forceUpdate])
}
