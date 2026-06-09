import React, { forwardRef } from 'react'
import { EntityProps } from '../type'
import { EntityRefShape } from '../hooks'
import { SpatialSphereGeometryOptions } from '@webspatial/core-sdk'
import { GeometryEntity } from './GeometryEntity'
import { useRealityContext } from '../context'

type SphereEntityProps<Name extends string = string> = EntityProps<Name> & {
  children?: React.ReactNode
  materials?: string[]
} & SpatialSphereGeometryOptions

type SphereEntityComponent = <Name extends string = string>(
  props: SphereEntityProps<Name> & React.RefAttributes<EntityRefShape>,
) => React.ReactElement | null

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
) as SphereEntityComponent
