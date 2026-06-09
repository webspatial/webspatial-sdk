import React, { forwardRef } from 'react'
import { EntityProps } from '../type'
import { EntityRefShape } from '../hooks'
import { SpatialPlaneGeometryOptions } from '@webspatial/core-sdk'
import { GeometryEntity } from './GeometryEntity'
import { useRealityContext } from '../context'

type PlaneEntityProps<Name extends string = string> = EntityProps<Name> & {
  children?: React.ReactNode
  materials?: string[]
} & SpatialPlaneGeometryOptions

type PlaneEntityComponent = <Name extends string = string>(
  props: PlaneEntityProps<Name> & React.RefAttributes<EntityRefShape>,
) => React.ReactElement | null

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
) as PlaneEntityComponent
