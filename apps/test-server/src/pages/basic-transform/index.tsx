import React from 'react'
import { enableDebugTool } from '@webspatial/react-sdk'

enableDebugTool()

export default function BasicTransform() {
  const style = {
    width: '300px',
    height: '300px',
    backgroundColor: 'green',
    '--xr-back': '10px',
    transform: '  rotateZ(40deg) ',
  }
  const ref = React.useRef<HTMLDivElement>(null)
  return (
    <div className="p-10 text-white">
      <h1 className="text-2xl mb-4">Basic Transform</h1>
      <div className="flex flex-col gap-4">
        <div>hello basic-transform</div>
        <div
          enable-xr
          style={style}
          className="rounded-lg shadow-xl"
          ref={ref}
          onSpatialTap={evt => {
            console.log(
              'dbg tap spatialdiv ',
              'offsetZ:',
              evt.offsetZ,

              ' offsetX:',
              evt.offsetX,
              ' offsetY:',
              evt.offsetY,
              ' clientX:',
              evt.clientX,
              ' clientY:',
              evt.clientY,
              ' clientZ:',
              evt.clientZ,
            )
          }}
        />
        <div>tail end</div>
      </div>
    </div>
  )
}
