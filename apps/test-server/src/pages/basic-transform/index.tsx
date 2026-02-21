import React from 'react'
import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

export default function BasicTransform() {
  const style = {
    width: '300px',
    height: '300px',
    backgroundColor: 'green',
  }
  return (
    <div className="p-10 text-white">
      <h1 className="text-2xl mb-4">Basic Transform</h1>
      <div className="flex flex-col gap-4">
        <div>hello basic-transform</div>
        <div enable-xr style={style} className="rounded-lg shadow-xl" />
        <div>tail end</div>
      </div>
    </div>
  )
}
