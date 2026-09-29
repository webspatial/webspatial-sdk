import {
  BoxEntity,
  convertCoordinate,
  Entity,
  type EntityRef,
  Reality,
  SceneGraph,
  UnlitMaterial,
} from '@webspatial/react-sdk'
import { useRef, useState } from 'react'
import { applyParentRotation } from './gestureRotation'

type Vec3 = { x: number; y: number; z: number }
type Quaternion = Vec3 & { w: number }

const parentRotation = { x: 0, y: 45, z: 0 }
const initialTargetRotation = { x: 0, y: 0, z: 20 }
const initialTargetPosition = { x: 0, y: 0, z: 0 }

function fixed(value: number) {
  return Number.isFinite(value) ? value.toFixed(5) : String(value)
}

function formatVec3(value: Vec3) {
  return `(${fixed(value.x)}, ${fixed(value.y)}, ${fixed(value.z)})`
}

function entityHitPass(value: Vec3 | null) {
  return (
    value != null &&
    Math.abs(value.x) <= 0.105 &&
    Math.abs(value.y) <= 0.085 &&
    Math.abs(value.z) <= 0.115
  )
}

function rotationAxis(quaternion: Quaternion) {
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

export default function EntityGestureCoordinates() {
  const [tap, setTap] = useState<Vec3 | null>(null)
  const [tapTarget, setTapTarget] = useState('none')
  const [dragStart, setDragStart] = useState<Vec3 | null>(null)
  const [rotation, setRotation] = useState<Quaternion | null>(null)
  const [targetRotation, setTargetRotation] = useState(initialTargetRotation)
  const [dragTranslation, setDragTranslation] = useState<Vec3 | null>(null)
  const [dragWindow, setDragWindow] = useState<Vec3 | null>(null)
  const [targetPosition, setTargetPosition] = useState(initialTargetPosition)
  const rotateBaseRef = useRef<typeof initialTargetRotation | null>(null)
  const dragBaseRef = useRef(initialTargetPosition)
  const parentRef = useRef<EntityRef>(null)
  const dragProjectionRequest = useRef(0)

  const tapPass = tapTarget === 'coordinateTarget' && entityHitPass(tap)
  const rotationInfo = rotationAxis(rotation ?? { x: 0, y: 0, z: 0, w: 1 })
  const dragStartPass = entityHitPass(dragStart)
  const rotationPass =
    rotation != null &&
    rotationInfo.angleDegrees > 0.5 &&
    Math.abs(rotationInfo.axis.x) > 0.55 &&
    Math.abs(rotationInfo.axis.x) < 0.85 &&
    Math.abs(rotationInfo.axis.y) < 0.3 &&
    Math.abs(rotationInfo.axis.z) > 0.55 &&
    Math.abs(rotationInfo.axis.z) < 0.85
  const dragLength = dragTranslation
    ? Math.hypot(dragTranslation.x, dragTranslation.y, dragTranslation.z)
    : 0
  const dragAxis =
    dragTranslation && dragLength > 1e-7
      ? {
          x: dragTranslation.x / dragLength,
          y: dragTranslation.y / dragLength,
          z: dragTranslation.z / dragLength,
        }
      : { x: 0, y: 0, z: 0 }
  const dragPass =
    dragTranslation != null &&
    dragLength > 0.005 &&
    dragWindow != null &&
    Math.abs(dragWindow.x) > 2 &&
    Math.abs(dragWindow.y / dragWindow.x) < 0.25

  return (
    <div className="min-h-full p-8 text-white">
      <h1 className="mb-2 text-2xl font-bold">
        Entity Gesture Coordinate Verification
      </h1>
      <p className="mb-5 max-w-4xl text-sm text-gray-300">
        Tap offset is target-local meters. Rotation is cumulative in the direct
        parent Entity axes. Drag translation is cumulative in the same direct
        parent space. The parent is rotated 45 degrees around Y and has a
        non-uniform scale; global Z rotation and a screen-horizontal drag should
        both have X/Z components in parent-local space.
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Reality
          data-testid="entity-coordinate-reality"
          style={{
            width: '100%',
            height: '520px',
            '--xr-depth': 180,
            '--xr-back': 110,
          }}
          spatialEventOptions={{ constrainedToAxis: [0, 0, 1] }}
          onSpatialTap={event => {
            setTapTarget(event.target?.id ?? 'unknown')
            setTap({
              x: event.offsetX,
              y: event.offsetY,
              z: event.offsetZ,
            })
          }}
          onSpatialRotate={event => {
            if (event.target?.id !== 'coordinateTarget') return
            const quaternion = event.quaternion
            setRotation(quaternion)
            rotateBaseRef.current ??= targetRotation
            setTargetRotation(
              applyParentRotation(rotateBaseRef.current, quaternion),
            )
          }}
          onSpatialRotateEnd={event => {
            if (event.target?.id === 'coordinateTarget') {
              rotateBaseRef.current = null
            }
          }}
          onSpatialDragStart={event => {
            if (event.target?.id !== 'coordinateTarget') return
            dragBaseRef.current = targetPosition
            dragProjectionRequest.current += 1
            setDragStart({
              x: event.offsetX,
              y: event.offsetY,
              z: event.offsetZ,
            })
            setDragTranslation(null)
            setDragWindow(null)
          }}
          onSpatialDrag={event => {
            if (event.target?.id !== 'coordinateTarget') return
            const translation = event.detail.translation3D
            setDragTranslation(translation)
            const parent = parentRef.current
            if (parent) {
              const request = ++dragProjectionRequest.current
              void Promise.all([
                convertCoordinate(
                  { x: 0, y: 0, z: 0 },
                  { from: parent, to: window },
                ),
                convertCoordinate(translation, { from: parent, to: window }),
              ]).then(([origin, endpoint]) => {
                if (request !== dragProjectionRequest.current) return
                setDragWindow({
                  x: endpoint.x - origin.x,
                  y: endpoint.y - origin.y,
                  z: endpoint.z - origin.z,
                })
              })
            }
            setTargetPosition({
              x: dragBaseRef.current.x + translation.x,
              y: dragBaseRef.current.y + translation.y,
              z: dragBaseRef.current.z + translation.z,
            })
          }}
        >
          <UnlitMaterial id="coordinateGreen" color="#22cc66" />
          <UnlitMaterial id="parentAxisRed" color="#ff4d4f" />
          <UnlitMaterial id="parentOriginBlue" color="#3b82f6" />
          <SceneGraph>
            <Entity
              ref={parentRef}
              id="rotatedParent"
              position={{ x: 0, y: 0, z: 0 }}
              rotation={parentRotation}
              scale={{ x: 1.5, y: 0.75, z: 1 }}
            >
              <BoxEntity
                id="coordinateTarget"
                width={0.2}
                height={0.16}
                depth={0.1}
                cornerRadius={0.02}
                position={targetPosition}
                rotation={targetRotation}
                materials={['coordinateGreen']}
                enableInput
              />
              <BoxEntity
                id="parentXAxisMarker"
                width={0.16}
                height={0.018}
                depth={0.018}
                position={{ x: 0.2, y: 0, z: 0 }}
                materials={['parentAxisRed']}
              />
              <BoxEntity
                id="parentOriginMarker"
                width={0.025}
                height={0.025}
                depth={0.14}
                position={{ x: 0, y: -0.13, z: 0 }}
                materials={['parentOriginBlue']}
              />
            </Entity>
          </SceneGraph>
        </Reality>

        <section className="rounded-xl border border-gray-700 bg-[#171717] p-5 text-sm">
          <h2 className="mb-3 text-lg font-semibold">Manual steps</h2>
          <ol className="mb-5 list-decimal space-y-2 pl-5 text-gray-300">
            <li>Tap several places on the green box front face.</li>
            <li>Rotate the green box with a two-hand rotation gesture.</li>
            <li>Drag the green box horizontally across the screen.</li>
          </ol>

          <div
            data-testid="tap-verdict"
            data-status={tap == null ? 'waiting' : tapPass ? 'pass' : 'fail'}
            className="mb-4 rounded-lg border border-gray-700 bg-black/30 p-4"
          >
            <div className="mb-1 font-semibold">
              Tap: {tap == null ? 'WAITING' : tapPass ? 'PASS' : 'CHECK'}
            </div>
            <div>target: {tapTarget}</div>
            <div>offset meters: {tap ? formatVec3(tap) : '—'}</div>
            <div className="mt-2 text-xs text-gray-400">
              Expected bounds: |x| ≤ 0.105, |y| ≤ 0.085, |z| ≤ 0.115. Runtime
              primitives may use either a centered Z range or a back-to-front
              0…depth range.
            </div>
          </div>

          <div
            data-testid="drag-start-verdict"
            data-status={
              dragStart == null ? 'waiting' : dragStartPass ? 'pass' : 'fail'
            }
            className="mb-4 rounded-lg border border-gray-700 bg-black/30 p-4"
          >
            <div className="mb-1 font-semibold">
              DragStart:{' '}
              {dragStart == null ? 'WAITING' : dragStartPass ? 'PASS' : 'CHECK'}
            </div>
            <div>offset meters: {dragStart ? formatVec3(dragStart) : '—'}</div>
            <div className="mt-2 text-xs text-gray-400">
              Expected bounds: |x| ≤ 0.105, |y| ≤ 0.085, |z| ≤ 0.115.
            </div>
          </div>

          <div
            data-testid="drag-verdict"
            data-status={
              dragTranslation == null ? 'waiting' : dragPass ? 'pass' : 'fail'
            }
            className="mt-4 rounded-lg border border-gray-700 bg-black/30 p-4"
          >
            <div className="mb-1 font-semibold">
              Drag:{' '}
              {dragTranslation == null
                ? 'WAITING'
                : dragPass
                  ? 'PASS'
                  : 'CHECK'}
            </div>
            <div>
              translation meters:{' '}
              {dragTranslation ? formatVec3(dragTranslation) : '—'}
            </div>
            <div>parent-local axis: {formatVec3(dragAxis)}</div>
            <div>
              projected window delta:{' '}
              {dragWindow ? formatVec3(dragWindow) : '—'}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              PASS projects the parent-local meter translation through the
              parent Entity and verifies a horizontal window-space delta.
            </div>
          </div>

          <div
            data-testid="rotation-verdict"
            data-status={
              rotation == null ? 'waiting' : rotationPass ? 'pass' : 'fail'
            }
            className="rounded-lg border border-gray-700 bg-black/30 p-4"
          >
            <div className="mb-1 font-semibold">
              Rotation:{' '}
              {rotation == null ? 'WAITING' : rotationPass ? 'PASS' : 'CHECK'}
            </div>
            <div>parent-local axis: {formatVec3(rotationInfo.axis)}</div>
            <div>cumulative angle: {fixed(rotationInfo.angleDegrees)}°</div>
            <div>
              quaternion:{' '}
              {rotation
                ? `(${fixed(rotation.x)}, ${fixed(rotation.y)}, ${fixed(rotation.z)}, ${fixed(rotation.w)})`
                : '—'}
            </div>
            <div className="mt-2 text-xs text-gray-400">
              Expected axis: parent-local X/Z diagonal (|x| and |z| ≈ 0.707).
            </div>
          </div>

          <button
            className="btn btn-sm btn-neutral mt-4"
            onClick={() => {
              setTap(null)
              setTapTarget('none')
              setDragStart(null)
              setRotation(null)
              setTargetRotation(initialTargetRotation)
              setDragTranslation(null)
              setTargetPosition(initialTargetPosition)
              rotateBaseRef.current = null
              dragBaseRef.current = initialTargetPosition
            }}
          >
            Reset
          </button>
        </section>
      </div>
    </div>
  )
}
