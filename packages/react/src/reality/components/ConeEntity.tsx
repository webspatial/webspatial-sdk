import React, { forwardRef } from 'react'
import { EntityProps } from '../type'
import { EntityRefShape } from '../hooks'
import { SpatialConeGeometryOptions } from '@webspatial/core-sdk'
import { GeometryEntity } from './GeometryEntity'
import { useRealityContext } from '../context'

export type ConeEntityProps = EntityProps & {
  children?: React.ReactNode
  materials?: string[]
} & SpatialConeGeometryOptions

export const ConeEntity = forwardRef<EntityRefShape, ConeEntityProps>(
  ({ children, ...props }, ref) => {
    const ctx = useRealityContext()
    return (
      <GeometryEntity
        {...props}
        ref={ref}
        createGeometry={options => ctx!.session.createConeGeometry(options)}
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
