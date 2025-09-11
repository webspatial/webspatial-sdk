import ReactDOM from 'react-dom/client'

import {
  enableDebugTool,
  SpatialTapEvent,
  SpatialDragEvent,
  SpatialRotateEndEvent,
  SpatialRotateStartEvent,
  // SpatialMagnifyEndEvent,
  SpatializedStatic3DElementContainer,
  SpatializedElementRef,
  SpatializedStatic3DElementRef,
  SpatialMagnifyEvent,
  toSceneSpatial,
  SpatialDragEndEvent,
  // toLocalSpace,
} from '@webspatial/react-sdk'
import { CSSProperties, useRef } from 'react'

enableDebugTool()

function Model() {
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
    // transform: 'translateX(100px) rotateX(30deg)',
    // display: 'none',
    contentVisibility: 'visible',
  }

  const src = 'http://localhost:5173/public/modelasset/cone.usdz'

  const refModel = useRef<SpatializedStatic3DElementRef>(null)

  const onSpatialTap = (e: SpatialTapEvent) => {
    console.log(
      'model onSpatialTap',
      e.currentTarget.getBoundingClientCube(),
      e.currentTarget.getBoundingClientRect(),
      e.detail.location3D,
      toSceneSpatial(e.detail.location3D, e.currentTarget),
      (e.currentTarget as SpatializedStatic3DElementRef).src,
    )
  }

  const onSpatialDragStart = (e: SpatialDragEvent) => {
    console.log(
      'model onSpatialDragStart',
      e.isTrusted,
      e.currentTarget.getBoundingClientCube(),
    )
  }

  const onSpatialDrag = (e: SpatialDragEvent) => {
    console.log(
      'model onSpatialDrag',
      e.isTrusted,
      e.currentTarget.getBoundingClientCube(),
    )
  }

  const onSpatialDragEnd = (e: SpatialDragEndEvent) => {
    console.log(
      'model onSpatialDragEnd',
      e.isTrusted,
      e.currentTarget.getBoundingClientCube(),
    )
  }

  const onSpatialRotateEnd = (e: SpatialRotateEndEvent) => {
    console.log(
      'model onSpatialRotateEnd:',
      e.detail,
      e.isTrusted,
      e.currentTarget.getBoundingClientCube(),
    )
  }

  const onSpatialRotateStart = (e: SpatialRotateStartEvent) => {
    console.log(
      'model onSpatialRotateStart:',
      e.detail,
      e.isTrusted,
      e.currentTarget.getBoundingClientCube(),
    )
  }

  const onSpatialMagnifyStart = (e: SpatialMagnifyEvent) => {
    console.log(
      'model onSpatialMagnifyStart:',
      e.detail,
      e.isTrusted,
      e.currentTarget.getBoundingClientCube(),
    )
  }

  ;(window as any).refModel = refModel
  return (
    <div>
      <SpatializedStatic3DElementContainer
        ref={refModel}
        style={style}
        src={src}
        onSpatialDragEnd={onSpatialDragEnd}
        onSpatialDragStart={onSpatialDragStart}
        onSpatialTap={onSpatialTap}
        onSpatialDrag={onSpatialDrag}
        onSpatialRotateStart={onSpatialRotateStart}
        onSpatialRotateEnd={onSpatialRotateEnd}
        onSpatialMagnifyStart={onSpatialMagnifyStart}
      />
    </div>
  )
}

function App() {
  // const placeHolderContent = <div>this is spatialdiv</div>
  const style: CSSProperties = {
    width: '800px',
    height: '200px',
    position: 'relative',
    left: '0px',
    top: '0px',
    opacity: 0.81,
    display: 'block',
    visibility: 'visible',
    background: 'green',
    borderRadius: '10px',
    '--xr-background-material': 'translucent',
    '--xr-back': '10px',
    '--xr-depth': '150px',
    // transform: 'rotate3d(0, 1, 1, 45deg)',
    // display: 'none',
    contentVisibility: 'visible',
    overflow: 'scroll',
  }

  // const style2: CSSProperties = {
  //   ...style,
  //   transform: 'rotateZ(0deg)',
  // }

  const childStyle: CSSProperties = {
    position: 'relative',
    // top: '-10px',
    // left: '-40px',
    width: '400px',
    height: '600px',
    '--xr-back': '200px',
    background: 'blue',
  }

  const ref = useRef<SpatializedElementRef<HTMLDivElement>>(null)

  ;(window as any).ref = ref

  const refChild = useRef<SpatializedElementRef<HTMLDivElement>>(null)
  ;(window as any).refChild = refChild

  const onSpatialTap = (e: SpatialTapEvent) => {
    console.log('child:', e.isTrusted, e.currentTarget.getBoundingClientCube())
  }

  const onSpatialDrag = (e: SpatialDragEvent) => {
    console.log(
      'child onSpatialDrag:',
      e.isTrusted,
      e.currentTarget.getBoundingClientCube(),
    )
  }

  const onSpatialDragEnd = (e: SpatialDragEvent) => {
    console.log(
      'child onSpatialDrag End:',
      e.isTrusted,
      e.currentTarget.getBoundingClientCube(),
    )
  }

  return (
    <>
      <div style={{ width: '100px', height: '100px' }}>
        Start of SpatializedContainer
      </div>
      <div
        enable-xr
        // onSpatialDrag={onSpatialDrag}
        // onSpatialDragEnd={onSpatialDragEnd}
        onSpatialTap={onSpatialTap}
        data-name="parent"
        style={style}
        ref={ref}
        id="parent"
      >
        this is spatialdiv
        <a href="https://www.baidu.com">this is a link</a>
        <div
          enable-xr
          onSpatialDrag={onSpatialDrag}
          onSpatialDragEnd={onSpatialDragEnd}
          style={childStyle}
          ref={refChild}
          data-name="child"
        >
          this is child spatialdiv
        </div>
        <button>this is a button</button>
      </div>
      <div> End of SpatializedContainer </div>
      <Model />
      <div> End of Model SpatializedContainer </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
