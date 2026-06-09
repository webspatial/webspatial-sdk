import React, { forwardRef } from 'react'
import { assertValidSpatialEntityName } from '@webspatial/core-sdk'
import { EntityProps } from '../type'
import { EntityRefShape } from '../hooks'
import { BaseEntity } from './BaseEntity'

type Props<Name extends string = string> = EntityProps<Name> & {
  children?: React.ReactNode
}

type EntityComponent = <Name extends string = string>(
  props: Props<Name> & React.RefAttributes<EntityRefShape>,
) => React.ReactElement | null

export const Entity = forwardRef<EntityRefShape, Props>((props, ref) => {
  const { id, name, children, ...rest } = props
  assertValidSpatialEntityName(name)
  return (
    <BaseEntity
      {...rest}
      id={id}
      ref={ref}
      createEntity={async ctxVal => ctxVal!.session.createEntity({ id, name })}
    >
      {children}
    </BaseEntity>
  )
}) as EntityComponent
