import { StandardSpatializedContainerProps } from './types'
import { use2DFrameDetector } from './hooks/use2DFrameDetector'
import { useContext, useEffect, useState } from 'react'
import { SpatializedContainerContext } from './context/SpatializedContainerContext'
import { SpatialID } from './SpatialID'

function useSpatialTransformVisibilityWatcher(spatialId: string) {
  const [transformExist, setTransformExist] = useState(false)

  const spatializedContainerObject = useContext(SpatializedContainerContext)!
  useEffect(() => {
    spatializedContainerObject.onSpatialTransformVisibilityChange(
      spatialId,
      spatialTransform => {
        setTransformExist(spatialTransform.transformExist)
      },
    )
    return () => {
      spatializedContainerObject.offSpatialTransformVisibilityChange(spatialId)
    }
  }, [spatialId, spatializedContainerObject])

  return transformExist
}

export function StandardSpatializedContainer(
  props: StandardSpatializedContainerProps,
) {
  const { component: Component, style: inStyle = {}, ...restProps } = props
  const ref = use2DFrameDetector()
  const transformExist = useSpatialTransformVisibilityWatcher(props[SpatialID])

  const extraStyle = {
    visibility: 'hidden',
    transition: 'none',
    transform: transformExist ? 'translateZ(0)' : 'none',
  }
  const style = { ...inStyle, ...extraStyle }

  return <Component ref={ref} style={style} {...restProps} />
}
