import React from 'react'
import { enableDebugTool } from '@webspatial/react-sdk'
import AudioTest from './AudioTest'

enableDebugTool()

export default function CanvasTest() {
  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-8">Canvas & Media Test</h1>
      <div
        enable-xr
        style={{
          width: '80%',
          height: '600px',
          '--xr-background-material': 'translucent',
          '--xr-back': 300,
        }}
        className="mx-auto rounded-2xl bg-[#1A1A1A] p-6"
      >
        <AudioTest />
      </div>
    </div>
  )
}
