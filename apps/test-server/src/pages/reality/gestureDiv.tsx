import React, { useRef, useState } from 'react'
import { enableDebugTool, type SpatialDragEvent } from '@webspatial/react-sdk'

enableDebugTool()

export default function GestureDiv() {
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 })
  const lastTranslation = useRef({ x: 0, y: 0, z: 0 })

  const onSpatialDragStart = () => {
    lastTranslation.current = { x: 0, y: 0, z: 0 }
  }

  const onSpatialDrag = (evt: SpatialDragEvent) => {
    const deltaX = evt.detail.translation3D.x - lastTranslation.current.x
    const deltaY = evt.detail.translation3D.y - lastTranslation.current.y
    const deltaZ = evt.detail.translation3D.z - lastTranslation.current.z

    lastTranslation.current = evt.detail.translation3D

    setPos(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
      z: prev.z + deltaZ,
    }))
  }

  const onSpatialDragEnd = () => {
    lastTranslation.current = { x: 0, y: 0, z: 0 }
  }

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-2">Gesture Div</h1>
      <div className="text-sm text-gray-400 mb-6">
        Drag the green spatial div to move it. Translation is applied via CSS
        transform translate3d.
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          className="select-none px-4 py-2 text-sm font-semibold rounded-lg border border-gray-700 hover:text-white bg-gray-700 hover:bg-gray-600"
          onClick={() => setPos({ x: 0, y: 0, z: 0 })}
        >
          Reset
        </button>
        <div className="text-xs text-gray-400 font-mono">
          x: {pos.x.toFixed(2)} px, y: {pos.y.toFixed(2)} px, z:{' '}
          {pos.z.toFixed(2)} px
        </div>
      </div>

      <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-[#111] h-[520px]">
        <div
          enable-xr
          className="select-none flex items-center justify-center font-semibold rounded-xl cursor-grab active:cursor-grabbing"
          style={{
            width: 260,
            height: 160,
            background: '#22cc66',
            color: '#071a0e',
            '--xr-back': '80px',
            transform: `translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)`,
            touchAction: 'none',
            userSelect: 'none',
          }}
          onSpatialDragStart={onSpatialDragStart}
          onSpatialDrag={onSpatialDrag}
          onSpatialDragEnd={onSpatialDragEnd}
        >
          Drag Me
        </div>
      </div>
    </div>
  )
}
