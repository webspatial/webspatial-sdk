import React, { forwardRef } from 'react'
import { EntityProps } from '../type'
import { EntityRefShape } from '../hooks'
import { BaseEntity } from './BaseEntity'

export type EntityComponentProps = EntityProps & { children?: React.ReactNode }

export const Entity = forwardRef<EntityRefShape, EntityComponentProps>(
  (props, ref) => {
    const { id, name, children, ...rest } = props
    return (
      <BaseEntity
        {...rest}
        id={id}
        ref={ref}
        createEntity={async ctxVal =>
          ctxVal!.session.createEntity({ id, name })
        }
      >
        {children}
      </BaseEntity>
    )
  },
)

Entity.displayName = 'Entity'
