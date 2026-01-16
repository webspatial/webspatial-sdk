import ReactDOM from 'react-dom/client'
import * as THREE from 'three'

import {
  enableDebugTool,
  toSceneSpatial,
  Model,
  ModelRef,
  ModelSpatialTapEvent,
  // ModelSpatialDragStartEvent,
  ModelSpatialDragEvent,
  ModelSpatialDragEndEvent,
  ModelSpatialRotateStartEvent,
  // ModelSpatialRotateEvent,
  ModelSpatialRotateEndEvent,
  ModelSpatialMagnifyEvent,
  ModelLoadEvent,
  // ModelSpatialMagnifyEndEvent,
  // toLocalSpace,
} from '@webspatial/react-sdk'
import { CSSProperties, useRef, useState } from 'react'

enableDebugTool()

function ModelTest() {
  const dragTranslationRef = useRef({
    x: 0,
    y: 0,
    z: 0,
  })

  const rotateRef = useRef({
    x: 0,
    y: 0,
    z: 0,
  })

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
    // background: 'blue',
    '--xr-back': '140px',
    transform: `scale(${scale})`,
    // transform: `translateX(${dragTranslation.x}px) translateY(${dragTranslation.y}px) translateZ(${dragTranslation.z}px)`,
    // display: 'none',
    contentVisibility: 'visible',
  }

  const src = '/public/modelasset/cone.usdz'

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

  const onSpatialDragStart = (e: ModelSpatialDragEvent) => {
    dragTranslationRef.current = { x: 0, y: 0, z: 0 }
  }

  const onSpatialDrag = (e: ModelSpatialDragEvent) => {
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

  const onSpatialRotate = (e: ModelSpatialRotateEndEvent) => {
    // console.log('model onSpatialRotateEnd:', e.detail.rotation)
    const quaternion = new THREE.Quaternion().fromArray(
      e.detail.rotation.vector,
    )
    const euler = new THREE.Euler().setFromQuaternion(quaternion, 'YXZ')
    const x = (euler.x * 180) / Math.PI
    const y = (euler.y * 180) / Math.PI
    const z = (euler.z * 180) / Math.PI

    const delta = {
      x: x - rotateRef.current.x,
      y: y - rotateRef.current.y,
      z: z - rotateRef.current.z,
    }

    rotateRef.current = {
      x: x,
      y: y,
      z: z,
    }

    refModel.current?.entityTransform.rotateSelf(x, y, z)

    console.log('model onSpatialRotate:', (euler.z * 180) / Math.PI)
  }

  const onSpatialRotateStart = (e: ModelSpatialRotateStartEvent) => {
    console.log('model onSpatialRotateStart:', e.detail.rotation)
    const quaternion = new THREE.Quaternion().fromArray(
      e.detail.rotation.vector,
    )
    const euler = new THREE.Euler().setFromQuaternion(quaternion, 'YXZ')
    rotateRef.current = {
      x: (euler.x * 180) / Math.PI,
      y: (euler.y * 180) / Math.PI,
      z: (euler.z * 180) / Math.PI,
    }
  }

  const onSpatialMagnify = (e: ModelSpatialMagnifyEvent) => {
    console.log('model onSpatialMagnify:', e.detail.magnification)
    setScale(e.detail.magnification)
  }

  ;(window as any).refModel = refModel

  const onLoad = (event: ModelLoadEvent) => {
    console.log('model onLoad', event, event.target.getBoundingClientCube())
  }

  const onError = (event: ModelLoadEvent) => {
    console.log('model onError', event, event.target.getBoundingClientCube())
  }

  return (
    <Model
      enable-xr
      ref={refModel}
      style={style}
      src={src}
      onSpatialDragEnd={onSpatialDragEnd}
      onSpatialDragStart={onSpatialDragStart}
      onSpatialTap={onSpatialTap}
      onSpatialDrag={onSpatialDrag}
      onSpatialRotateStart={onSpatialRotateStart}
      // onSpatialRotate={onSpatialRotate}
      onSpatialMagnify={onSpatialMagnify}
      // onLoad={onLoad}
      // onError={onError}
    />
  )
}

function App() {
  return (
    <>
      <div style={{ width: '100px', height: '100px' }}>
        Start of SpatializedContainer
      </div>
      <div className="flex justify-center ">
        <ModelTest />
      </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
