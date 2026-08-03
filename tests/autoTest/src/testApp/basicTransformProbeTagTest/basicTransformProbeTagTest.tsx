import { enableDebugTool } from '@webspatial/react-sdk'
import React from 'react'
import './basicTransformProbeTagTest.css'

enableDebugTool()

export default function BasicTransformProbeTagTest() {
  const style: React.CSSProperties = {
    width: '200px',
    height: '200px',
    backgroundColor: 'green',
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-xl mb-4">Basic transform probe tag</h1>
      <h1
        enable-xr
        data-testid="basic-transform-spatial-h1"
        className="basicTransformProbe rounded-lg"
        style={style}
      />
    </div>
  )
}
