import { forwardRef, useContext, useMemo } from 'react'
import { CSSModel3DProps, ModelElementRef } from './types'
import { SpatialReactContext } from '../SpatialReactComponent/SpatialReactContext'
import { SpatialLayerContext } from '../SpatialReactComponent/SpatialLayerContext'
import { SpatialIsStandardInstanceContext } from '../SpatialReactComponent/SpatialIsStandardInstanceContext'
import { renderCSSModel3DNotInSpatialDiv } from './CSSModel3DNotInSpatialDiv'
import { renderCSSModel3DStandardInstance } from './CSSModel3DStandardInstance'
import { renderCSSModel3DPortalInstance } from './CSSModel3DPortalInstance'

export function CSSModel3DBase(props: CSSModel3DProps, refIn: ModelElementRef) {
  const rootSpatialReactContextObject = useContext(SpatialReactContext)
  const isInSpatialDiv = !!rootSpatialReactContextObject

  if (isInSpatialDiv) {
    const layer = useContext(SpatialLayerContext) + 1
    const isInStandardInstance = !!useContext(SpatialIsStandardInstanceContext)
    const spatialId = useMemo(() => {
      return rootSpatialReactContextObject.getSubDivSpatialID(
        layer,
        isInStandardInstance,
        'CSSModel3D',
      )
    }, [])
    if (isInStandardInstance) {
      return renderCSSModel3DStandardInstance(spatialId, props, refIn)
    } else {
      return renderCSSModel3DPortalInstance(spatialId, props)
    }
  } else {
    return renderCSSModel3DNotInSpatialDiv(props, refIn)
  }
}

export const CSSModel3D = forwardRef(CSSModel3DBase)

CSSModel3D.displayName = 'CSSModel3D'
