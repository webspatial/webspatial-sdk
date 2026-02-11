import { useRef, useState } from 'react'
import './index.css'
import {
  enableDebugTool,
  Model,
  ModelSpatialRotateEvent,
  SpatialRotateEndEvent,
  SpatialRotateEvent,
} from '@webspatial/react-sdk'
import ReactDOM from 'react-dom/client'

enableDebugTool()

/**
 * Normalizes a quaternion to a unit quaternion.
 *
 * @param quat - Quaternion in (x, y, z, w) form where w is the scalar part.
 * @returns A normalized quaternion as a tuple [x, y, z, w]. Returns the identity
 *          quaternion [0, 0, 0, 1] if the magnitude is near zero.
 */
function quatNormalize(quat: { x: number; y: number; z: number; w: number }) {
  const { x, y, z, w } = quat
  const mag = Math.sqrt(x ** 2 + y ** 2 + z ** 2 + w ** 2)
  if (mag < 1e-9) return [0, 0, 0, 1] // 避免除零，返回恒等四元数
  return [x / mag, y / mag, z / mag, w / mag]
}

/**
 * Multiplies two quaternions using the Hamilton product (q = q1 ⊗ q2).
 *
 * When applying an incremental rotation to an existing rotation, callers often
 * use: newRotation = delta ⊗ current.
 *
 * @param q1 - Left operand quaternion in (x, y, z, w) form.
 * @param q2 - Right operand quaternion in (x, y, z, w) form.
 * @returns The product quaternion as an object { x, y, z, w } (not normalized).
 */
function quatMultiply(
  q1: { x: number; y: number; z: number; w: number },
  q2: { x: number; y: number; z: number; w: number },
) {
  const { x: x1, y: y1, z: z1, w: w1 } = q1
  const { x: x2, y: y2, z: z2, w: w2 } = q2
  // 核心乘法公式（x,y,z,w格式）
  const x = x1 * w2 + w1 * x2 + y1 * z2 - z1 * y2
  const y = y1 * w2 + w1 * y2 + z1 * x2 - x1 * z2
  const z = z1 * w2 + w1 * z2 + x1 * y2 - y1 * x2
  const w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2
  return { x, y, z, w }
}

/**
 * Converts a quaternion to a CSS `matrix3d(...)` rotation matrix string.
 *
 * The returned matrix is formatted in column-major order as required by CSS.
 *
 * @param quat - Quaternion in (x, y, z, w) form.
 * @param precision - Number of decimal places to keep per matrix element.
 * @returns A CSS `matrix3d(...)` string representing the rotation.
 */
function quatToCssMatrix3d(
  quat: { x: number; y: number; z: number; w: number },
  precision = 6,
) {
  const [x, y, z, w] = quatNormalize(quat) // 双重保险归一化
  // 计算4x4旋转矩阵核心值
  const m00 = 1 - 2 * y ** 2 - 2 * z ** 2
  const m01 = 2 * x * y - 2 * z * w
  const m02 = 2 * x * z + 2 * y * w
  const m10 = 2 * x * y + 2 * z * w
  const m11 = 1 - 2 * x ** 2 - 2 * z ** 2
  const m12 = 2 * y * z - 2 * x * w
  const m20 = 2 * x * z - 2 * y * w
  const m21 = 2 * y * z + 2 * x * w
  const m22 = 1 - 2 * x ** 2 - 2 * y ** 2
  // 列主序展开16个参数，固定后7个值
  const matrix = [
    m00,
    m10,
    m20,
    0,
    m01,
    m11,
    m21,
    0,
    m02,
    m12,
    m22,
    0,
    0,
    0,
    0,
    1,
  ]
  // 保留精度，拼接字符串
  const fixed = matrix.map(n => Number(n.toFixed(precision)))
  return `matrix3d(${fixed.join(',')})`
}

function App() {
  const [totalQuat, setTotalQuat] = useState({ x: 0, y: 0, z: 0, w: 1 })
  const [initialTransform, setInitialTransform] = useState(
    'translate3d(500px, 0px, 0px)',
  )
  // const initialTransform = 'translate3d(500px, 0px, 0px)'
  const transform = quatToCssMatrix3d(totalQuat)

  const style = {
    width: '300px',
    height: '300px',
    '--xr-back': `${100}px`,
    transform: `${initialTransform} ${transform}`,
  }

  const spatialRotate = (evt: ModelSpatialRotateEvent | SpatialRotateEvent) => {
    const newTotalQuat = evt.detail.quaternion
    console.log('dbg spatialRotate', newTotalQuat)
    setTotalQuat(newTotalQuat)
  }

  const spatialRotateEnd = () => {
    const transform = quatToCssMatrix3d(totalQuat)
    setInitialTransform(v => v + ' ' + transform)
    setTotalQuat({ x: 0, y: 0, z: 0, w: 1 })
  }

  const onSpatialDivSpatialRotate = (evt: SpatialRotateEvent) => {
    spatialRotate(evt)
  }

  const onSpatialDivSpatialRotateEnd = (evt: SpatialRotateEndEvent) => {
    spatialRotateEnd()
  }

  const onSpatialRotate = (evt: ModelSpatialRotateEvent) => {
    spatialRotate(evt)
  }

  const onSpatialRotateEnd = (evt: SpatialRotateEndEvent) => {
    spatialRotateEnd()
  }

  const src = '/public/modelasset/cone.usdz'
  // 'https://utzmqao3qthjebc2.public.blob.vercel-storage.com/saeukkang.usdz'

  return (
    <div>
      <div
        enable-xr
        className="red"
        style={style}
        onClick={() => {
          console.log('dbg onClick')
        }}
        onSpatialRotate={onSpatialDivSpatialRotate}
        onSpatialRotateEnd={onSpatialDivSpatialRotateEnd}
      >
        hello wolrd
      </div>

      <Model
        src={src}
        enable-xr
        style={style}
        onLoad={e => {
          console.log('dbg model onload')
        }}
        onSpatialRotate={onSpatialRotate}
        onSpatialRotateEnd={onSpatialRotateEnd}
      />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
