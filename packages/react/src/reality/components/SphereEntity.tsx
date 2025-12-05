import React, { forwardRef } from 'react'
import { EntityProps, EntityEventHandler } from '../type'
import { EntityRefShape } from '../hooks'
import { SpatialSphereGeometryOptions } from '@webspatial/core-sdk'
import { GeometryEntity } from './GeometryEntity'
import { useRealityContext } from '../context'

type SphereEntityProps = EntityProps &
  EntityEventHandler & {
    children?: React.ReactNode
    materials?: string[]
  } & SpatialSphereGeometryOptions

export const SphereEntity = forwardRef<EntityRefShape, SphereEntityProps>(
  ({ children, ...props }, ref) => {
    const ctx = useRealityContext()
    return (
      <GeometryEntity
        {...props}
        ref={ref}
        createGeometry={options => ctx!.session.createSphereGeometry(options)}
        geometryOptions={{
          radius: props.radius,
        }}
      >
        {children}
      </GeometryEntity>
    )
  },
)
