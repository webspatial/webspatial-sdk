import {
  SpatializedDynamic3DElement,
  SpatialSession,
} from '@webspatial/core-sdk'
import { createContext, useContext } from 'react'
import { ResourceRegistry } from '../utils'

export type RealityContextValue = {
  session: SpatialSession
  reality: SpatializedDynamic3DElement
  resourceRegistry: ResourceRegistry
} | null
export const RealityContext = createContext<RealityContextValue>(null)
export const useRealityContext = () => useContext(RealityContext)
