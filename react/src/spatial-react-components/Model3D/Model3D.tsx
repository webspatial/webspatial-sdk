import { forwardRef, useContext, useMemo } from 'react'
import { Model3DProps, ModelElementRef } from './types'
import { SpatialLayerContext } from '../SpatialReactComponent/SpatialLayerContext'
import { SpatialReactContext } from '../SpatialReactComponent/SpatialReactContext'
import { renderModel3DNotInSpatialDiv } from './Model3DNotInSpatialDiv'
import { renderModel3DStandardInstance } from './Model3DStandardInstance'
import { renderModel3DPortalInstance } from './Model3DPortalInstance'
import { SpatialIsStandardInstanceContext } from '../SpatialReactComponent/SpatialIsStandardInstanceContext'

function Model3DBase(props: Model3DProps, refIn: ModelElementRef) {
  const parentSpatialReactContextObject = useContext(SpatialReactContext)
  const isInSpatialDiv = !!parentSpatialReactContextObject

  if (isInSpatialDiv) {
    const layer = useContext(SpatialLayerContext) + 1
    const isInStandardInstance = !!useContext(SpatialIsStandardInstanceContext)
    const spatialId = useMemo(() => {
      return parentSpatialReactContextObject.getSpatialID(
        layer,
        isInStandardInstance,
        'Model3D',
      )
    }, [])
    if (isInStandardInstance) {
      return renderModel3DStandardInstance(spatialId, props, refIn)
    } else {
      return renderModel3DPortalInstance(spatialId, props)
    }
  } else {
    return renderModel3DNotInSpatialDiv(props, refIn)
  }
}

export const Model3D = forwardRef(Model3DBase)

Model3D.displayName = 'Model3D'
