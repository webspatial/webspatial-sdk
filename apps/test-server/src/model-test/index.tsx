import React, { CSSProperties, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  enableDebugTool,
  toSceneSpatial,
  Model,
  ModelRef,
  ModelSpatialTapEvent,
  ModelSpatialDragEvent,
  ModelSpatialDragEndEvent,
  ModelSpatialDragStartEvent,
  ModelSpatialRotateEvent,
  ModelSpatialMagnifyEvent,
  ModelLoadEvent,
} from '@webspatial/react-sdk'

enableDebugTool()

function ModelTest() {
  const dragTranslationRef = useRef({ x: 0, y: 0, z: 0 })
  const rotateRef = useRef({ x: 0, y: 0, z: 0 })
  const [scale, setScale] = useState(1)

  const style: CSSProperties = {
    width: '300px',
    height: '300px',
    position: 'relative',
    left: '50px',
    top: '10px',
    opacity: 0.81,
    display: 'block',
    visibility: 'visible',
    '--xr-back': '140px',
    transform: `scale(${scale})`,
    contentVisibility: 'visible',
  }

  const src = '/modelasset/cone.usdz'
  const refModel = useRef<ModelRef>(null)

  const onSpatialTap = (e: ModelSpatialTapEvent) => {
    console.log(
      'model onSpatialTap',
      e.currentTarget.getBoundingClientCube(),
      e.currentTarget.getBoundingClientRect(),
      e.detail.location3D,
      toSceneSpatial(e.detail.location3D, e.currentTarget),
      e.currentTarget.currentSrc,
    )
  }

  const onModelSpatialDragStart = (e: ModelSpatialDragStartEvent) => {
    dragTranslationRef.current = { x: 0, y: 0, z: 0 }
  }

  const onModelSpatialDrag = (e: ModelSpatialDragEvent) => {
    const delta = {
      x: e.detail.translation3D.x - dragTranslationRef.current.x,
      y: e.detail.translation3D.y - dragTranslationRef.current.y,
      z: e.detail.translation3D.z - dragTranslationRef.current.z,
    }
    refModel.current?.entityTransform.translateSelf(delta.x, delta.y, delta.z)
    dragTranslationRef.current = e.detail.translation3D
  }

  const onSpatialDragEnd = (e: ModelSpatialDragEndEvent) => {
    refModel.current?.entityTransform.setMatrixValue(
      'translateX(0px) translateY(0px) translateZ(0px)',
    )
  }

  const onSpatialRotate = (e: ModelSpatialRotateEvent) => {
    const quaternion = new THREE.Quaternion(
      e.detail.quaternion.x,
      e.detail.quaternion.y,
      e.detail.quaternion.z,
      e.detail.quaternion.w,
    )
    const euler = new THREE.Euler().setFromQuaternion(quaternion, 'YXZ')
    const x = (euler.x * 180) / Math.PI
    const y = (euler.y * 180) / Math.PI
    const z = (euler.z * 180) / Math.PI
    rotateRef.current = { x, y, z }
    refModel.current?.entityTransform.rotateSelf(x, y, z)
  }

  const onSpatialMagnify = (e: ModelSpatialMagnifyEvent) => {
    setScale(e.detail.magnification)
  }

  return (
    <Model
      enable-xr
      ref={refModel}
      style={style}
      src={src}
      onSpatialDragEnd={onSpatialDragEnd}
      onSpatialDragStart={onModelSpatialDragStart}
      onSpatialTap={onSpatialTap}
      onSpatialDrag={onModelSpatialDrag}
      onSpatialRotate={onSpatialRotate}
      onSpatialMagnify={onSpatialMagnify}
      onLoad={e => console.log('Model load success:', e)}
      onError={e => console.error('Model load error:', e)}
    />
  )
}

export default function ModelTestPage() {
  return (
    <div className="p-10 text-white">
      <h1 className="text-2xl mb-8 text-center">Model Test</h1>
      <div className="bg-[#1A1A1A] p-10 rounded-2xl border border-gray-800">
        <ModelTest />
      </div>
      <div className="mt-8 text-sm text-gray-500 text-center">
        Use spatial gestures to interact with the model: tap, drag, rotate, and
        magnify.
      </div>
    </div>
  )
}
