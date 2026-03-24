import { useCallback, useMemo, useRef, useState } from 'react'
import {
  enableDebugTool,
  Model,
  SpatialRotateEvent,
  type SpatialEventOptions,
} from '@webspatial/react-sdk'

enableDebugTool()

type Quat = { x: number; y: number; z: number; w: number }

function quatNorm(q: Quat): number {
  return Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w)
}

function quatNormalize(q: Quat): Quat {
  const n = quatNorm(q)
  if (n < 1e-12) return { x: 0, y: 0, z: 0, w: 1 }
  return { x: q.x / n, y: q.y / n, z: q.z / n, w: q.w / n }
}

function quatConj(q: Quat): Quat {
  return { x: -q.x, y: -q.y, z: -q.z, w: q.w }
}

function quatMul(a: Quat, b: Quat): Quat {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  }
}

/** Delta quaternion rotating from qPrev to qNext (same frame as events). */
function quatDelta(qPrev: Quat, qNext: Quat): Quat {
  const p = quatNormalize(qPrev)
  const inv = quatConj(p)
  return quatNormalize(quatMul(qNext, inv))
}

/**
 * Instantaneous rotation axis from a unit delta quaternion (imaginary part
 * direction when the delta is not identity).
 */
function axisFromDeltaQuat(d: Quat): {
  axis: [number, number, number] | null
  angleRad: number
} {
  const q = quatNormalize(d)
  const w = Math.min(1, Math.max(-1, q.w))
  const angleRad = 2 * Math.acos(w)
  const s = Math.sqrt(Math.max(0, 1 - w * w))
  if (s < 1e-6) return { axis: null, angleRad: 0 }
  return { axis: [q.x / s, q.y / s, q.z / s], angleRad }
}

function vec3Norm(v: readonly [number, number, number]): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
}

function vec3Normalize(
  v: readonly [number, number, number],
): [number, number, number] | null {
  const n = vec3Norm(v)
  if (n < 1e-15) return null
  return [v[0] / n, v[1] / n, v[2] / n]
}

function axisAlignment(
  expected: readonly [number, number, number] | undefined,
  deltaAxis: [number, number, number] | null,
): number | null {
  if (!deltaAxis) return null
  const e = expected == null ? null : vec3Normalize(expected)
  if (!e) return null
  return Math.abs(
    e[0] * deltaAxis[0] + e[1] * deltaAxis[1] + e[2] * deltaAxis[2],
  )
}

type ScenarioId =
  | 'omit'
  | 'zero'
  | 'x'
  | 'y'
  | 'z'
  | 'large_unnorm'
  | 'tuple'
  | 'object'
  | 'oblique'
  | 'tiny'

const SCENARIOS: {
  id: ScenarioId
  label: string
  note: string
  options: SpatialEventOptions | undefined
  /** For alignment check: axis we expect incremental rotation to follow (null = skip). */
  expectedAxis: [number, number, number] | undefined
}[] = [
  {
    id: 'omit',
    label: 'Omit spatialEventOptions',
    note: 'Unconstrained (no prop).',
    options: undefined,
    expectedAxis: undefined,
  },
  {
    id: 'zero',
    label: '[0, 0, 0] tuple',
    note: 'Explicit zero vector should behave as unconstrained.',
    options: { constrainedToAxis: [0, 0, 0] },
    expectedAxis: undefined,
  },
  {
    id: 'x',
    label: 'World +X [1, 0, 0]',
    note: 'Rotate only around world X.',
    options: { constrainedToAxis: [1, 0, 0] },
    expectedAxis: [1, 0, 0],
  },
  {
    id: 'y',
    label: 'World +Y [0, 1, 0]',
    note: 'Rotate only around world Y.',
    options: { constrainedToAxis: [0, 1, 0] },
    expectedAxis: [0, 1, 0],
  },
  {
    id: 'z',
    label: 'World +Z [0, 0, 1]',
    note: 'Rotate only around world Z.',
    options: { constrainedToAxis: [0, 0, 1] },
    expectedAxis: [0, 0, 1],
  },
  {
    id: 'large_unnorm',
    label: 'Unnormalized [100, 0, 0]',
    note: 'Same direction as +X after native normalize.',
    options: { constrainedToAxis: [100, 0, 0] },
    expectedAxis: [1, 0, 0],
  },
  {
    id: 'tuple',
    label: 'Readonly tuple (frozen)',
    note: 'Ensures array-shaped constraint is accepted.',
    options: { constrainedToAxis: Object.freeze([0, 0, 1] as const) },
    expectedAxis: [0, 0, 1],
  },
  {
    id: 'object',
    label: 'Object { x, y, z }',
    note: 'Vec3 object form.',
    options: { constrainedToAxis: { x: 0, y: 1, z: 0 } },
    expectedAxis: [0, 1, 0],
  },
  {
    id: 'oblique',
    label: 'Oblique [1, 2, 3]',
    note: 'Non-axis-aligned direction; compare alignment to normalized vector.',
    options: { constrainedToAxis: [1, 2, 3] },
    expectedAxis: vec3Normalize([1, 2, 3]) ?? undefined,
  },
  {
    id: 'tiny',
    label: 'Near-zero [1e-12, 0, 0]',
    note: 'Edge case: may fall back to unconstrained if length is below native epsilon.',
    options: { constrainedToAxis: [1e-12, 0, 0] },
    expectedAxis: undefined,
  },
]

function useRotateTrace() {
  const [lastQuat, setLastQuat] = useState<Quat | null>(null)
  const prevRef = useRef<Quat | null>(null)
  const [lastAlign, setLastAlign] = useState<number | null>(null)

  const onRotate = useCallback(
    (
      evt: SpatialRotateEvent,
      expectedAxis: [number, number, number] | undefined,
    ) => {
      const q = quatNormalize(evt.quaternion)
      setLastQuat(q)
      const prev = prevRef.current
      prevRef.current = q
      if (!prev) {
        setLastAlign(null)
        return
      }
      const d = quatDelta(prev, q)
      const { axis } = axisFromDeltaQuat(d)
      setLastAlign(axisAlignment(expectedAxis, axis))
    },
    [],
  )

  const resetTrace = useCallback(() => {
    prevRef.current = null
    setLastQuat(null)
    setLastAlign(null)
  }, [])

  return { lastQuat, lastAlign, onRotate, resetTrace }
}

export default function SpatialRotateAxisConstraintPage() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('z')
  const scenario = useMemo(
    () => SCENARIOS.find(s => s.id === scenarioId)!,
    [scenarioId],
  )

  const divTrace = useRotateTrace()
  const modelTrace = useRotateTrace()

  const spatialEventOptions = scenario.options

  const modelSrc =
    'https://utzmqao3qthjebc2.public.blob.vercel-storage.com/saeukkang.usdz'

  const cardStyle: React.CSSProperties = {
    width: '220px',
    height: '140px',
    backgroundColor: '#1e3a5f',
    color: 'white',
    '--xr-back': `${120}px` as unknown as number,
    '--xr-depth': `${80}px` as unknown as number,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    fontSize: '14px',
    textAlign: 'center',
    padding: '8px',
  }

  return (
    <div className="p-6 text-white min-h-full bg-[#0d0d0d]">
      <h1 className="text-2xl mb-2">Spatial rotate axis constraint</h1>
      <p className="text-gray-400 text-sm mb-6 max-w-3xl">
        Exercise{' '}
        <code className="text-cyan-300">
          spatialEventOptions.constrainedToAxis
        </code>{' '}
        on a SpatialDiv (<code className="text-cyan-300">enable-xr</code>) and a{' '}
        <code className="text-cyan-300">Model</code>. Use visionOS / AVP to
        verify gesture feel; this page logs quaternions and checks incremental
        rotation axis alignment where an axis is expected.
      </p>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Scenario
          </label>
          <select
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm"
            value={scenarioId}
            onChange={e => {
              const next = e.target.value as ScenarioId
              setScenarioId(next)
              divTrace.resetTrace()
              modelTrace.resetTrace()
            }}
          >
            {SCENARIOS.map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">{scenario.note}</p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-[#111] p-4 text-xs font-mono text-gray-300">
          <div className="text-gray-500 mb-1">
            Active spatialEventOptions (JSON)
          </div>
          <pre className="whitespace-pre-wrap break-all">
            {JSON.stringify(spatialEventOptions ?? null, null, 2)}
          </pre>
          {scenario.expectedAxis && (
            <div className="mt-2 text-gray-500">
              Expected incremental axis (normalized): [
              {scenario.expectedAxis.map(n => n.toFixed(4)).join(', ')}]
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          type="button"
          className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-sm"
          onClick={() => {
            divTrace.resetTrace()
            modelTrace.resetTrace()
          }}
        >
          Clear quaternion trace
        </button>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold mb-3 text-gray-200">
            {'<div enable-xr>'}
          </h2>
          <p className="text-xs text-gray-500 mb-2">
            JSX intrinsic element with spatialEventOptions
          </p>
          <div className="flex justify-center items-center min-h-[200px] border border-dashed border-gray-700 rounded-2xl p-4">
            <div
              enable-xr
              style={cardStyle}
              spatialEventOptions={spatialEventOptions}
              onSpatialRotate={e => divTrace.onRotate(e, scenario.expectedAxis)}
            >
              {'<div enable-xr>'}
            </div>
          </div>
          <Telemetry
            label="div"
            quat={divTrace.lastQuat}
            align={divTrace.lastAlign}
          />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3 text-gray-200">Model</h2>
          <p className="text-xs text-gray-500 mb-2">
            {'<Model> with spatialEventOptions'}
          </p>
          <div className="flex justify-center items-center min-h-[200px] border border-dashed border-gray-700 rounded-2xl p-4">
            <Model
              src={modelSrc}
              enable-xr
              style={{
                width: '220px',
                height: '220px',
                '--xr-back': `${120}px` as unknown as number,
              }}
              spatialEventOptions={spatialEventOptions}
              onSpatialRotate={e =>
                modelTrace.onRotate(e, scenario.expectedAxis)
              }
            />
          </div>
          <Telemetry
            label="model"
            quat={modelTrace.lastQuat}
            align={modelTrace.lastAlign}
          />
        </section>
      </div>

      <section className="mt-10 border-t border-gray-800 pt-6 text-sm text-gray-500">
        <h3 className="text-gray-400 font-medium mb-2">
          Manual checks (visionOS)
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Omit / zero: rotation should follow hand motion in all directions.
          </li>
          <li>
            +X / +Y / +Z: rotation should feel locked to that world axis (no
            roll on other axes).
          </li>
          <li>Large [100,0,0]: same as +X.</li>
          <li>
            Switch scenario while running: native gesture should pick up the new
            axis.
          </li>
          <li>
            Tiny axis: observe whether the runtime treats it as unconstrained
            (platform dependent).
          </li>
          <li>
            Alignment score: after the first sample, values near 1 mean the
            incremental axis matches the expected constraint (only meaningful
            when an expected axis is set).
          </li>
        </ul>
      </section>
    </div>
  )
}

function Telemetry({
  label,
  quat,
  align,
}: {
  label: string
  quat: Quat | null
  align: number | null
}) {
  return (
    <div className="mt-3 rounded-lg bg-[#111] border border-gray-800 p-3 text-xs font-mono">
      <div className="text-gray-500 mb-1">Last quaternion ({label})</div>
      {quat ? (
        <pre className="text-gray-300">
          x={quat.x.toFixed(4)} y={quat.y.toFixed(4)} z={quat.z.toFixed(4)} w=
          {quat.w.toFixed(4)}
        </pre>
      ) : (
        <div className="text-gray-600">No rotate event yet</div>
      )}
      <div className="mt-2 text-gray-500">Incremental axis alignment |dot|</div>
      {align == null ? (
        <div className="text-gray-600">Need 2+ rotate samples</div>
      ) : (
        <div className="text-cyan-400">{align.toFixed(4)}</div>
      )}
    </div>
  )
}
