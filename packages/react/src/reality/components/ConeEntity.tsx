import React, { forwardRef } from 'react'
import { EntityProps } from '../type'
import { EntityRefShape } from '../hooks'
import { SpatialConeGeometryOptions } from '@webspatial/core-sdk'
import { GeometryEntity } from './GeometryEntity'
import { useRealityContext } from '../context'

type ConeEntityProps<Name extends string = string> = EntityProps<Name> & {
  children?: React.ReactNode
  materials?: string[]
} & SpatialConeGeometryOptions

type ConeEntityComponent = <Name extends string = string>(
  props: ConeEntityProps<Name> & React.RefAttributes<EntityRefShape>,
) => React.ReactElement | null

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
) as ConeEntityComponent
