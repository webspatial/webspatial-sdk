import React, { forwardRef } from 'react'
import { EntityProps, EntityEventHandler } from '../type'
import { EntityRefShape } from '../hooks'
import { SpatialBoxGeometryOptions } from '@webspatial/core-sdk'
import { GeometryEntity } from './GeometryEntity'
import { useRealityContext } from '../context'

type BoxEntityProps = EntityProps &
  EntityEventHandler & {
    children?: React.ReactNode
    materials?: string[]
  } & SpatialBoxGeometryOptions

export const BoxEntity = forwardRef<EntityRefShape, BoxEntityProps>(
  ({ children, ...props }, ref) => {
    const ctx = useRealityContext()
    return (
      <GeometryEntity
        {...props}
        ref={ref}
        createGeometry={options => ctx!.session.createBoxGeometry(options)}
        geometryOptions={{
          width: props.width,
          height: props.height,
          depth: props.depth,
          cornerRadius: props.cornerRadius,
        }}
      >
        {children}
      </GeometryEntity>
    )
  },
)
