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
import { requireSpatialImpl } from '../runtime/bridge'
import { useSpatialReady } from '../runtime/useSpatialReady'
import { getBootForgottenDiagnostic } from './shared/warnBootForgotten'

export type { EntityRefShape }

type SpatialImpl = ReturnType<typeof requireSpatialImpl>

/**
 * Factory for entity-class facades whose documented fallback is `null`.
 * The facade subscribes to bridge readiness via `useSpatialReady()` and
 * renders the real implementation only after `bootSpatial()` resolves in
 * a WebSpatial runtime. Per spec "Component facades" Requirement +
 * per-component fallback table.
 *
 * **PARITY (spec tasks.md §15.6)**: this Path 1 fallback is pinned
 * by `runtime-capabilities` "Unsupported HTML component rendering"
 * Scenario ("MUST not render corresponding DOM/entity node"). Real
 * `*Entity` components (`src/reality/components/*Entity.tsx`) currently
 * throw when `useRealityContext()` is null instead of rendering null,
 * which is a real-impl drift tracked under §15.8 (see
 * `src/__tests__/parity.test.tsx` "Entity-class parity" `it.todo`).
 * Do not modify this Path 1 `null` fallback without first aligning the
 * real-impl branch.
 */
function createEntityRefFacade<P>(
  componentName: string,
  pickReal: (impl: SpatialImpl) => unknown,
) {
  function Impl(props: P, ref: ForwardedRef<EntityRefShape>) {
    const ready = useSpatialReady()
    if (!ready) {
      return getBootForgottenDiagnostic(componentName)
    }
    const RealComponent = pickReal(requireSpatialImpl()) as ComponentType<
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
      return getBootForgottenDiagnostic(componentName)
    }
    const RealComponent = pickReal(requireSpatialImpl()) as ComponentType<any>
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

// `/* @__PURE__ */` annotations on each factory call: tells the consumer
// bundler (and the spatial-lazy-load §9.6 lint) that the factory invocation
// has no observable side effect, so unused entity facades can be tree-shaken
// out of the consumer bundle. The factories themselves only call
// `forwardRef` / set `displayName` — both module-private pure operations.
export const Entity = /* @__PURE__ */ createEntityRefFacade<EntityFacadeProps>(
  'Entity',
  impl => impl.Entity,
)
export const BoxEntity = /* @__PURE__ */ createEntityRefFacade<BoxEntityProps>(
  'BoxEntity',
  impl => impl.BoxEntity,
)
export const SphereEntity =
  /* @__PURE__ */ createEntityRefFacade<SphereEntityProps>(
    'SphereEntity',
    impl => impl.SphereEntity,
  )
export const ConeEntity =
  /* @__PURE__ */ createEntityRefFacade<ConeEntityProps>(
    'ConeEntity',
    impl => impl.ConeEntity,
  )
export const CylinderEntity =
  /* @__PURE__ */ createEntityRefFacade<CylinderEntityProps>(
    'CylinderEntity',
    impl => impl.CylinderEntity,
  )
export const PlaneEntity =
  /* @__PURE__ */ createEntityRefFacade<PlaneEntityProps>(
    'PlaneEntity',
    impl => impl.PlaneEntity,
  )
export const ModelEntity =
  /* @__PURE__ */ createEntityRefFacade<ModelEntityProps>(
    'ModelEntity',
    impl => impl.ModelEntity,
  )

export const AttachmentEntity =
  /* @__PURE__ */ createNullFacade<AttachmentEntityProps>(
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
