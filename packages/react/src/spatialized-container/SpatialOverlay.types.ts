import type { ComponentType, ReactNode } from 'react'

export type SpatialOverlayPortalOption = (
  content: ReactNode,
  measurementContent?: ReactNode,
) => ReactNode

export type SpatialOverlayProps = {
  overlayId?: string
  measurementContent?: ReactNode
  portalTargetName: string
  onPortalTargetChange?: (node: HTMLDivElement | null) => void
  children?: ReactNode
}

export type UseSpatialOverlayOptions = {
  overlayId?: string
  portalTargetName: string
}

export type UseSpatialOverlayResult = {
  OverlayTarget: ComponentType<{
    measurementContent?: ReactNode
    children?: ReactNode
  }>
  portalMenuOption: SpatialOverlayPortalOption
}
