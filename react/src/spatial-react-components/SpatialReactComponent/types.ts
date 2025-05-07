import { BackgroundMaterialType, CornerRadius } from '@webspatial/core-sdk'
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

  // when optimized is true, the standard instance will use div to render,
  // and the the standard instance's dom rect will be determined by the style instead of it's children.
  // this is used to optimize the performance of the standard instance.
  optimized?: boolean

  debugName?: string
  debugShowStandardInstance?: boolean
}

export type SpatialReactComponentRef = ForwardedRef<HTMLDivElement>

export interface SpatialReactComponentWithUniqueIDProps
  extends SpatialReactComponentProps {
  [SpatialID]: string
}
