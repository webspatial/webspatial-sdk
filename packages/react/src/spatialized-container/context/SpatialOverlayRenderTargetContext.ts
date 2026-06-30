import { createContext, useContext } from 'react'

export type SpatialOverlayRenderTarget = 'measurement' | 'portal'

export const SpatialOverlayRenderTargetContext =
  createContext<SpatialOverlayRenderTarget | null>(null)

export function useSpatialOverlayRenderTarget() {
  return useContext(SpatialOverlayRenderTargetContext)
}
