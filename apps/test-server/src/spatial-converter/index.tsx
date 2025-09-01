import ReactDOM from 'react-dom/client'

import {
  enableDebugTool,
  Spatialized2DElementContainer,
  SpatializedStatic3DElementContainer,
} from '@webspatial/react-sdk'
import { CSSProperties } from 'react'

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
  return (
    <div>
      <SpatializedStatic3DElementContainer style={style} src={src} />
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
    '--xr-back': '200px',
    // transform: 'translateX(100px) rotateY(30deg)',
    // display: 'none',
    contentVisibility: 'visible',
    overflow: 'scroll',
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

  return (
    <>
      <div style={{ width: '100px', height: '100px' }}>
        Start of SpatializedContainer
      </div>
      <Spatialized2DElementContainer
        data-name="parent"
        style={style}
        component="div"
      >
        this is spatialdiv
        <a href="https://www.baidu.com">this is a link</a>
        {/* <Spatialized2DElementContainer
          style={childStyle}
          data-name="child"
          component="div"
        >
          this is child spatialdiv
        </Spatialized2DElementContainer> */}
        <Model />
        <button>this is a button</button>
      </Spatialized2DElementContainer>
      <div> End of SpatializedContainer </div>

      <div> End of Model SpatializedContainer </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
