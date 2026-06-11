import React, { forwardRef } from 'react'

export const SpatialOverlayVisibleHost = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(function SpatialOverlayVisibleHost(props, ref) {
  return <div ref={ref} {...props} />
})
