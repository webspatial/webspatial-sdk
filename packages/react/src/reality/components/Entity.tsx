import React, { forwardRef } from 'react'
import { EntityProps } from '../type'
import { EntityRefShape } from '../hooks'
import { BaseEntity } from './BaseEntity'

type Props = EntityProps & { children?: React.ReactNode }

export const Entity = forwardRef<EntityRefShape, Props>((props, ref) => {
  const { id, name, children, ...rest } = props
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
})
