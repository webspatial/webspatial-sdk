import ReactDOM from 'react-dom/client'

import {
  enableDebugTool,
  SpatializedElementRef,
  Model,
  ModelRef,
} from '@webspatial/react-sdk'
import { CSSProperties, useRef } from 'react'

enableDebugTool()

function App() {
  const style: CSSProperties = {
    width: '300px',
    height: '300px',
    position: 'relative',
    left: '50px',
    top: '10px',
    opacity: 1.0,
    display: 'block',
    visibility: 'visible',
    '--xr-back': '140px',
    contentVisibility: 'visible',
  }

  return (
    <div>
      <Model enable-xr style={style} src={'cone.usdz'} />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
