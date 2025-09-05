import React, { ElementType } from 'react'
import { SpatialID } from './SpatialID'
import {
  CubeInfo,
  SpatializedElement,
  SpatialTapEvent as CoreSpatialTapEvent,
} from '@webspatial/core-sdk'
import { Matrix4 } from '../utils/math'

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

  [SpatialID]: string
}

export type SpatializedContainerProps = Omit<
  StandardSpatializedContainerProps & PortalSpatializedContainerProps,
  typeof SpatialID
>

export interface SpatializedContentProps
  extends Omit<PortalSpatializedContainerProps, 'spatializedContent'> {
  spatializedElement: SpatializedElement
}

export type Spatialized2DElementContainerProps = Omit<
  SpatializedContainerProps,
  | 'spatializedContent'
  | 'createSpatializedElement'
  | 'getExtraSpatializedElementProperties'
>

export interface SpatializedStatic3DContainerProps
  extends Omit<Spatialized2DElementContainerProps, 'component'> {
  src?: string
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
  transformMatrix: Matrix4
  transformExist: boolean
  visibility: string
}

export interface SpatializedElementRef extends HTMLElement {
  clientDepth: number
  offsetBack: number
  getBoundingClientCube: () => CubeInfo | undefined

  onSpatialTap?: (event: SpatialTapEvent) => void
}

export type SpatialTapEvent = CoreSpatialTapEvent & {
  currentTarget: SpatializedElementRef
}
