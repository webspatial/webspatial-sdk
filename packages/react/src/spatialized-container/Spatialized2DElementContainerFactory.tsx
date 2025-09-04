import React, { ForwardedRef, forwardRef } from 'react'
import { Spatialized2DElementContainer } from './Spatialized2DElementContainer'
import {
  Spatialized2DElementContainerProps,
  SpatializedElementRef,
} from './types'

const CachedSpatialized2DElementContainerType = new Map()

export function withSpatialized2DElementContainer(
  Component: React.ElementType,
) {
  if (CachedSpatialized2DElementContainerType.has(Component)) {
    return CachedSpatialized2DElementContainerType.get(Component)
  } else {
    const TypedSpatialized2DElementContainer = forwardRef(
      (
        givenProps: Spatialized2DElementContainerProps,
        ref: ForwardedRef<SpatializedElementRef>,
      ) => {
        const { component: ignoreComponent, ...props } = givenProps
        return (
          <Spatialized2DElementContainer
            component={Component}
            {...props}
            ref={ref}
          />
        )
      },
    )

    CachedSpatialized2DElementContainerType.set(
      Component,
      TypedSpatialized2DElementContainer,
    )
    CachedSpatialized2DElementContainerType.set(
      TypedSpatialized2DElementContainer,
      TypedSpatialized2DElementContainer,
    )
    return TypedSpatialized2DElementContainer
  }
}
