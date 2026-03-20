import ReactDOM from 'react-dom/client'

import { enableDebugTool, Model, ModelRef } from '@webspatial/react-sdk'
import { useEffect, useRef, useState, RefObject } from 'react'
import { useLogger, Logger } from './Logger'

enableDebugTool()

function App() {
  const modelRef = useRef<ModelRef | null>(null)
  const [logs, logLine, clearLog] = useLogger()
  const [transform, setTransform] = useState('')
  const [dragTranslation, setDragTranslation] = useState({ x: 0, y: 0, z: 0 })
  const [isPaused, setIsPaused] = useState(true)
  useEffect(() => {
    modelRef.current!.ready?.then(() => logLine('ref.current.ready success'))
  }, [logLine])
  useEffect(() => {
    const id = setInterval(
      () => setIsPaused(modelRef.current?.paused ?? true),
      200,
    )
    return () => clearInterval(id)
  }, [setIsPaused])

  return (
    <div className="prose max-w-none">
      <CSSTransform onChange={setTransform} />
      <EntityTransform model={modelRef} />
      <Model
        className="block"
        src="/modelasset/cone.usdz"
        autoplay
        loop
        enable-xr
        style={{
          height: '200px',
          '--xr-depth': '300px',
          '--xr-back': '50px',
          transform,
        }}
        ref={modelRef}
        onError={e => logLine(`Model error ${modelRef.current?.currentSrc}`)}
        onLoad={e => logLine(`Model success ${modelRef.current?.currentSrc}`)}
        onSpatialTap={e => {
          logLine('model onSpatialTap', e.detail.location3D)
        }}
        onSpatialDragStart={e => setDragTranslation({ x: 0, y: 0, z: 0 })}
        onSpatialDrag={e => {
          const delta = {
            x: e.detail.translation3D.x - dragTranslation.x,
            y: e.detail.translation3D.y - dragTranslation.y,
            z: e.detail.translation3D.z - dragTranslation.z,
          }
          entityTransform(modelRef, e =>
            e.translateSelf(delta.x, delta.y, delta.z),
          )
          setDragTranslation(e.detail.translation3D)
        }}
        onSpatialDragEnd={e => {
          entityTransform(modelRef, e =>
            e.setMatrixValue('translate3d(0, 0, 0)'),
          )
          setDragTranslation({ x: 0, y: 0, z: 0 })
        }}
      >
        <source src="/modelasset/Fox_animated.glb" type="model/gltf-binary" />
        <source
          src="https://developer.apple.com/augmented-reality/quick-look/models/biplane/toy_biplane_realistic.usdz"
          type="model/vnd.usdz+zip"
        />
        <source
          src="https://webkit.org/demos/model-demos/models/stopwatch.usdz"
          type="model/vnd.usdz+zip"
        />
        <img
          src="/modelasset/cone.png"
          className="w-full h-[200px] object-contain"
        />
      </Model>
      <section className="playbackControls">
        <button
          className="btn btn-success m-1"
          onClick={() => modelRef.current?.play()}
        >
          |▶
        </button>
        <button
          className="btn btn-info  m-1"
          onClick={() => modelRef.current?.pause()}
        >
          ⏸
        </button>
        <span className="m-1">
          Duration {modelRef.current?.duration?.toFixed(2)}s, Paused:{' '}
          {`${isPaused}`}
        </span>
      </section>
      <Logger logs={logs} clearLog={clearLog} />
    </div>
  )
}

type CSSTransformProps = { onChange: (transform: string) => void }
function CSSTransform({ onChange }: CSSTransformProps) {
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [translateZ, setTranslateZ] = useState(0)

  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [rotateZ, setRotateZ] = useState(0)

  const [scaleX, setScaleX] = useState(1)
  const [scaleY, setScaleY] = useState(1)
  const [scaleZ, setScaleZ] = useState(1)

  useEffect(() => {
    const transformParts = [
      `translate3d(${translateX}px, ${translateY}px, ${translateZ}px)`,
      `scale3d(${scaleX}, ${scaleY}, ${scaleZ})`,
      `rotateX(${rotateX}deg)`,
      `rotateY(${rotateY}deg)`,
      `rotateZ(${rotateZ}deg)`,
    ]
    onChange(transformParts.join(' '))
  }, [
    translateX,
    translateY,
    translateZ,
    rotateX,
    rotateY,
    rotateZ,
    scaleX,
    scaleY,
    scaleZ,
  ])

  return (
    <section>
      <h3 className="m-0">CSS Transform</h3>
      <p className="p-0 m-0">
        <NumberInput
          label="translateX"
          value={translateX}
          setValue={setTranslateX}
          step={10}
        />
        <NumberInput
          label="translateY"
          value={translateY}
          setValue={setTranslateY}
          step={10}
        />
        <NumberInput
          label="translateZ"
          value={translateZ}
          setValue={setTranslateZ}
          step={10}
        />
        <NumberInput
          label="rotateX"
          value={rotateX}
          setValue={setRotateX}
          step={5}
        />
        <NumberInput
          label="rotateY"
          value={rotateY}
          setValue={setRotateY}
          step={5}
        />
        <NumberInput
          label="rotateZ"
          value={rotateZ}
          setValue={setRotateZ}
          step={5}
        />
        <NumberInput
          label="scaleX"
          value={scaleX}
          setValue={setScaleX}
          step={0.1}
        />
        <NumberInput
          label="scaleY"
          value={scaleY}
          setValue={setScaleY}
          step={0.1}
        />
        <NumberInput
          label="scaleZ"
          value={scaleZ}
          setValue={setScaleZ}
          step={0.1}
        />
        <button
          className="btn btn-error btn-outline btn-sm"
          onClick={e => {
            setTranslateX(0)
            setTranslateY(0)
            setTranslateZ(0)
            setRotateX(0)
            setRotateY(0)
            setRotateZ(0)
            setScaleX(1)
            setScaleY(1)
            setScaleZ(1)
          }}
        >
          ❌
        </button>
      </p>
    </section>
  )
}

function entityTransform(
  ref: RefObject<ModelRef>,
  cb: (e: DOMMatrix) => DOMMatrixReadOnly,
) {
  let current = ref.current
  if (current === null) return
  current.entityTransform = cb(DOMMatrix.fromMatrix(current.entityTransform))
}

function EntityTransform({ model }: { model: RefObject<ModelRef> }) {
  return (
    <section>
      <h3 className="m-0">Entity Transform</h3>
      <p className="p-0">
        <Toggle
          label="translateX"
          step={10}
          setValue={val => entityTransform(model, e => e.translate(val, 0, 0))}
        />
        <Toggle
          label="translateY"
          step={10}
          setValue={val => entityTransform(model, e => e.translate(0, val, 0))}
        />
        <Toggle
          label="translateZ"
          step={10}
          setValue={val => entityTransform(model, e => e.translate(0, 0, val))}
        />
        <Toggle
          label="rotateX"
          step={5}
          setValue={val => entityTransform(model, e => e.rotate(val, 0, 0))}
        />
        <Toggle
          label="rotateY"
          step={5}
          setValue={val => entityTransform(model, e => e.rotate(0, val, 0))}
        />
        <Toggle
          label="rotateZ"
          step={5}
          setValue={val => entityTransform(model, e => e.rotate(0, 0, val))}
        />
        <Toggle
          label="scaleX"
          step={0.1}
          setValue={val => entityTransform(model, e => e.scale(1 + val, 1, 1))}
        />
        <Toggle
          label="scaleY"
          step={0.1}
          setValue={val => entityTransform(model, e => e.scale(1, 1 + val, 1))}
        />
        <Toggle
          label="scaleZ"
          step={0.1}
          setValue={val => entityTransform(model, e => e.scale(1, 1, 1 + val))}
        />
        <button
          className="btn btn-error btn-outline btn-sm"
          onClick={e => {
            const resetCSS = `translate3d(0, 0, 0) scale3d(1, 1, 1) rotateX(0) rotateY(0) rotateZ(0)`
            entityTransform(model, e => e.setMatrixValue(resetCSS))
          }}
        >
          ❌
        </button>
      </p>
    </section>
  )
}

type InputProps = {
  label: string
  step: number
  value: number
  setValue: (val: number) => void
}
function NumberInput({ label, value, setValue, step }: InputProps) {
  return (
    <span className="m-1 inline-block">
      <label>{label}:</label>
      <button
        className="btn btn-neutral btn-sm"
        onClick={() => setValue(value - step)}
      >
        -
      </button>
      <input
        className="input input-sm input-bordered w-16"
        type="number"
        step={step}
        value={value}
        onChange={e => setValue(parseFloat(e.currentTarget.value))}
      />
      <button
        className="btn btn-neutral btn-sm"
        onClick={() => setValue(value + step)}
      >
        +
      </button>{' '}
    </span>
  )
}

type ToggleProps = {
  label: string
  step: number
  setValue: (delta: number) => void
}
function Toggle({ label, setValue, step }: ToggleProps) {
  return (
    <span className="m-1 inline-block">
      <button className="btn btn-neutral btn-sm" onClick={e => setValue(-step)}>
        -
      </button>
      <label>{label}</label>
      <button className="btn btn-neutral btn-sm" onClick={e => setValue(step)}>
        +
      </button>{' '}
    </span>
  )
}

export default App
