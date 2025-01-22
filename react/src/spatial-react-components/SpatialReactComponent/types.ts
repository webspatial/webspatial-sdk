import { BackgroundMaterialType, CornerRadius } from '@xrsdk/runtime'
import { SpatialID } from './const'
import { ReactNode, CSSProperties, ElementType, ForwardedRef } from 'react'
import { quatType, vecType } from '../types'

export type spatialStyleDef = {
  position: Partial<vecType>
  rotation: quatType
  scale: Partial<vecType>
  zIndex?: number
  material?: { type: BackgroundMaterialType }
  cornerRadius: number | CornerRadius
  visible?: boolean
}

export interface SpatialReactComponentProps {
  allowScroll?: boolean
  scrollWithParent?: boolean
  spatialStyle?: Partial<spatialStyleDef>
  children?: ReactNode
  className?: string
  style?: CSSProperties | undefined

  component?: ElementType

  debugName?: string
  debugShowStandardInstance?: boolean
}

export type SpatialReactComponentRef = ForwardedRef<HTMLElement>

export interface SpatialReactComponentWithUniqueIDProps
  extends SpatialReactComponentProps {
  [SpatialID]: string
}
