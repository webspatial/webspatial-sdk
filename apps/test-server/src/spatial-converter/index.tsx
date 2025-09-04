import ReactDOM from 'react-dom/client'

import {
  enableDebugTool,
  // Spatialized2DElementContainer,
  SpatializedStatic3DElementContainer,
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
    // '--xr-back': '400px',
    // transform: 'translateX(100px) rotateY(30deg)',
    // display: 'none',
    contentVisibility: 'visible',
  }

  const src = 'http://localhost:5173/public/modelasset/cone.usdz'

  const refModel = useRef<HTMLElement>(null)

  ;(window as any).refModel = refModel
  return (
    <div>
      <SpatializedStatic3DElementContainer
        ref={refModel}
        style={style}
        src={src}
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
    // transform: 'rotateX(30deg)',
    // display: 'none',
    contentVisibility: 'visible',
    overflow: 'scroll',
  }

  const style2: CSSProperties = {
    ...style,
    transform: 'rotateZ(0deg)',
  }

  const childStyle: CSSProperties = {
    position: 'relative',
    // top: '-10px',
    // left: '-40px',
    width: '400px',
    height: '600px',
    '--xr-back': '200px',
    background: 'blue',
  }

  const ref = useRef<HTMLElement>(null)

  ;(window as any).ref = ref

  return (
    <>
      <div style={{ width: '100px', height: '100px' }}>
        Start of SpatializedContainer
      </div>
      <div enable-xr data-name="parent" style={style} ref={ref} id="parent">
        this is spatialdiv
        <a href="https://www.baidu.com">this is a link</a>
        {/* <div enable-xr style={childStyle} data-name="child">
          this is child spatialdiv
        </div>
        <Model /> */}
        <button>this is a button</button>
      </div>
      <div> End of SpatializedContainer </div>

      <div> End of Model SpatializedContainer </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
