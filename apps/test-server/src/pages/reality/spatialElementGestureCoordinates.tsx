import {
  convertCoordinate,
  Model,
  type ModelSpatialDragEvent,
  type ModelSpatialDragStartEvent,
  type ModelSpatialRotateEvent,
  type ModelSpatialTapEvent,
  type SpatialDragEvent,
  type SpatialDragStartEvent,
  type SpatialRotateEvent,
  type SpatialTapEvent,
} from '@webspatial/react-sdk'
import { type Dispatch, type SetStateAction, useRef, useState } from 'react'
import { applyParentRotation } from './gestureRotation'

type Vec3 = { x: number; y: number; z: number }
type Quaternion = Vec3 & { w: number }
type TargetKind = 'SpatialDiv' | 'Model'

type Result = {
  tap: Vec3 | null
  tapClient: Vec3 | null
  dragStart: Vec3 | null
  dragStartClient: Vec3 | null
  drag: Vec3 | null
  dragWindow: Vec3 | null
  rotation: Quaternion | null
}

const emptyResult = (): Result => ({
  tap: null,
  tapClient: null,
  dragStart: null,
  dragStartClient: null,
  drag: null,
  dragWindow: null,
  rotation: null,
})

const initialPosition = { x: 0, y: 0, z: 0 }
const initialTargetRotation = { x: 20, y: 0, z: 0 }
const activeTargetStorageKey = 'spatial-element-gesture-active-target'
const parentTransform = 'rotateY(45deg) scale3d(1.5, 0.75, 1)'

function targetTransform(position: Vec3, rotation: Vec3) {
  return `translate3d(${position.x}px, ${position.y}px, ${position.z}px) rotateZ(${rotation.z}deg) rotateY(${rotation.y}deg) rotateX(${rotation.x}deg) scale3d(1.2, 0.8, 1)`
}

function fixed(value: number) {
  return Number.isFinite(value) ? value.toFixed(5) : String(value)
}

function formatVec3(value: Vec3 | null) {
  return value
    ? `(${fixed(value.x)}, ${fixed(value.y)}, ${fixed(value.z)})`
    : '—'
}

function rotationAxis(quaternion: Quaternion | null) {
  if (!quaternion) {
    return { axis: { x: 0, y: 0, z: 0 }, angleDegrees: 0 }
  }
  const vectorLength = Math.hypot(quaternion.x, quaternion.y, quaternion.z)
  if (vectorLength < 1e-7) {
    return { axis: { x: 0, y: 0, z: 0 }, angleDegrees: 0 }
  }
  return {
    axis: {
      x: quaternion.x / vectorLength,
      y: quaternion.y / vectorLength,
      z: quaternion.z / vectorLength,
    },
    angleDegrees:
      (2 * Math.atan2(vectorLength, Math.abs(quaternion.w)) * 180) / Math.PI,
  }
}

function horizontalWindowPass(value: Vec3 | null) {
  if (!value) return false
  return Math.abs(value.x) > 2 && Math.abs(value.y / value.x) < 0.25
}

function rotationParentLocalPass(value: Quaternion | null) {
  const info = rotationAxis(value)
  return (
    value != null &&
    info.angleDegrees > 0.5 &&
    Math.abs(info.axis.x) < 0.25 &&
    Math.abs(info.axis.y) < 0.25 &&
    Math.abs(info.axis.z) > 0.9
  )
}

function hitPass(
  value: Vec3 | null,
  width: number,
  height: number,
  depth: number,
) {
  return (
    value != null &&
    value.x >= -4 &&
    value.x <= width + 4 &&
    value.y >= -4 &&
    value.y <= height + 4 &&
    value.z >= -4 &&
    value.z <= depth + 4
  )
}

function axisOf(value: Vec3 | null) {
  if (!value) return null
  const length = Math.hypot(value.x, value.y, value.z)
  if (length < 1e-7) return { x: 0, y: 0, z: 0 }
  return { x: value.x / length, y: value.y / length, z: value.z / length }
}

function horizontalAxisOf(value: Vec3 | null) {
  if (!value) return null
  const length = Math.hypot(value.x, value.z)
  if (length < 1e-7) return { x: 0, y: 0, z: 0 }
  return { x: value.x / length, y: 0, z: value.z / length }
}

function ResultPanel({
  kind,
  result,
  width,
  height,
  depth,
}: {
  kind: TargetKind
  result: Result
  width: number
  height: number
  depth: number
}) {
  const tapPass = hitPass(result.tap, width, height, depth)
  const dragStartPass = hitPass(result.dragStart, width, height, depth)
  const dragPass = horizontalWindowPass(result.dragWindow)
  const rotatePass = rotationParentLocalPass(result.rotation)
  const dragAxis = axisOf(result.drag)
  const horizontalDragAxis = horizontalAxisOf(result.drag)
  const rotateInfo = rotationAxis(result.rotation)

  const verdict = (value: unknown, pass: boolean) =>
    value == null ? 'WAITING' : pass ? 'PASS' : 'CHECK'

  return (
    <section className="rounded-xl border border-gray-700 bg-[#171717] p-4 text-xs">
      <h2 className="mb-3 text-lg font-semibold">{kind}</h2>
      <div data-testid={`${kind}-tap-verdict`} className="mb-3">
        <strong>Tap: {verdict(result.tap, tapPass)}</strong>
        <div>offset CSS px: {formatVec3(result.tap)}</div>
        <div>client CSS px: {formatVec3(result.tapClient)}</div>
      </div>
      <div data-testid={`${kind}-drag-start-verdict`} className="mb-3">
        <strong>DragStart: {verdict(result.dragStart, dragStartPass)}</strong>
        <div>offset CSS px: {formatVec3(result.dragStart)}</div>
        <div>client CSS px: {formatVec3(result.dragStartClient)}</div>
      </div>
      <div data-testid={`${kind}-drag-verdict`} className="mb-3">
        <strong>Drag: {verdict(result.drag, dragPass)}</strong>
        <div>translation CSS px: {formatVec3(result.drag)}</div>
        <div>parent-local axis: {formatVec3(dragAxis)}</div>
        <div>parent-local X/Z axis: {formatVec3(horizontalDragAxis)}</div>
        <div>projected window delta: {formatVec3(result.dragWindow)}</div>
      </div>
      <div data-testid={`${kind}-rotation-verdict`}>
        <strong>Rotation: {verdict(result.rotation, rotatePass)}</strong>
        <div>parent-local axis: {formatVec3(rotateInfo.axis)}</div>
        <div>cumulative angle: {fixed(rotateInfo.angleDegrees)}°</div>
      </div>
    </section>
  )
}

export default function SpatialElementGestureCoordinates() {
  const [activeTarget, setActiveTarget] = useState<TargetKind>(() =>
    window.sessionStorage.getItem(activeTargetStorageKey) === 'Model'
      ? 'Model'
      : 'SpatialDiv',
  )
  const [divResult, setDivResult] = useState(emptyResult)
  const [modelResult, setModelResult] = useState(emptyResult)
  const [divPosition, setDivPosition] = useState(initialPosition)
  const [modelPosition, setModelPosition] = useState(initialPosition)
  const [divRotation, setDivRotation] = useState(initialTargetRotation)
  const [modelRotation, setModelRotation] = useState(initialTargetRotation)
  const divDragBase = useRef(initialPosition)
  const modelDragBase = useRef(initialPosition)
  const divRotateBase = useRef<Vec3 | null>(null)
  const modelRotateBase = useRef<Vec3 | null>(null)
  const divParentRef = useRef<HTMLDivElement>(null)
  const modelParentRef = useRef<HTMLDivElement>(null)

  const projectDragToWindow = async (
    parent: HTMLDivElement | null,
    drag: Vec3,
    update: Dispatch<SetStateAction<Result>>,
  ) => {
    if (!parent) return
    const [origin, endpoint] = await Promise.all([
      convertCoordinate({ x: 0, y: 0, z: 0 }, { from: parent, to: window }),
      convertCoordinate(drag, { from: parent, to: window }),
    ])
    update(value => ({
      ...value,
      dragWindow: {
        x: endpoint.x - origin.x,
        y: endpoint.y - origin.y,
        z: endpoint.z - origin.z,
      },
    }))
  }

  const point = (event: SpatialTapEvent | ModelSpatialTapEvent) => ({
    x: event.offsetX,
    y: event.offsetY,
    z: event.offsetZ,
  })
  const clientPoint = (event: SpatialTapEvent | ModelSpatialTapEvent) => ({
    x: event.clientX,
    y: event.clientY,
    z: event.clientZ,
  })
  const startPoint = (
    event: SpatialDragStartEvent | ModelSpatialDragStartEvent,
  ) => ({ x: event.offsetX, y: event.offsetY, z: event.offsetZ })
  const startClientPoint = (
    event: SpatialDragStartEvent | ModelSpatialDragStartEvent,
  ) => ({ x: event.clientX, y: event.clientY, z: event.clientZ })

  const reset = () => {
    setDivResult(emptyResult())
    setModelResult(emptyResult())
    setDivPosition(initialPosition)
    setModelPosition(initialPosition)
    setDivRotation(initialTargetRotation)
    setModelRotation(initialTargetRotation)
    divRotateBase.current = null
    modelRotateBase.current = null
  }

  const showTarget = (target: TargetKind) => {
    window.sessionStorage.setItem(activeTargetStorageKey, target)
    setActiveTarget(target)
  }

  return (
    <div className="min-h-full p-8 text-white">
      <h1 className="mb-2 text-2xl font-bold">
        SpatialDiv / Model Gesture Coordinates
      </h1>
      <p className="mb-4 max-w-5xl text-sm text-gray-300">
        Each target is nested under a SpatialDiv rotated 45° around Y and scaled
        (1.5, 0.75, 1). The targets also have their own X rotation and
        non-uniform scale. Tap and DragStart must be target-local CSS pixels.
        Horizontal Drag and parent-Z constrained Rotation must exclude the
        target's own transform and remain cumulative in the rotated direct
        parent coordinate system.
      </p>
      <ol className="mb-5 list-decimal space-y-1 pl-5 text-sm text-gray-300">
        <li>Tap each target once.</li>
        <li>Drag each target horizontally across the screen.</li>
        <li>Rotate each target around the constrained axis.</li>
      </ol>
      <div className="mb-5 flex gap-2">
        <button
          className={`btn btn-sm ${activeTarget === 'SpatialDiv' ? 'btn-success' : 'btn-neutral'}`}
          onClick={() => showTarget('SpatialDiv')}
        >
          Show nested SpatialDiv
        </button>
        <button
          className={`btn btn-sm ${activeTarget === 'Model' ? 'btn-success' : 'btn-neutral'}`}
          onClick={() => showTarget('Model')}
        >
          Show nested Model
        </button>
      </div>

      <div className="max-w-3xl">
        {activeTarget === 'SpatialDiv' && (
          <div
            ref={divParentRef}
            enable-xr
            data-name="SpatialDiv Gesture Parent"
            className="flex min-h-[260px] items-center justify-center rounded-xl border border-cyan-500/50 bg-cyan-950/20"
            style={{
              width: '100%',
              height: 260,
              '--xr-depth': '180px',
              '--xr-back': '40px',
              '--xr-background-material': 'thin',
              background: '#083344',
              transform: parentTransform,
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              enable-xr
              data-name="SpatialDiv Gesture Target"
              className="flex select-none items-center justify-center rounded-xl bg-green-500 font-bold text-green-950"
              style={{
                width: 220,
                height: 140,
                '--xr-depth': '80px',
                '--xr-back': '30px',
                transform: targetTransform(divPosition, divRotation),
                transformStyle: 'preserve-3d',
                touchAction: 'none',
              }}
              spatialEventOptions={{ constrainedToAxis: [0, 0, 1] }}
              onSpatialTap={event =>
                setDivResult(value => ({
                  ...value,
                  tap: point(event),
                  tapClient: clientPoint(event),
                }))
              }
              onSpatialDragStart={event => {
                divDragBase.current = divPosition
                setDivResult(value => ({
                  ...value,
                  dragStart: startPoint(event),
                  dragStartClient: startClientPoint(event),
                  drag: null,
                  dragWindow: null,
                }))
              }}
              onSpatialDrag={(event: SpatialDragEvent) => {
                const drag = event.detail.translation3D
                setDivResult(value => ({ ...value, drag }))
                void projectDragToWindow(
                  divParentRef.current,
                  drag,
                  setDivResult,
                )
                setDivPosition({
                  x: divDragBase.current.x + drag.x,
                  y: divDragBase.current.y + drag.y,
                  z: divDragBase.current.z + drag.z,
                })
              }}
              onSpatialRotate={(event: SpatialRotateEvent) => {
                setDivResult(value => ({
                  ...value,
                  rotation: event.quaternion,
                }))
                divRotateBase.current ??= divRotation
                setDivRotation(
                  applyParentRotation(divRotateBase.current, event.quaternion),
                )
              }}
              onSpatialRotateEnd={() => {
                divRotateBase.current = null
              }}
            >
              SpatialDiv target
            </div>
          </div>
        )}

        {activeTarget === 'Model' && (
          <div
            ref={modelParentRef}
            enable-xr
            data-name="Model Gesture Parent"
            className="flex min-h-[260px] items-center justify-center rounded-xl border border-violet-500/50 bg-violet-950/20"
            style={{
              width: '100%',
              height: 260,
              '--xr-depth': '180px',
              '--xr-back': '40px',
              '--xr-background-material': 'thin',
              background: '#2e1065',
              transform: parentTransform,
              transformStyle: 'preserve-3d',
            }}
          >
            <Model
              enable-xr
              data-name="Model Gesture Target"
              src="/modelasset/Duck.glb"
              poster="/img/toy_drummer.png"
              style={{
                width: 220,
                height: 180,
                '--xr-depth': '120px',
                '--xr-back': '30px',
                transform: targetTransform(modelPosition, modelRotation),
                transformStyle: 'preserve-3d',
                touchAction: 'none',
              }}
              spatialEventOptions={{ constrainedToAxis: [0, 0, 1] }}
              onSpatialTap={event =>
                setModelResult(value => ({
                  ...value,
                  tap: point(event),
                  tapClient: clientPoint(event),
                }))
              }
              onSpatialDragStart={event => {
                modelDragBase.current = modelPosition
                setModelResult(value => ({
                  ...value,
                  dragStart: startPoint(event),
                  dragStartClient: startClientPoint(event),
                  drag: null,
                  dragWindow: null,
                }))
              }}
              onSpatialDrag={(event: ModelSpatialDragEvent) => {
                const drag = event.detail.translation3D
                setModelResult(value => ({ ...value, drag }))
                void projectDragToWindow(
                  modelParentRef.current,
                  drag,
                  setModelResult,
                )
                setModelPosition({
                  x: modelDragBase.current.x + drag.x,
                  y: modelDragBase.current.y + drag.y,
                  z: modelDragBase.current.z + drag.z,
                })
              }}
              onSpatialRotate={(event: ModelSpatialRotateEvent) => {
                setModelResult(value => ({
                  ...value,
                  rotation: event.quaternion,
                }))
                modelRotateBase.current ??= modelRotation
                setModelRotation(
                  applyParentRotation(
                    modelRotateBase.current,
                    event.quaternion,
                  ),
                )
              }}
              onSpatialRotateEnd={() => {
                modelRotateBase.current = null
              }}
            />
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ResultPanel
          kind="SpatialDiv"
          result={divResult}
          width={220}
          height={140}
          depth={80}
        />
        <ResultPanel
          kind="Model"
          result={modelResult}
          width={220}
          height={180}
          depth={120}
        />
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Drag PASS projects the reported parent-local translation back through
        the parent and verifies a horizontal window-space delta. Rotation
        constraint [0, 0, 1] is interpreted in the target's pre-transform parent
        axes, so the returned parent-local axis is Z.
      </p>
      <button className="btn btn-sm btn-neutral mt-4" onClick={reset}>
        Reset all results
      </button>
    </div>
  )
}
