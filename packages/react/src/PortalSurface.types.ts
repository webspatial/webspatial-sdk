import type React from 'react'
import type { BackgroundMaterialType } from '@webspatial/core-sdk'

export type PortalSurfaceProps = {
  children?: React.ReactNode
  zOffset?: number | string
  backgroundMaterial?: BackgroundMaterialType
}
