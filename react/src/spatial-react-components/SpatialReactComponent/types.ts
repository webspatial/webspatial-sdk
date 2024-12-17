import { BackgroundMaterialType, CornerRadius } from '@xrsdk/runtime'
import { SpatialID } from './const'
import {
  ReactNode,
  CSSProperties,
  Ref,
  useImperativeHandle,
  forwardRef,
  useMemo,
  ElementType,
  useContext,
  ForwardedRef,
} from 'react'

export type vecType = { x: number; y: number; z: number }
export type quatType = { x: number; y: number; z: number; w: number }

export type spatialStyleDef = {
  position: Partial<vecType>
  rotation: quatType
  scale: Partial<vecType>
  zIndex?: number
  material?: { type: BackgroundMaterialType }
  cornerRadius: number | CornerRadius
}

export type RectType = {
  x: number
  y: number
  width: number
  height: number
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
