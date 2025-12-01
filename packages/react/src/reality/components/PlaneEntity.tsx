import React, { forwardRef } from 'react'
import { EntityProps, EntityEventHandler } from '../type'
import { EntityRefShape } from '../hooks'
import { SpatialPlaneGeometryOptions } from '@webspatial/core-sdk'
import { GeometryEntity } from './GeometryEntity'
import { useRealityContext } from '../context'

type PlaneEntityProps = EntityProps &
  EntityEventHandler & {
    children?: React.ReactNode
    materials?: string[]
  } & SpatialPlaneGeometryOptions

export const PlaneEntity = forwardRef<EntityRefShape, PlaneEntityProps>(
  ({ children, ...props }, ref) => {
    const ctx = useRealityContext()
    return (
      <GeometryEntity
        {...props}
        ref={ref}
        createGeometry={options => ctx!.session.createPlaneGeometry(options)}
        geometryOptions={{
          width: props.width,
          height: props.height,
          cornerRadius: props.cornerRadius,
        }}
      >
        {children}
      </GeometryEntity>
    )
  },
)
