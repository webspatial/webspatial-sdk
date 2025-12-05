import React, { forwardRef } from 'react'
import { EntityProps, EntityEventHandler } from '../type'
import { EntityRefShape } from '../hooks'
import { SpatialCylinderGeometryOptions } from '@webspatial/core-sdk'
import { GeometryEntity } from './GeometryEntity'
import { useRealityContext } from '../context'

type CylinderEntityProps = EntityProps &
  EntityEventHandler & {
    children?: React.ReactNode
    materials?: string[]
  } & SpatialCylinderGeometryOptions

export const CylinderEntity = forwardRef<EntityRefShape, CylinderEntityProps>(
  ({ children, ...props }, ref) => {
    const ctx = useRealityContext()
    return (
      <GeometryEntity
        {...props}
        ref={ref}
        createGeometry={options => ctx!.session.createCylinderGeometry(options)}
        geometryOptions={{
          radius: props.radius,
          height: props.height,
        }}
      >
        {children}
      </GeometryEntity>
    )
  },
)
