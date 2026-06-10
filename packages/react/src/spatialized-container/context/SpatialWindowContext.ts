import { createContext, useContext } from 'react'

export const SpatialWindowContext = createContext<WindowProxy | null>(null)

export function useSpatialPortalContainer(): HTMLElement | undefined {
  const windowProxy = useContext(SpatialWindowContext)
  return windowProxy?.document?.body ?? undefined
}
