import { createContext } from 'react'

export class SpatialPortalContextObject {
  container: Element | DocumentFragment
  key?: string | null

  constructor(container: Element | DocumentFragment, key?: string | null) {
    this.container = container
    this.key = key
  }
}

export const SpatialPortalContext =
  createContext<SpatialPortalContextObject | null>(null)
