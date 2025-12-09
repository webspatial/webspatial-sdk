import React, { forwardRef, Ref } from 'react'
import { SpatialMonitor } from './SpatialMonitor'

const cachedWithSpatialMonitorType = new Map()

export function withSpatialMonitor(El: React.ElementType) {
  if (cachedWithSpatialMonitorType.has(El)) {
    return cachedWithSpatialMonitorType.get(El)
  } else {
    const WithSpatialMonitorComponent = forwardRef(
      (givenProps: any, givenRef: Ref<any>) => {
        const {
          El: _,

          ...props
        } = givenProps

        return <SpatialMonitor El={El} {...props} ref={givenRef} />
      },
    )
    WithSpatialMonitorComponent.displayName = `WithSpatialMonitor(${typeof El === 'string' ? El : El.displayName || El.name})`

    cachedWithSpatialMonitorType.set(El, WithSpatialMonitorComponent)
    cachedWithSpatialMonitorType.set(
      cachedWithSpatialMonitorType,
      cachedWithSpatialMonitorType,
    )
    return WithSpatialMonitorComponent
  }
}
