// 首先确保导入所需的类型
import React, { ElementType } from 'react'
import { SpatialID } from './SpatialID'
import { SpatializedElement } from '@webspatial/core-sdk'
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
  [SpatialID]: string
}

export type SpatializedContainerProps = Omit<
  StandardSpatializedContainerProps & PortalSpatializedContainerProps,
  typeof SpatialID
>

export type Spatialized2DElementContainerProps = Omit<
  SpatializedContainerProps,
  | 'spatializedContent'
  | 'createSpatializedElement'
  | 'getExtraSpatializedElementProperties'
>

export interface SpatializedContentProps
  extends Omit<PortalSpatializedContainerProps, 'spatializedContent'> {
  spatializedElement: SpatializedElement
}

export const SpatialCustomStyleVars = {
  back: '--xr-back',
  backgroundMaterial: '--xr-background-material',
  xrZIndex: '--xr-z-index',
}

export interface SpatialTransformVisibility {
  transformMatrix: Matrix4
  transformExist: boolean
  visibility: string
}
