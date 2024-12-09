import React, { forwardRef, Ref } from 'react'
import { primitives } from '../primitives'
import { CSSSpatialComponent } from './CSSSpatialComponent'

const cachedWithCSSSpatialType = new Map()

export function withCSSSpatial(Component: React.ElementType) {
  if (cachedWithCSSSpatialType.has(Component)) {
    return cachedWithCSSSpatialType.get(Component)
  } else {
    const WithCSSSpatialComponent = forwardRef(
      (givenProps: any, givenRef: Ref<any>) => {
        const {
          component: ignoreComponent,
          className: origClassName = '',
          ...props
        } = givenProps
        const className = 'xr-spatial-default ' + origClassName
        return (
          <CSSSpatialComponent
            component={Component}
            className={className}
            {...props}
            ref={givenRef}
          />
        )
      },
    )
    WithCSSSpatialComponent.displayName = `WithCSSSpatial(${typeof Component === 'string' ? Component : Component.displayName || Component.name})`

    cachedWithCSSSpatialType.set(Component, WithCSSSpatialComponent)
    cachedWithCSSSpatialType.set(
      WithCSSSpatialComponent,
      WithCSSSpatialComponent,
    )
    return WithCSSSpatialComponent
  }
}

export const CSSSpatialPrimitive: Record<string, typeof CSSSpatialComponent> =
  {}
;(function createSpatialPrimitive(CSSSpatialPrimitive) {
  primitives.forEach(primitive => {
    CSSSpatialPrimitive[primitive] = withCSSSpatial(primitive)
  })
})(CSSSpatialPrimitive)

export const CSSSpatialDiv = CSSSpatialPrimitive.div
