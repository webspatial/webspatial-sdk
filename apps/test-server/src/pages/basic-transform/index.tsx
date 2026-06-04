import { enableDebugTool } from '@webspatial/react-sdk'
import React from 'react'
import './basictransform.css'

enableDebugTool()

export default function BasicTransform() {
  const style: React.CSSProperties = {
    width: '300px',
    height: '300px',
    backgroundColor: 'green',
  }
  const ref = React.useRef<HTMLHeadingElement>(null)
  return (
    <div className="p-10 text-white max-w-2xl">
      <h1 className="text-2xl mb-4">Basic Transform</h1>
      <p className="text-gray-400 text-sm mb-6">
        The green panel is an{' '}
        <code className="text-gray-200">h1 enable-xr</code> styled only via{' '}
        <code className="text-gray-200">basictransform.css</code> (
        <code className="text-gray-200">
          h1.basicTransform {'{ transform }'}
        </code>
        ). In spatial runtime the transform should appear on the 3D slab; edit
        the CSS file and reload to iterate.
      </p>
      <div className="flex flex-col gap-4">
        <h1
          enable-xr
          style={style}
          className="rounded-lg shadow-xl basicTransform"
          ref={ref}
          data-name="basic-transform-h1"
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
        <div className="text-gray-500 text-sm">tail end</div>
      </div>
    </div>
  )
}
