import ReactDOM from 'react-dom/client'

import {
  enableDebugTool,
  toSceneSpatial,
  Model,
  ModelRef,
} from '@webspatial/react-sdk'
import { useRef, useState } from 'react'
import { useLogger, Logger } from './Logger'

enableDebugTool()

function App() {
  const modelRef = useRef<ModelRef>(null)
  const entityTransform = modelRef.current?.entityTransform
  const [loadCount, setLoadCount] = useState(0)
  const [logs, logLine, clearLog] = useLogger()

  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [translateZ, setTranslateZ] = useState(0)

  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [rotateZ, setRotateZ] = useState(0)

  const [scaleX, setScaleX] = useState(1)
  const [scaleY, setScaleY] = useState(1)
  const [scaleZ, setScaleZ] = useState(1)

  const [dragTranslation, setDragTranslation] = useState({ x: 0, y: 0, z: 0 })

  return (
    <div>
      <h1>Static 3D model test</h1>
      <section>
        <h3>CSS Transform</h3>
        <p>
          <Input label="translateX" value={translateX} setValue={setTranslateX} step={10} />
          <Input label="translateY" value={translateY} setValue={setTranslateY} step={10} />
          <Input label="translateZ" value={translateZ} setValue={setTranslateZ} step={10} />
          <Input label="rotateX" value={rotateX} setValue={setRotateX} step={5} />
          <Input label="rotateY" value={rotateY} setValue={setRotateY} step={5} />
          <Input label="rotateZ" value={rotateZ} setValue={setRotateZ} step={5} />
          <Input label="scaleX" value={scaleX} setValue={setScaleX} step={0.1} />
          <Input label="scaleY" value={scaleY} setValue={setScaleY} step={0.1} />
          <Input label="scaleZ" value={scaleZ} setValue={setScaleZ} step={0.1} />
          <button onClick={e => {
            setTranslateX(0)
            setTranslateY(0)
            setTranslateZ(0)
            setRotateX(0)
            setRotateY(0)
            setRotateZ(0)
            setScaleX(1)
            setScaleY(1)
            setScaleZ(1)
          }}>❌</button>
        </p>
      </section>
      <section>
        <h3>Entity Transform</h3>
        <p>
          <Toggle label='translateX' step={10} setValue={val => entityTransform?.translateSelf(val, 0, 0)} />
          <Toggle label='translateY' step={10} setValue={val => entityTransform?.translateSelf(0, val, 0)} />
          <Toggle label='translateZ' step={10} setValue={val => entityTransform?.translateSelf(0, 0, val)} />
          <Toggle label='rotateX' step={5} setValue={val => entityTransform?.rotateSelf(val, 0, 0)} />
          <Toggle label='rotateY' step={5} setValue={val => entityTransform?.rotateSelf(0, val, 0)} />
          <Toggle label='rotateZ' step={5} setValue={val => entityTransform?.rotateSelf(0, 0, val)} />
          <Toggle label='scaleX' step={0.1} setValue={val => entityTransform?.scaleSelf(1 + val, 1, 1)} />
          <Toggle label='scaleY' step={0.1} setValue={val => entityTransform?.scaleSelf(1, 1 + val, 1)} />
          <Toggle label='scaleZ' step={0.1} setValue={val => entityTransform?.scaleSelf(1, 1, 1 + val)} />
          <button onClick={e => {
            const resetCSS = `translate3d(0, 0, 0) scale3d(1, 1, 1) rotateX(0) rotateY(0) rotateZ(0)`
            entityTransform?.setMatrixValue(resetCSS)
          }}>❌</button>
        </p>
      </section>

      <Model
        src={'/public/modelasset/cone.usdz'}
        enable-xr
        style={{
          width: '800px',
          height: '200px',
          '--xr-depth': '100px',
          '--xr-back': '100px',
          transform: `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) scale3d(${scaleX}, ${scaleY}, ${scaleZ}) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
        }}
        ref={modelRef}
        onError={e => logLine(`Model load error`)}
        onLoad={e => {
          logLine(`Model load success ${modelRef?.current?.currentSrc}`)
          setLoadCount(loadCount + 1)
        }}
        onSpatialTap={e => {
          logLine(
            'model onSpatialTap',
            e.currentTarget.getBoundingClientCube(),
            e.detail.location3D,
          )
        }}
        onSpatialDragStart={e => setDragTranslation({ x: 0, y: 0, z: 0 })}
        onSpatialDrag={e => {
          const delta = {
            x: e.detail.translation3D.x - dragTranslation.x,
            y: e.detail.translation3D.y - dragTranslation.y,
            z: e.detail.translation3D.z - dragTranslation.z,
          }
          modelRef.current?.entityTransform.translateSelf(
            delta.x,
            delta.y,
            delta.z,
          )

          setDragTranslation(e.detail.translation3D)
        }}
        onSpatialDragEnd={e => {
          modelRef.current?.entityTransform.setMatrixValue(
            'translateX(0px) translateY(0px) translateZ(0px)',
          )
          setDragTranslation({ x: 0, y: 0, z: 0 })
        }}
      />
      <p>{loadCount}</p>
      <Logger logs={logs} clearLog={clearLog} />
    </div>
  )
}

type InputProps = {
  label: string
  step: number
  value: number
  setValue: (val: number) => void
}
function Input({ label, value, setValue, step }: InputProps) {
  return (
    <label>
      {label}:
      <input
        type="number"
        step={step}
        value={value}
        size={5}
        onChange={e => setValue(parseFloat(e.currentTarget.value))}
        style={{ width: '3em', margin: '0 1em 0 0.5em' }}
      />{' '}
    </label>
  )
}

type ToggleProps = {
  label: string
  step: number
  setValue: (delta: number) => void
}
function Toggle({ label, setValue, step }: ToggleProps) {
  return (
    <span style={{ marginRight: '1em' }}>
      <label>{label}</label>
      <button onClick={e => setValue(-step)}>-</button>{' '}
      <button onClick={e => setValue(step)}>+</button>{' '}
    </span>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
