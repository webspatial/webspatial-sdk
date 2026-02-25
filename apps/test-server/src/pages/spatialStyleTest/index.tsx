import React from 'react'
import { CSSModelSample } from './CSSModelSample'
import { enableDebugTool } from '@webspatial/react-sdk'
import { SpatialTagComponent } from './SpatialTagComponent'
import { NestedComponent } from './NestedComponent'
import { CubeComponent } from './CubeComponent'
import { SimpleSpatialComponent } from './SimpleSpatialComponent'
import { StyledTitleComponent } from './StyledTitleComponent'
import { StyledVisibilityComponent } from './StyledVisibilityComponent'

enableDebugTool()

export default function SpatialStyleTest() {
  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-8">Spatial Style Test</h1>
      <div enable-xr-monitor className="w-full h-full">
        <div className="flex flex-col gap-10">
          <StyledVisibilityComponent />
          <SimpleSpatialComponent />
          <SpatialTagComponent />
          <StyledTitleComponent />
          <NestedComponent />
          <CSSModelSample />
          <CubeComponent />
        </div>
      </div>
    </div>
  )
}
