import { useEffect, useState } from 'react'
import { SpatializedContainerObject } from '../context/SpatializedContainerContext'
import { PortalInstanceObject } from '../context/PortalInstanceContext'

function useForceUpdate() {
  const [, setToggle] = useState(false)
  return () => setToggle(toggle => !toggle)
}

export function useSync2DFrame(
  spatialId: string,
  portalInstanceObject: PortalInstanceObject,
  spatializedContainerObject: SpatializedContainerObject,
) {
  const forceUpdate = useForceUpdate()

  useEffect(() => {
    spatializedContainerObject.on2DFrameChange(spatialId, () => {
      portalInstanceObject.notify2DFrameChange()
      forceUpdate()
    })

    return () => {
      spatializedContainerObject.off2DFrameChange(spatialId)
    }
  }, [])
}
