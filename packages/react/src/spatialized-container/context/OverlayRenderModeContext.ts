import { createContext, useContext } from 'react'

export type OverlayRenderMode = 'measure' | 'visible'

export const OverlayRenderModeContext =
  createContext<OverlayRenderMode>('visible')

export function useOverlayRenderMode() {
  return useContext(OverlayRenderModeContext)
}
