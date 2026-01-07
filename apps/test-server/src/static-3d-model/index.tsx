import ReactDOM from 'react-dom/client'

import { enableDebugTool, Model, ModelRef } from '@webspatial/react-sdk'
import { useRef, useState } from 'react'

enableDebugTool()

function App() {
  const modelRef = useRef<ModelRef>(null)
  const [loadStatus, setLoadStatus] = useState('')
  const [loadCount, setLoadCount] = useState(0)

  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [translateZ, setTranslateZ] = useState(0)

  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [rotateZ, setRotateZ] = useState(0)

  const [scaleX, setScaleX] = useState(1)
  const [scaleY, setScaleY] = useState(1)
  const [scaleZ, setScaleZ] = useState(1)

  return (
    <div>
      <h1>Static 3D model test</h1>
      <p>
        <label>
          translateX:
          <input
            type="number"
            step={10}
            value={translateX}
            onChange={e => setTranslateX(parseInt(e.currentTarget.value))}
          />
        </label>{' '}
        <label>
          translateY:
          <input
            type="number"
            step={10}
            value={translateY}
            onChange={e => setTranslateY(parseInt(e.currentTarget.value))}
          />
        </label>{' '}
        <label>
          translateZ:
          <input
            type="number"
            step={10}
            value={translateZ}
            onChange={e => setTranslateZ(parseInt(e.currentTarget.value))}
          />
        </label>
      </p>

      <p>
        <label>
          rotateX:
          <input
            type="number"
            step={5}
            value={rotateX}
            onChange={e => setRotateX(parseInt(e.currentTarget.value))}
          />
        </label>{' '}
        <label>
          rotateY:
          <input
            type="number"
            step={5}
            value={rotateY}
            onChange={e => setRotateY(parseInt(e.currentTarget.value))}
          />
        </label>{' '}
        <label>
          rotateZ:
          <input
            type="number"
            step={5}
            value={rotateZ}
            onChange={e => setRotateZ(parseInt(e.currentTarget.value))}
          />
        </label>
      </p>

      <p>
        <label>
          scaleX:
          <input
            type="number"
            step={0.1}
            value={scaleX}
            onChange={e => setScaleX(parseFloat(e.currentTarget.value))}
          />
        </label>{' '}
        <label>
          scaleY:
          <input
            type="number"
            step={0.1}
            value={scaleY}
            onChange={e => setScaleY(parseFloat(e.currentTarget.value))}
          />
        </label>{' '}
        <label>
          scaleZ:
          <input
            type="number"
            step={0.1}
            value={scaleZ}
            onChange={e => setScaleZ(parseFloat(e.currentTarget.value))}
          />
        </label>
      </p>

      <Model
        enable-xr
        style={{
          width: '800px',
          height: '200px',
          '--xr-depth': '100px',
          '--xr-back': '100px',
          transform: `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) scale3d(${scaleX}, ${scaleY}, ${scaleZ}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
        }}
        src={'/public/modelasset/cone.usdz'}
        ref={modelRef}
        onError={event => {
          setLoadStatus(`Model load error`)
        }}
        onLoad={event => {
          setLoadStatus('Model load success')
          setLoadCount(loadCount + 1)
        }}
      />
      <p>
        {loadStatus} {loadCount}
      </p>
      <p>modelRef {modelRef?.current?.currentSrc}</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
