import { CSSProperties, ForwardedRef } from 'react'
import { vecType, quatType } from '../types'
import {
  ModelDragEvent as SpatialModelDragEvent,
  Vec3,
} from '@webspatial/core-sdk'

export type SpatialTransformType = {
  position: vecType
  rotation: quatType
  scale: vecType
}

export type PartialSpatialTransformType = {
  position?: Partial<vecType>
  rotation?: Partial<quatType>
  scale?: Partial<vecType>
}

export interface ModelEvent {
  target: ModelElement
}

export interface ModelDragEvent extends ModelEvent {
  eventType: 'dragstart' | 'dragend' | 'drag'
  translation3D: Vec3
  startLocation3D: Vec3
}

export interface Model3DProps {
  spatialTransform?: PartialSpatialTransformType
  modelUrl: string
  visible: boolean
  contentMode?: 'fill' | 'fit'
  resizable?: boolean
  aspectRatio?: number
  className?: string
  style?: CSSProperties | undefined

  // children will be rendered when failure
  children?: React.ReactNode

  onLoad?: (event: ModelEvent) => void

  onDragStart?: (dragEvent: ModelDragEvent) => void
  onDrag?: (dragEvent: ModelDragEvent) => void
  onDragEnd?: (dragEvent: ModelDragEvent) => void

  onTap?: (event: ModelEvent) => void
  onDoubleTap?: (event: ModelEvent) => void
  onLongPress?: (event: ModelEvent) => void
}

export interface ModelElement extends HTMLDivElement {
  ready: boolean
  currentSrc: string
}

export type ModelElementRef = ForwardedRef<ModelElement>
