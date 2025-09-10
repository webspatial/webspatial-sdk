import React, { ElementType } from 'react'
import { SpatialID } from './SpatialID'
import {
  CubeInfo,
  SpatializedElement,
  SpatialTapEvent as CoreSpatialTapEvent,
  SpatialDragEvent as CoreSpatialDragEvent,
  SpatialRotateEvent as CoreSpatialRotateEvent,
  SpatialMagnifyEvent as CoreSpatialMagnifyEvent,
  Point3D,
  Vec3,
} from '@webspatial/core-sdk'

export type { Point3D, Vec3 } from '@webspatial/core-sdk'

export interface StandardSpatializedContainerProps
  extends React.ComponentPropsWithoutRef<'div'> {
  component: ElementType
  [SpatialID]: string
}

export interface PortalSpatializedContainerProps
  extends React.ComponentPropsWithoutRef<'div'> {
  component: ElementType
  spatializedContent: ElementType
  createSpatializedElement: () => Promise<SpatializedElement>
  getExtraSpatializedElementProperties?: (
    computedStyle: CSSStyleDeclaration,
  ) => Record<string, any>

  // SpatialEvents
  onSpatialTap?: (event: SpatialTapEvent) => void
  onSpatialDragStart?: (event: SpatialDragStartEvent) => void
  onSpatialDrag?: (event: SpatialDragEvent) => void
  onSpatialDragEnd?: (event: SpatialDragEndEvent) => void
  onSpatialRotateStart?: (event: SpatialRotateStartEvent) => void
  onSpatialRotate?: (event: SpatialRotateEvent) => void
  onSpatialRotateEnd?: (event: SpatialRotateEndEvent) => void
  onSpatialMagnifyStart?: (event: SpatialMagnifyStartEvent) => void
  onSpatialMagnify?: (event: SpatialMagnifyEvent) => void
  onSpatialMagnifyEnd?: (event: SpatialMagnifyEndEvent) => void

  [SpatialID]: string
}

export type SpatializedContainerProps = Omit<
  StandardSpatializedContainerProps & PortalSpatializedContainerProps,
  typeof SpatialID
> & {
  extraRefProps?: Record<string, () => any>
}

export interface SpatializedContentProps
  extends Omit<PortalSpatializedContainerProps, 'spatializedContent'> {
  spatializedElement: SpatializedElement
}

export type Spatialized2DElementContainerProps = Omit<
  SpatializedContainerProps,
  | 'spatializedContent'
  | 'createSpatializedElement'
  | 'getExtraSpatializedElementProperties'
  | 'extraRefProps'
>

export interface SpatializedStatic3DContainerProps
  extends Omit<Spatialized2DElementContainerProps, 'component'> {
  src?: string
  // onLoad?: (element: SpatializedStatic3DElementRef) => void
  // onError?: (element: SpatializedStatic3DElementRef) => void
}

export interface SpatializedStatic3DContentProps
  extends React.ComponentPropsWithoutRef<'div'> {
  spatializedElement: SpatializedElement
  src?: string
}

export const SpatialCustomStyleVars = {
  back: '--xr-back',
  depth: '--xr-depth',
  backgroundMaterial: '--xr-background-material',
  xrZIndex: '--xr-z-index',
}

export interface SpatialTransformVisibility {
  transform: string
  visibility: string
}

export interface SpatializedElementRef extends HTMLElement {
  clientDepth: number
  offsetBack: number
  getBoundingClientCube: () => CubeInfo | undefined

  onSpatialTap?: (event: SpatialTapEvent) => void
  onSpatialDrag?: (event: SpatialDragEvent) => void
}

export interface SpatializedStatic3DElementRef extends SpatializedElementRef {
  src: string
  ready: Promise<SpatializedStatic3DElementRef>
}

export type SpatialTapEvent = CoreSpatialTapEvent & {
  currentTarget: SpatializedElementRef
}

export type SpatialDragStartEvent = CoreSpatialDragEvent & {
  currentTarget: SpatializedElementRef
}

export type SpatialDragEvent = CoreSpatialDragEvent & {
  currentTarget: SpatializedElementRef
}

export type SpatialDragEndEvent = CoreSpatialDragEvent & {
  currentTarget: SpatializedElementRef
}

export type SpatialRotateStartEvent = CoreSpatialRotateEvent & {
  currentTarget: SpatializedElementRef
}

export type SpatialRotateEvent = CoreSpatialRotateEvent & {
  currentTarget: SpatializedElementRef
}

export type SpatialRotateEndEvent = CoreSpatialRotateEvent & {
  currentTarget: SpatializedElementRef
}

export type SpatialMagnifyEventDetail = {
  magnification: number
  velocity: number
  startAnchor3D: Vec3
  startLocation3D: Point3D
}

export type SpatialMagnifyStartEvent = CoreSpatialMagnifyEvent & {
  currentTarget: SpatializedElementRef
}

export type SpatialMagnifyEvent = CoreSpatialMagnifyEvent & {
  currentTarget: SpatializedElementRef
}

export type SpatialMagnifyEndEvent = CoreSpatialMagnifyEvent & {
  currentTarget: SpatializedElementRef
}
