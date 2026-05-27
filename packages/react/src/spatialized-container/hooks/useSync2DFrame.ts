import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import type { SpatializedElement } from '@webspatial/core-sdk'
import { SpatializedContainerObject } from '../context/SpatializedContainerContext'
import { PortalInstanceObject } from '../context/PortalInstanceContext'

function useForceUpdate() {
  const [, setToggle] = useState(false)
  return useCallback(() => setToggle(toggle => !toggle), [])
}

export function useSync2DFrame(
  spatialId: string,
  portalInstanceObject: PortalInstanceObject,
  spatializedContainerObject: SpatializedContainerObject,
  spatializedElement?: SpatializedElement,
) {
  const forceUpdate = useForceUpdate()

  const sync = useCallback(() => {
    portalInstanceObject.notify2DFrameChange()
    forceUpdate()
  }, [portalInstanceObject, forceUpdate])

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
    forceUpdate()
  }, [spatializedElement, portalInstanceObject, forceUpdate])
}
