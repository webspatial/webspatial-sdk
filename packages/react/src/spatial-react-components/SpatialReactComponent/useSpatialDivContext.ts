import { useContext } from 'react'
import { SpatialIsStandardInstanceContext } from './SpatialIsStandardInstanceContext'
import { SpatialReactContext } from './SpatialReactContext'

export function useCheckSpatialDivContext() {
  const inSpatialDiv = !!useContext(SpatialReactContext)
  const inStandardInstance = !!useContext(SpatialIsStandardInstanceContext)
  const inPortalInstance = inSpatialDiv && !inStandardInstance
  return { inSpatialDiv, inStandardInstance, inPortalInstance }
}
