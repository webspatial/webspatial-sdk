import React, { useRef, useState } from 'react'
import { enableDebugTool, type SpatialDragEvent } from '@webspatial/react-sdk'

enableDebugTool()

export default function GestureDiv() {
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 })
  const dragStartPos = useRef({ x: 0, y: 0, z: 0 })

  const onSpatialDragStart = () => {
    dragStartPos.current = pos
    console.log(
      '🚀 ~ onSpatialDragStart ~ dragStartPos.current:',
      dragStartPos.current,
    )
  }

  const onSpatialDrag = (evt: SpatialDragEvent) => {
    const newPos = {
      x: dragStartPos.current.x + evt.detail.translation3D.x,
      y: dragStartPos.current.y + evt.detail.translation3D.y,
      z: dragStartPos.current.z + evt.detail.translation3D.z,
    }
    console.log('🚀 ~ onSpatialDrag ~ newPos:', newPos)
    setPos(newPos)
  }

  const onSpatialDragEnd = () => {
    dragStartPos.current = pos
    console.log(
      '🚀 ~ onSpatialDragEnd ~ dragStartPos.current:',
      dragStartPos.current,
    )
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
            '--xr-back': '0px',
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
