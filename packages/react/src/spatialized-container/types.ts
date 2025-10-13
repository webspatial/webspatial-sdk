import React, { ElementType } from 'react'
import { SpatialID } from './SpatialID'
import {
  CubeInfo,
  SpatializedElement,
  SpatialTapEvent as CoreSpatialTapEvent,
  SpatialDragEvent as CoreSpatialDragEvent,
  SpatialRotateEvent as CoreSpatialRotateEvent,
  SpatialMagnifyEvent as CoreSpatialMagnifyEvent,
  SpatializedStatic3DElement,
} from '@webspatial/core-sdk'

export type { Point3D, Vec3 } from '@webspatial/core-sdk'

// SpatialEvents
type SpatialEventProps<T extends SpatializedElementRef> = {
  onSpatialTap?: (event: SpatialTapEvent<T>) => void
  onSpatialDragStart?: (event: SpatialDragStartEvent<T>) => void
  onSpatialDrag?: (event: SpatialDragEvent<T>) => void
  onSpatialDragEnd?: (event: SpatialDragEndEvent<T>) => void
  onSpatialRotateStart?: (event: SpatialRotateStartEvent<T>) => void
  onSpatialRotate?: (event: SpatialRotateEvent<T>) => void
  onSpatialRotateEnd?: (event: SpatialRotateEndEvent<T>) => void
  onSpatialMagnifyStart?: (event: SpatialMagnifyStartEvent<T>) => void
  onSpatialMagnify?: (event: SpatialMagnifyEvent<T>) => void
  onSpatialMagnifyEnd?: (event: SpatialMagnifyEndEvent<T>) => void
}

export interface StandardSpatializedContainerProps
  extends React.ComponentPropsWithoutRef<'div'> {
  component: ElementType
  inStandardSpatializedContainer?: boolean
  [SpatialID]: string
}

export type RealityProps = SpatialEventProps<SpatializedElementRef> &
  React.ComponentPropsWithRef<'div'>
export type PortalSpatializedContainerProps<T extends SpatializedElementRef> =
  SpatialEventProps<T> &
    React.ComponentPropsWithoutRef<'div'> & {
      component: ElementType
      spatializedContent: ElementType
      createSpatializedElement: () => Promise<SpatializedElement>
      getExtraSpatializedElementProperties?: (
        computedStyle: CSSStyleDeclaration,
      ) => Record<string, any>

      [SpatialID]: string
    }

export type SpatializedContainerProps<T extends SpatializedElementRef> = Omit<
  StandardSpatializedContainerProps & PortalSpatializedContainerProps<T>,
  typeof SpatialID | 'onLoad' | 'onError'
> & {
  extraRefProps?: (domProxy: T) => Record<string, () => any>
}

export type SpatializedContentProps<
  T extends SpatializedElementRef,
  P extends ElementType,
> = Omit<PortalSpatializedContainerProps<T>, 'spatializedContent'> & {
  spatializedElement: SpatializedElement
}

export type Spatialized2DElementContainerProps<P extends ElementType> =
  SpatialEventProps<SpatializedElementRef> &
    React.ComponentPropsWithRef<'div'> & {
      component: P
    }

export type SpatializedStatic3DContainerProps =
  SpatialEventProps<SpatializedStatic3DElementRef> &
    Omit<React.ComponentPropsWithoutRef<'div'>, 'onLoad' | 'onError'> & {
      src?: string
      onLoad?: (event: ModelLoadEvent) => void
      onError?: (event: ModelLoadEvent) => void
    }

export type SpatializedStatic3DContentProps = {
  spatializedElement: SpatializedStatic3DElement
  src?: string
  onLoad?: (event: ModelLoadEvent) => void
  onError?: (event: ModelLoadEvent) => void
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

export type SpatializedElementRef<T extends HTMLElement = HTMLElement> = T

export type SpatializedDivElementRef = SpatializedElementRef<HTMLDivElement>

export type SpatializedStatic3DElementRef = SpatializedDivElementRef & {
  currentSrc: string
  ready: Promise<ModelLoadEvent>
  entityTransform: DOMMatrix
}

type CurrentTarget<T extends SpatializedElementRef> = {
  currentTarget: T
}

export type SpatialTapEvent<
  T extends SpatializedElementRef = SpatializedElementRef,
> = CoreSpatialTapEvent & CurrentTarget<T>

export type SpatialDragStartEvent<
  T extends SpatializedElementRef = SpatializedElementRef,
> = CoreSpatialDragEvent & CurrentTarget<T>

export type SpatialDragEvent<
  T extends SpatializedElementRef = SpatializedElementRef,
> = CoreSpatialDragEvent & CurrentTarget<T>

export type SpatialDragEndEvent<
  T extends SpatializedElementRef = SpatializedElementRef,
> = CoreSpatialDragEvent & CurrentTarget<T>

export type SpatialRotateStartEvent<
  T extends SpatializedElementRef = SpatializedElementRef,
> = CoreSpatialRotateEvent & CurrentTarget<T>

export type SpatialRotateEvent<
  T extends SpatializedElementRef = SpatializedElementRef,
> = CoreSpatialRotateEvent & CurrentTarget<T>

export type SpatialRotateEndEvent<
  T extends SpatializedElementRef = SpatializedElementRef,
> = CoreSpatialRotateEvent & CurrentTarget<T>

export type SpatialMagnifyStartEvent<
  T extends SpatializedElementRef = SpatializedElementRef,
> = CoreSpatialMagnifyEvent & CurrentTarget<T>

export type SpatialMagnifyEvent<
  T extends SpatializedElementRef = SpatializedElementRef,
> = CoreSpatialMagnifyEvent & CurrentTarget<T>

export type SpatialMagnifyEndEvent<
  T extends SpatializedElementRef = SpatializedElementRef,
> = CoreSpatialMagnifyEvent & CurrentTarget<T>

// Model Spatial Event
export type ModelSpatialTapEvent =
  SpatialTapEvent<SpatializedStatic3DElementRef>
export type ModelSpatialDragStartEvent =
  SpatialDragStartEvent<SpatializedStatic3DElementRef>
export type ModelSpatialDragEvent =
  SpatialDragEvent<SpatializedStatic3DElementRef>
export type ModelSpatialDragEndEvent =
  SpatialDragEndEvent<SpatializedStatic3DElementRef>
export type ModelSpatialRotateStartEvent =
  SpatialRotateStartEvent<SpatializedStatic3DElementRef>
export type ModelSpatialRotateEvent =
  SpatialRotateEvent<SpatializedStatic3DElementRef>
export type ModelSpatialRotateEndEvent =
  SpatialRotateEndEvent<SpatializedStatic3DElementRef>
export type ModelSpatialMagnifyStartEvent =
  SpatialMagnifyStartEvent<SpatializedStatic3DElementRef>
export type ModelSpatialMagnifyEvent =
  SpatialMagnifyEvent<SpatializedStatic3DElementRef>
export type ModelSpatialMagnifyEndEvent =
  SpatialMagnifyEndEvent<SpatializedStatic3DElementRef>

export type ModelLoadEvent = CustomEvent & {
  target: SpatializedStatic3DElementRef
}
