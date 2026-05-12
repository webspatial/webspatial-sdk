'use client'

import { ComponentType, ForwardedRef, forwardRef } from 'react'
import type {
  SpatialBoxGeometryOptions,
  SpatialConeGeometryOptions,
  SpatialCylinderGeometryOptions,
  SpatialPlaneGeometryOptions,
  SpatialSphereGeometryOptions,
} from '@webspatial/core-sdk'
import type { EntityRefShape } from '../reality/hooks/useEntityRef'
import type { EntityEventHandler, EntityProps } from '../reality/type'
import { getSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { warnBootForgotten } from './shared/warnBootForgotten'

export type { EntityRefShape }

type SpatialImpl = NonNullable<ReturnType<typeof getSpatialImpl>>

/**
 * Factory for entity-class facades whose documented fallback is `null`.
 * The facade subscribes to bridge readiness via `useSpatialReady()` and
 * renders the real implementation only after `bootSpatial()` resolves in
 * a WebSpatial runtime. Per spec "Component facades" Requirement +
 * per-component fallback table.
 */
function createEntityRefFacade<P>(
  componentName: string,
  pickReal: (impl: SpatialImpl) => unknown,
) {
  function Impl(props: P, ref: ForwardedRef<EntityRefShape>) {
    const ready = useSpatialReady()
    if (!ready) {
      warnBootForgotten(componentName)
      return null
    }
    const RealComponent = pickReal(getSpatialImpl()!) as ComponentType<
      P & { ref?: unknown }
    >
    return <RealComponent {...(props as P)} ref={ref as any} />
  }
  const Facade = forwardRef<EntityRefShape, P>(Impl as any)
  Facade.displayName = componentName
  return Facade
}

/** Factory for facades whose real impl is a plain function component (no ref). */
function createNullFacade<P>(
  componentName: string,
  pickReal: (impl: SpatialImpl) => unknown,
) {
  function Facade(props: P) {
    const ready = useSpatialReady()
    if (!ready) {
      warnBootForgotten(componentName)
      return null
    }
    const RealComponent = pickReal(getSpatialImpl()!) as ComponentType<any>
    return <RealComponent {...(props as any)} />
  }
  Facade.displayName = componentName
  return Facade
}

// Prop shapes mirror src/reality/components/*Entity.tsx so consumers get the
// same TypeScript signatures from the default-entry facade as they would
// from the real spatial implementation.

type WithChildren<T> = T & { children?: React.ReactNode }
export type EntityFacadeProps = WithChildren<EntityProps>
export type BoxEntityProps = WithChildren<
  EntityProps & { materials?: string[] } & SpatialBoxGeometryOptions
>
export type SphereEntityProps = WithChildren<
  EntityProps & { materials?: string[] } & SpatialSphereGeometryOptions
>
export type ConeEntityProps = WithChildren<
  EntityProps & { materials?: string[] } & SpatialConeGeometryOptions
>
export type CylinderEntityProps = WithChildren<
  EntityProps & { materials?: string[] } & SpatialCylinderGeometryOptions
>
export type PlaneEntityProps = WithChildren<
  EntityProps & { materials?: string[] } & SpatialPlaneGeometryOptions
>
export type ModelEntityProps = WithChildren<
  EntityProps & EntityEventHandler & { model: string; materials?: string[] }
>
export type AttachmentEntityProps = {
  attachment: string
  position?: [number, number, number]
  size: { width: number; height: number }
}

export const Entity = createEntityRefFacade<EntityFacadeProps>(
  'Entity',
  impl => impl.Entity,
)
export const BoxEntity = createEntityRefFacade<BoxEntityProps>(
  'BoxEntity',
  impl => impl.BoxEntity,
)
export const SphereEntity = createEntityRefFacade<SphereEntityProps>(
  'SphereEntity',
  impl => impl.SphereEntity,
)
export const ConeEntity = createEntityRefFacade<ConeEntityProps>(
  'ConeEntity',
  impl => impl.ConeEntity,
)
export const CylinderEntity = createEntityRefFacade<CylinderEntityProps>(
  'CylinderEntity',
  impl => impl.CylinderEntity,
)
export const PlaneEntity = createEntityRefFacade<PlaneEntityProps>(
  'PlaneEntity',
  impl => impl.PlaneEntity,
)
export const ModelEntity = createEntityRefFacade<ModelEntityProps>(
  'ModelEntity',
  impl => impl.ModelEntity,
)

export const AttachmentEntity = createNullFacade<AttachmentEntityProps>(
  'AttachmentEntity',
  impl => impl.AttachmentEntity,
)

// Public aliases mirror src/reality/components/index.tsx.
export {
  BoxEntity as Box,
  ConeEntity as Cone,
  CylinderEntity as Cylinder,
  PlaneEntity as Plane,
  SphereEntity as Sphere,
}
