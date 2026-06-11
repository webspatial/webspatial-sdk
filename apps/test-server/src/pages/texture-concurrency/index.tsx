import {
  AttachmentAsset,
  AttachmentEntity,
  BoxEntity,
  Entity,
  ModelAsset,
  ModelEntity,
  PlaneEntity,
  Reality,
  SceneGraph,
  Texture,
  UnlitMaterial,
} from '@webspatial/react-sdk'
import type { CSSProperties } from 'react'
import { useCallback, useRef, useState } from 'react'

// ---- helpers ----

function buildPublicUrl(path: string): string {
  if (typeof window === 'undefined') return path
  return new URL(path, window.location.origin).href
}

// ---- texture URLs ----

const IMG_CAR = '/img/toy_drummer.png'
const IMG_404 = '/img/__404_not_found__.png'
const TEX_GRID = 'https://threejs.org/examples/textures/uv_grid_opengl.jpg'
const TEX_APPLE = 'https://threejs.org/examples/textures/sprite0.png'
const TEX_BADGE = 'https://threejs.org/examples/textures/disturb.jpg'

// ---- model URLs ----

const MODEL_CAR = '/assets/vehicle-speedster.usdz'
const MODEL_CONE = '/modelasset/cone.usdz'
const MODEL_DUCK = '/modelasset/Duck.glb'
const MODEL_FOX = '/modelasset/Fox_animated.glb'
const MODEL_404 = '/modelasset/__404_not_found__.usdz'

// ---- shared styles ----

const SC = { x: 0.51, y: 0.51, z: 0.51 }
const rv: CSSProperties = {
  width: '100%',
  height: 120,
  maxWidth: 440,
  border: '1px solid #444',
  background: '#111',
  '--xr-depth': 60,
  '--xr-back': 100,
} as CSSProperties
const rvModel: CSSProperties = {
  ...rv,
  height: 160,
  '--xr-depth': 80,
  '--xr-back': 140,
} as CSSProperties
const hint: CSSProperties = { fontSize: 13, color: '#888' }

// ---- section title ----

function SectionTitle({
  num,
  title,
  desc,
}: {
  num: number
  title: string
  desc: string
}) {
  return (
    <>
      <h2 style={{ fontSize: 16, marginTop: 22 }}>
        {num} — {title}
      </h2>
      <p style={hint}>{desc}</p>
    </>
  )
}

// ---- status badge ----

function StatusBadge({
  loaded,
  error,
}: {
  loaded: number | undefined
  error: string | undefined
}) {
  if (loaded != null) {
    return <span style={{ color: '#0f0' }}>loaded ({loaded})</span>
  }
  if (error) {
    return <span style={{ color: '#f00' }}>error</span>
  }
  return <span style={{ color: '#fa0' }}>loading...</span>
}

// ---- summary line ----

function SummaryLine({
  totalLoads,
  expected,
  totalErrors,
}: {
  totalLoads: number
  expected: number
  totalErrors: number
}) {
  return (
    <div style={{ fontSize: 12, marginTop: 4 }}>
      Total onLoad: <strong>{totalLoads}</strong> / {expected} · errors:{' '}
      <strong style={{ color: totalErrors > 0 ? '#f66' : '#6f6' }}>
        {totalErrors}
      </strong>
    </div>
  )
}

// =====================================================================
// 1 — Concurrent same-URL loads (debug)
// =====================================================================

const REALITY_DEBUG_VIEWPORT: CSSProperties = {
  width: '100%',
  height: '600px',
  maxWidth: 440,
  border: '1px solid #444',
  background: '#111',
  '--xr-depth': 100,
  '--xr-back': 200,
} as CSSProperties

/** Same dimensions as reality-debug BoxEntity */
const LARGE_BOX = {
  width: 0.2,
  height: 0.2,
  depth: 0.1,
  cornerRadius: 1,
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
} as const

// Flip while debugging
const SHOW_BOX_RED = true

/** Shared with boxRedNext (the working textured box) */
const WORKING_ENTITY = {
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 0.6, y: 0.6, z: 0.6 },
} as const

const ATTACH_LABEL = {
  background: 'rgba(0,0,0,0.88)',
  color: '#fff',
  padding: '5px 8px',
  borderRadius: 6,
  fontSize: 11,
  fontFamily: 'system-ui, sans-serif',
  lineHeight: 1.35,
} as const

const ATTACH_SIZE = { width: 168, height: 52 }
const ATTACH_ABOVE: [number, number, number] = [0, 0.11, 0]

function AttachLabel({ title, detail }: { title: string; detail: string }) {
  return (
    <div style={ATTACH_LABEL}>
      <strong>{title}</strong>
      <div style={{ color: '#bbb', fontSize: 10, marginTop: 2 }}>{detail}</div>
    </div>
  )
}

function BoxAttachment({ name }: { name: string }) {
  return (
    <AttachmentEntity
      attachment={name}
      position={ATTACH_ABOVE}
      size={ATTACH_SIZE}
    />
  )
}

function ConcurrentSameUrlTextureWorking() {
  const [loads, setLoads] = useState(0)
  const [error, setError] = useState<string | undefined>()

  return (
    <div>
      <h3 style={{ fontSize: 14, marginTop: 12, color: '#aaa' }}>
        Texture — narrow down (vs boxRedNext)
      </h3>
      <p style={hint}>
        Top row works: boxRed + boxRedNext (y=0.15). Below: each changes ONE
        thing from boxRedNext. Same material, same scale, same LARGE_BOX.
      </p>
      <div
        style={{
          fontSize: 11,
          color: '#888',
          marginBottom: 8,
          lineHeight: 1.6,
        }}
      >
        <div>✓ boxRedNext — baseline (x=0.14, y=0.15)</div>
        <div>① narrow-id — only id/name → texBox-0 (still y=0.15)</div>
        <div>② narrow-y — only entity y → 0 (was 0.15)</div>
        <div>③ narrow-x — only entity x → -0.14 (old texBox x)</div>
        <div>④ narrow-old — old texBox-0 transform (x=-0.14, y=0)</div>
      </div>
      <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
        Texture{' '}
        <StatusBadge loaded={loads > 0 ? loads : undefined} error={error} />
      </div>

      <Reality id="tex-conc-same" style={REALITY_DEBUG_VIEWPORT}>
        {/* resources — defined once, not placed in the scene */}
        <Texture
          id="texConcSame"
          url={buildPublicUrl(IMG_CAR)}
          onLoad={() => setLoads(n => n + 1)}
          onError={e => setError(String(e))}
        />
        <UnlitMaterial
          id="texConcSameMat"
          color="#ffffff"
          textureId="texConcSame"
          transparent={false}
          opacity={1}
        />
        <UnlitMaterial
          id="matRed"
          color="#ff0000"
          transparent={true}
          opacity={0.5}
        />

        <AttachmentAsset name="tex-label-red">
          <AttachLabel title="control" detail="matRed · no texture" />
        </AttachmentAsset>
        <AttachmentAsset name="tex-label-baseline">
          <AttachLabel title="✓ baseline" detail="texConcSameMat · y=0.15" />
        </AttachmentAsset>
        <AttachmentAsset name="tex-label-1">
          <AttachLabel title="① narrow-id" detail="id=texBox-0 · y=0.15" />
        </AttachmentAsset>
        <AttachmentAsset name="tex-label-2">
          <AttachLabel title="② narrow-y" detail="only y=0 (was 0.15)" />
        </AttachmentAsset>
        <AttachmentAsset name="tex-label-3">
          <AttachLabel title="③ narrow-x" detail="only x=-0.14" />
        </AttachmentAsset>
        <AttachmentAsset name="tex-label-4">
          <AttachLabel title="④ narrow-old" detail="x=-0.14 · y=0" />
        </AttachmentAsset>

        <SceneGraph>
          {/* control — identical pattern that works on both platforms */}
          {SHOW_BOX_RED ? (
            <Entity
              position={{ x: 0, y: 0.15, z: 0 }}
              rotation={{ x: 0, y: 0, z: 0 }}
              scale={{ x: 0.6, y: 0.6, z: 0.6 }}
            >
              <BoxEntity
                id="boxRed"
                name="boxRedName"
                {...LARGE_BOX}
                materials={['matRed']}
              />
              <BoxAttachment name="tex-label-red" />
            </Entity>
          ) : null}

          <Entity
            position={{ x: 0.14, y: 0.15, z: 0 }}
            rotation={{ x: 0, y: 0, z: 0 }}
            scale={{ x: 0.6, y: 0.6, z: 0.6 }}
          >
            <BoxEntity
              id="boxRedNext"
              name="boxRedNext"
              {...LARGE_BOX}
              materials={['texConcSameMat']}
            />
            <BoxAttachment name="tex-label-baseline" />
          </Entity>

          {/* ① id/name only — same spot as boxRedNext, old texBox-0 id */}
          <Entity position={{ x: 0.28, y: 0.15, z: 0 }} {...WORKING_ENTITY}>
            <BoxEntity
              id="texBox0"
              name="texBox0"
              {...LARGE_BOX}
              materials={['texConcSameMat']}
            />
            <BoxAttachment name="tex-label-1" />
          </Entity>

          {/* ② entity y=0 only */}
          <Entity position={{ x: 0.28, y: 0, z: 0 }} {...WORKING_ENTITY}>
            <BoxEntity
              id="narrowy"
              name="narrowy"
              {...LARGE_BOX}
              materials={['texConcSameMat']}
            />
            <BoxAttachment name="tex-label-2" />
          </Entity>

          {/* ③ old x only, keep y=0.15 */}
          <Entity position={{ x: -0.14, y: 0.15, z: 0 }} {...WORKING_ENTITY}>
            <BoxEntity
              id="narrowx"
              name="narrowx"
              {...LARGE_BOX}
              materials={['texConcSameMat']}
            />
            <BoxAttachment name="tex-label-3" />
          </Entity>

          {/* ④ exact old texBox-0 entity transform */}
          <Entity position={{ x: -0.14, y: 0, z: 0 }} {...WORKING_ENTITY}>
            <BoxEntity
              id="narrowold"
              name="narrowold"
              {...LARGE_BOX}
              materials={['texConcSameMat']}
            />
            <BoxAttachment name="tex-label-4" />
          </Entity>
        </SceneGraph>
      </Reality>

      <SummaryLine
        totalLoads={loads}
        expected={1}
        totalErrors={error ? 1 : 0}
      />
    </div>
  )
}

function ConcurrentSameUrlTexture() {
  return (
    <>
      <ConcurrentSameUrlTextureWorking />
      <ConcurrentSameUrlModel />
    </>
  )
}

/*
 * --- Other section-1 variants (uncomment in ConcurrentSameUrlTexture to use) ---
 *
 * function ConcurrentSameUrlTexture() {
 *   return (
 *     <>
 *       <ConcurrentSameUrlTextureWorking />
 *       <ConcurrentSameUrlTextureSmallViewport />
 *       <ConcurrentSameUrlTexturePrevious />
 *     </>
 *   )
 * }
 *
 * const SMALL_BOX = { width: 0.08, height: 0.08, depth: 0.08, cornerRadius: 0.008 } as const
 *
 * function ViewportCallout({ ... }) { ... }
 *
 * function TexturedBoxRow({ ... }) {
 *   return (
 *     <>
 *       {[-1.5, -0.5, 0.5, 1.5].map(i => i * spread).map((x, i) => (
 *         <Entity key={i} position={{ x, y: 0, z: 0 }} scale={entityScale}>
 *           <BoxEntity id={`${boxIdPrefix}-${i}`} materials={[matId]} ... />
 *         </Entity>
 *       ))}
 *     </>
 *   )
 * }
 *
 * function ConcurrentSameUrlTextureSmallViewport() { ... viewport B test ... }
 * function ConcurrentSameUrlTexturePrevious() { ... viewport C test ... }
 */

function ConcurrentSameUrlModel() {
  const COUNT = 4
  const [loads, setLoads] = useState(0)
  const [error, setError] = useState<string | undefined>()

  return (
    <div>
      <h3 style={{ fontSize: 14, marginTop: 12, color: '#aaa' }}>
        Model — Concurrent same-URL loads
      </h3>
      <p style={hint}>
        One Reality, one ModelAsset — {COUNT} ModelEntities in SceneGraph share
        the same model reference. Model should load once and all entities should
        display it.
      </p>
      <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
        Model{' '}
        <StatusBadge loaded={loads > 0 ? loads : undefined} error={error} />
      </div>
      <Reality id="model-conc-same" style={rvModel}>
        <ModelAsset
          id="modelConcSame"
          src={buildPublicUrl(MODEL_CAR)}
          onLoad={() => setLoads(n => n + 1)}
          onError={e => setError(String(e))}
        />
        <SceneGraph>
          {Array.from({ length: COUNT }, (_, i) => (
            <Entity
              key={i}
              position={{ x: (i - (COUNT - 1) / 2) * 0.12, y: 0, z: 0 }}
            >
              <ModelEntity
                id={`modelConcSameEnt-${i}`}
                model="modelConcSame"
                scale={{ x: 0.12, y: 0.12, z: 0.12 }}
              />
            </Entity>
          ))}
        </SceneGraph>
      </Reality>
      <SummaryLine
        totalLoads={loads}
        expected={1}
        totalErrors={error ? 1 : 0}
      />
    </div>
  )
}

// =====================================================================
// 2 — Concurrent different-URL loads
// =====================================================================

const DIFF_TEX_URLS = [buildPublicUrl(IMG_CAR), TEX_GRID, TEX_APPLE, TEX_BADGE]

const DIFF_MODEL_URLS = [
  buildPublicUrl(MODEL_CAR),
  buildPublicUrl(MODEL_CONE),
  buildPublicUrl(MODEL_DUCK),
  buildPublicUrl(MODEL_FOX),
]

function ConcurrentDifferentUrlsTexture() {
  const COUNT = DIFF_TEX_URLS.length
  const [loads, setLoads] = useState<Record<number, number>>({})
  const [errors, setErrors] = useState<Record<number, string>>({})
  const onLoad = useCallback(
    (i: number) => setLoads(prev => ({ ...prev, [i]: (prev[i] ?? 0) + 1 })),
    [],
  )
  const onError = useCallback(
    (i: number, e: unknown) => setErrors(prev => ({ ...prev, [i]: String(e) })),
    [],
  )
  const totalLoads = Object.values(loads).reduce((a, b) => a + b, 0)
  const totalErrors = Object.values(errors).filter(Boolean).length

  return (
    <div>
      <h3 style={{ fontSize: 14, marginTop: 12, color: '#aaa' }}>
        Texture — Concurrent different-URL loads
      </h3>
      <p style={hint}>
        One Reality — {COUNT} distinct Texture + UnlitMaterial pairs, each
        referenced by one PlaneEntity in SceneGraph.
      </p>
      <Reality id="tex-conc-diff" style={rv}>
        {DIFF_TEX_URLS.map((url, i) => (
          <Texture
            key={`tex-${i}`}
            id={`texConcDiff-${i}`}
            url={url}
            onLoad={() => onLoad(i)}
            onError={e => onError(i, e)}
          />
        ))}
        {DIFF_TEX_URLS.map((_, i) => (
          <UnlitMaterial
            key={`mat-${i}`}
            id={`texConcDiffMat-${i}`}
            color="#ffffff"
            textureId={`texConcDiff-${i}`}
            transparent={false}
            opacity={1}
          />
        ))}
        <SceneGraph>
          {DIFF_TEX_URLS.map((_, i) => (
            <Entity
              key={i}
              position={{ x: (i - (COUNT - 1) / 2) * 0.1, y: 0, z: 0 }}
              scale={SC}
              rotation={{ x: 0, y: 0.3, z: 0 }}
            >
              <PlaneEntity
                id={`texConcDiffPlane-${i}`}
                name={`texConcDiffPlane-${i}`}
                width={0.1}
                height={0.1}
                materials={[`texConcDiffMat-${i}`]}
              />
            </Entity>
          ))}
        </SceneGraph>
      </Reality>
      <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
        {DIFF_TEX_URLS.map((url, i) => (
          <div key={i}>
            [{i}] <StatusBadge loaded={loads[i]} error={errors[i]} />{' '}
            <span style={{ color: '#555', fontSize: 10 }}>{url}</span>
          </div>
        ))}
      </div>
      <SummaryLine
        totalLoads={totalLoads}
        expected={COUNT}
        totalErrors={totalErrors}
      />
    </div>
  )
}

function ConcurrentDifferentUrlsModel() {
  const COUNT = DIFF_MODEL_URLS.length
  const [loads, setLoads] = useState<Record<number, number>>({})
  const [errors, setErrors] = useState<Record<number, string>>({})
  const onLoad = useCallback(
    (i: number) => setLoads(prev => ({ ...prev, [i]: (prev[i] ?? 0) + 1 })),
    [],
  )
  const onError = useCallback(
    (i: number, e: unknown) => setErrors(prev => ({ ...prev, [i]: String(e) })),
    [],
  )
  const totalLoads = Object.values(loads).reduce((a, b) => a + b, 0)
  const totalErrors = Object.values(errors).filter(Boolean).length

  return (
    <div>
      <h3 style={{ fontSize: 14, marginTop: 12, color: '#aaa' }}>
        Model — Concurrent different-URL loads
      </h3>
      <p style={hint}>
        One Reality — {COUNT} distinct ModelAssets, each referenced by one
        ModelEntity in SceneGraph.
      </p>
      <Reality id="model-conc-diff" style={rvModel}>
        {DIFF_MODEL_URLS.map((url, i) => (
          <ModelAsset
            key={`asset-${i}`}
            id={`modelConcDiff-${i}`}
            src={url}
            onLoad={() => onLoad(i)}
            onError={e => onError(i, e)}
          />
        ))}
        <SceneGraph>
          {DIFF_MODEL_URLS.map((_, i) => (
            <Entity
              key={i}
              position={{ x: (i - (COUNT - 1) / 2) * 0.12, y: 0, z: 0 }}
            >
              <ModelEntity
                id={`modelConcDiffEnt-${i}`}
                model={`modelConcDiff-${i}`}
                scale={{ x: 0.12, y: 0.12, z: 0.12 }}
              />
            </Entity>
          ))}
        </SceneGraph>
      </Reality>
      <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
        {DIFF_MODEL_URLS.map((url, i) => (
          <div key={i}>
            [{i}] <StatusBadge loaded={loads[i]} error={errors[i]} />{' '}
            <span style={{ color: '#555', fontSize: 10 }}>{url}</span>
          </div>
        ))}
      </div>
      <SummaryLine
        totalLoads={totalLoads}
        expected={COUNT}
        totalErrors={totalErrors}
      />
    </div>
  )
}

// =====================================================================
// 3 — Rapid cycling (stress)
// =====================================================================

function RapidUrlCyclingTexture() {
  const COUNT = 3
  const [url, setUrl] = useState(buildPublicUrl(IMG_CAR))
  const [loads, setLoads] = useState(0)
  const [errors, setErrors] = useState(0)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('idle')
  const abortRef = useRef(false)

  const run = useCallback(async () => {
    setRunning(true)
    setStatus('running...')
    abortRef.current = false
    const urls = [
      buildPublicUrl(IMG_CAR),
      TEX_GRID,
      TEX_APPLE,
      TEX_BADGE,
      buildPublicUrl(IMG_CAR),
      TEX_GRID,
    ]
    for (let i = 0; i < 30 && !abortRef.current; i++) {
      setUrl(urls[i % urls.length])
      await new Promise(r => setTimeout(r, 80))
    }
    if (!abortRef.current) {
      setUrl(buildPublicUrl(IMG_CAR))
      setStatus('done')
    }
    setRunning(false)
  }, [])

  const stop = useCallback(() => {
    abortRef.current = true
    setStatus('stopped')
    setRunning(false)
  }, [])

  return (
    <div>
      <h3 style={{ fontSize: 14, marginTop: 12, color: '#aaa' }}>
        Texture — Rapid URL cycling (stress)
      </h3>
      <p style={hint}>
        Rapidly cycles a single texture through 4 different URLs 30 times. Tests
        the update pipeline under rapid changes.
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button type="button" onClick={run} disabled={running}>
          {running ? 'Running...' : 'Start Stress'}
        </button>
        <button type="button" onClick={stop} disabled={!running}>
          Stop
        </button>
        <span style={{ fontSize: 12, color: '#aaa', alignSelf: 'center' }}>
          {status}
        </span>
      </div>
      <div style={{ maxHeight: 130, overflow: 'hidden', marginBottom: 4 }}>
        <Reality id="realityTexRapidCycle" style={rv}>
          <Texture
            id="texRapidCycle"
            url={url}
            onLoad={() => setLoads(n => n + 1)}
            onError={() => setErrors(n => n + 1)}
          />
          <UnlitMaterial
            id="texRapidCycleMat"
            color="#ffffff"
            textureId="texRapidCycle"
            transparent={false}
            opacity={1}
          />
          <SceneGraph>
            {Array.from({ length: COUNT }, (_, i) => (
              <Entity
                key={i}
                position={{ x: (i - (COUNT - 1) / 2) * 0.1, y: 0, z: 0 }}
                scale={SC}
                rotation={{ x: 0, y: 0.3, z: 0 }}
              >
                <BoxEntity
                  id={`texRapidCycleBox-${i}`}
                  name={`texRapidCycleBox-${i}`}
                  width={0.08}
                  height={0.08}
                  depth={0.08}
                  cornerRadius={0.008}
                  materials={['texRapidCycleMat']}
                />
              </Entity>
            ))}
          </SceneGraph>
        </Reality>
      </div>
      <div style={{ fontSize: 12 }}>
        onLoad: <strong>{loads}</strong> · onError:{' '}
        <strong style={{ color: errors > 0 ? '#f66' : '#6f6' }}>
          {errors}
        </strong>
        <div style={{ color: '#555', fontSize: 10, wordBreak: 'break-all' }}>
          {url}
        </div>
      </div>
    </div>
  )
}

function RapidModelSwitching() {
  const COUNT = 3
  // ModelAsset doesn't support URL updates, so we switch which ModelAsset id
  // the ModelEntity references (like dynamicAssets test does).
  const [modelId, setModelId] = useState<'modelA' | 'modelB'>('modelA')
  const [loadsA, setLoadsA] = useState(0)
  const [loadsB, setLoadsB] = useState(0)
  const [errorsA, setErrorsA] = useState(0)
  const [errorsB, setErrorsB] = useState(0)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('idle')
  const abortRef = useRef(false)

  const run = useCallback(async () => {
    setRunning(true)
    setStatus('running...')
    abortRef.current = false
    for (let i = 0; i < 30 && !abortRef.current; i++) {
      setModelId(i % 2 === 0 ? 'modelA' : 'modelB')
      await new Promise(r => setTimeout(r, 120))
    }
    if (!abortRef.current) {
      setModelId('modelA')
      setStatus('done')
    }
    setRunning(false)
  }, [])

  const stop = useCallback(() => {
    abortRef.current = true
    setStatus('stopped')
    setRunning(false)
  }, [])

  return (
    <div>
      <h3 style={{ fontSize: 14, marginTop: 12, color: '#aaa' }}>
        Model — Rapid model switching (stress)
      </h3>
      <p style={hint}>
        Rapidly switches a ModelEntity between two ModelAsset ids 30 times.
        ModelAsset A loads car, ModelAsset B loads cone. Tests the model
        rebinding pipeline under rapid changes.
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button type="button" onClick={run} disabled={running}>
          {running ? 'Running...' : 'Start Stress'}
        </button>
        <button type="button" onClick={stop} disabled={!running}>
          Stop
        </button>
        <span style={{ fontSize: 12, color: '#aaa', alignSelf: 'center' }}>
          {status} · active: {modelId}
        </span>
      </div>
      <div style={{ maxHeight: 170, overflow: 'hidden', marginBottom: 4 }}>
        <Reality id="realityModelRapidSwitch" style={rvModel}>
          <ModelAsset
            id="modelA"
            src={buildPublicUrl(MODEL_CAR)}
            onLoad={() => setLoadsA(n => n + 1)}
            onError={() => setErrorsA(n => n + 1)}
          />
          <ModelAsset
            id="modelB"
            src={buildPublicUrl(MODEL_CONE)}
            onLoad={() => setLoadsB(n => n + 1)}
            onError={() => setErrorsB(n => n + 1)}
          />
          <SceneGraph>
            {Array.from({ length: COUNT }, (_, i) => (
              <Entity
                key={i}
                position={{ x: (i - (COUNT - 1) / 2) * 0.12, y: 0, z: 0 }}
              >
                <ModelEntity
                  id={`modelRapidSwitchEnt-${i}`}
                  model={modelId}
                  scale={{ x: 0.12, y: 0.12, z: 0.12 }}
                />
              </Entity>
            ))}
          </SceneGraph>
        </Reality>
      </div>
      <div style={{ fontSize: 12 }}>
        modelA onLoad: <strong>{loadsA}</strong> · onError:{' '}
        <strong style={{ color: errorsA > 0 ? '#f66' : '#6f6' }}>
          {errorsA}
        </strong>
        <br />
        modelB onLoad: <strong>{loadsB}</strong> · onError:{' '}
        <strong style={{ color: errorsB > 0 ? '#f66' : '#6f6' }}>
          {errorsB}
        </strong>
      </div>
    </div>
  )
}

// =====================================================================
// 4 — Remount stability
// =====================================================================

function RemountStabilityTexture() {
  const COUNT = 3
  const [key, setKey] = useState(0)
  const [loads, setLoads] = useState(0)
  const [errors, setErrors] = useState(0)
  const [running, setRunning] = useState(false)
  const abortRef = useRef(false)

  const run = useCallback(async () => {
    setRunning(true)
    abortRef.current = false
    for (let i = 0; i < 10 && !abortRef.current; i++) {
      setKey(k => k + 1)
      await new Promise(r => setTimeout(r, 500))
    }
    setRunning(false)
  }, [])

  const stop = useCallback(() => {
    abortRef.current = true
    setRunning(false)
  }, [])

  return (
    <div>
      <h3 style={{ fontSize: 14, marginTop: 12, color: '#aaa' }}>
        Texture — Remount stability
      </h3>
      <p style={hint}>
        Remounts the scene 10 times with 500ms intervals. Each remount should
        load the texture fresh. No stale cached files.
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button type="button" onClick={run} disabled={running}>
          {running ? `Remounting... (${key}/10)` : 'Start Remount Loop'}
        </button>
        <button type="button" onClick={stop} disabled={!running}>
          Stop
        </button>
        <button
          type="button"
          onClick={() => setKey(k => k + 1)}
          disabled={running}
        >
          Single Remount
        </button>
      </div>
      <div style={{ maxHeight: 130, overflow: 'hidden', marginBottom: 4 }}>
        <Reality key={key} id="realityTexRemount" style={rv}>
          <Texture
            id="texRemount"
            url={buildPublicUrl(IMG_CAR)}
            onLoad={() => setLoads(n => n + 1)}
            onError={() => setErrors(n => n + 1)}
          />
          <UnlitMaterial
            id="texRemountMat"
            color="#ffffff"
            textureId="texRemount"
            transparent={false}
            opacity={1}
          />
          <SceneGraph>
            {Array.from({ length: COUNT }, (_, i) => (
              <Entity
                key={i}
                position={{ x: (i - (COUNT - 1) / 2) * 0.1, y: 0, z: 0 }}
                scale={SC}
                rotation={{ x: 0, y: 0.3, z: 0 }}
              >
                <BoxEntity
                  id={`texRemountBox-${i}`}
                  name={`texRemountBox-${i}`}
                  width={0.08}
                  height={0.08}
                  depth={0.08}
                  cornerRadius={0.008}
                  materials={['texRemountMat']}
                />
              </Entity>
            ))}
          </SceneGraph>
        </Reality>
      </div>
      <div style={{ fontSize: 12 }}>
        remounts: <strong>{key}</strong> · onLoad: <strong>{loads}</strong> ·
        onError:{' '}
        <strong style={{ color: errors > 0 ? '#f66' : '#6f6' }}>
          {errors}
        </strong>
      </div>
    </div>
  )
}

function RemountStabilityModel() {
  const COUNT = 3
  const [key, setKey] = useState(0)
  const [loads, setLoads] = useState(0)
  const [errors, setErrors] = useState(0)
  const [running, setRunning] = useState(false)
  const abortRef = useRef(false)

  const run = useCallback(async () => {
    setRunning(true)
    abortRef.current = false
    for (let i = 0; i < 10 && !abortRef.current; i++) {
      setKey(k => k + 1)
      await new Promise(r => setTimeout(r, 800))
    }
    setRunning(false)
  }, [])

  const stop = useCallback(() => {
    abortRef.current = true
    setRunning(false)
  }, [])

  return (
    <div>
      <h3 style={{ fontSize: 14, marginTop: 12, color: '#aaa' }}>
        Model — Remount stability
      </h3>
      <p style={hint}>
        Remounts the scene 10 times with 800ms intervals. Each remount should
        load the model fresh. No stale cached files, no cross-remount
        interference.
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button type="button" onClick={run} disabled={running}>
          {running ? `Remounting... (${key}/10)` : 'Start Remount Loop'}
        </button>
        <button type="button" onClick={stop} disabled={!running}>
          Stop
        </button>
        <button
          type="button"
          onClick={() => setKey(k => k + 1)}
          disabled={running}
        >
          Single Remount
        </button>
      </div>
      <div style={{ maxHeight: 170, overflow: 'hidden', marginBottom: 4 }}>
        <Reality key={key} id="realityModelRemount" style={rvModel}>
          <ModelAsset
            id="modelRemount"
            src={buildPublicUrl(MODEL_CAR)}
            onLoad={() => setLoads(n => n + 1)}
            onError={() => setErrors(n => n + 1)}
          />
          <SceneGraph>
            {Array.from({ length: COUNT }, (_, i) => (
              <Entity
                key={i}
                position={{ x: (i - (COUNT - 1) / 2) * 0.12, y: 0, z: 0 }}
              >
                <ModelEntity
                  id={`modelRemountEnt-${i}`}
                  model="modelRemount"
                  scale={{ x: 0.12, y: 0.12, z: 0.12 }}
                />
              </Entity>
            ))}
          </SceneGraph>
        </Reality>
      </div>
      <div style={{ fontSize: 12 }}>
        remounts: <strong>{key}</strong> · onLoad: <strong>{loads}</strong> ·
        onError:{' '}
        <strong style={{ color: errors > 0 ? '#f66' : '#6f6' }}>
          {errors}
        </strong>
      </div>
    </div>
  )
}

// =====================================================================
// 5 — Error recovery
// =====================================================================

function ErrorRecoveryTexture() {
  const COUNT = 3
  const [url, setUrl] = useState(buildPublicUrl(IMG_404))
  const [loads, setLoads] = useState(0)
  const [errors, setErrors] = useState(0)
  const [lastError, setLastError] = useState('')

  return (
    <div>
      <h3 style={{ fontSize: 14, marginTop: 12, color: '#aaa' }}>
        Texture — Error recovery
      </h3>
      <p style={hint}>
        Start with a 404 URL, then switch to a valid URL. Verify the texture
        recovers and loads correctly after an error.
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button type="button" onClick={() => setUrl(buildPublicUrl(IMG_404))}>
          404 URL
        </button>
        <button type="button" onClick={() => setUrl(buildPublicUrl(IMG_CAR))}>
          Valid URL
        </button>
        <button type="button" onClick={() => setUrl(TEX_GRID)}>
          Grid
        </button>
      </div>
      <div style={{ maxHeight: 130, overflow: 'hidden', marginBottom: 4 }}>
        <Reality id="realityTexErrorRecovery" style={rv}>
          <Texture
            id="texErrorRecovery"
            url={url}
            onLoad={() => {
              setLoads(n => n + 1)
              setLastError('')
            }}
            onError={e => {
              setErrors(n => n + 1)
              setLastError(String(e))
            }}
          />
          <UnlitMaterial
            id="texErrorRecoveryMat"
            color="#ffffff"
            textureId="texErrorRecovery"
            transparent={false}
            opacity={1}
          />
          <SceneGraph>
            {Array.from({ length: COUNT }, (_, i) => (
              <Entity
                key={i}
                position={{ x: (i - (COUNT - 1) / 2) * 0.1, y: 0, z: 0 }}
                scale={SC}
                rotation={{ x: 0, y: 0.3, z: 0 }}
              >
                <BoxEntity
                  id={`texErrorRecoveryBox-${i}`}
                  name={`texErrorRecoveryBox-${i}`}
                  width={0.08}
                  height={0.08}
                  depth={0.08}
                  cornerRadius={0.008}
                  materials={['texErrorRecoveryMat']}
                />
              </Entity>
            ))}
          </SceneGraph>
        </Reality>
      </div>
      <div style={{ fontSize: 12 }}>
        onLoad: <strong>{loads}</strong> · onError:{' '}
        <strong style={{ color: errors > 0 ? '#f66' : '#6f6' }}>
          {errors}
        </strong>
        {lastError ? (
          <span style={{ color: '#f66', marginLeft: 8 }}>{lastError}</span>
        ) : null}
        <div style={{ color: '#555', fontSize: 10, wordBreak: 'break-all' }}>
          {url}
        </div>
      </div>
    </div>
  )
}

function ErrorRecoveryModel() {
  const COUNT = 3
  // ModelAsset doesn't support URL updates, so we use remounting with
  // different src values to test error → valid recovery.
  const [key, setKey] = useState(0)
  const [src, setSrc] = useState(buildPublicUrl(MODEL_404))
  const [loads, setLoads] = useState(0)
  const [errors, setErrors] = useState(0)
  const [lastError, setLastError] = useState('')

  const switchTo = useCallback((newSrc: string) => {
    setSrc(newSrc)
    setKey(k => k + 1)
  }, [])

  return (
    <div>
      <h3 style={{ fontSize: 14, marginTop: 12, color: '#aaa' }}>
        Model — Error recovery
      </h3>
      <p style={hint}>
        Start with a 404 model URL, then remount with a valid URL. Verify the
        model recovers and loads correctly after an error. No corrupted cache.
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => switchTo(buildPublicUrl(MODEL_404))}
        >
          404 URL
        </button>
        <button
          type="button"
          onClick={() => switchTo(buildPublicUrl(MODEL_CAR))}
        >
          Valid URL
        </button>
        <button
          type="button"
          onClick={() => switchTo(buildPublicUrl(MODEL_CONE))}
        >
          Cone
        </button>
      </div>
      <div style={{ maxHeight: 170, overflow: 'hidden', marginBottom: 4 }}>
        <Reality key={key} id="realityModelErrorRecovery" style={rvModel}>
          <ModelAsset
            id="modelErrorRecovery"
            src={src}
            onLoad={() => {
              setLoads(n => n + 1)
              setLastError('')
            }}
            onError={e => {
              setErrors(n => n + 1)
              setLastError(String(e))
            }}
          />
          <SceneGraph>
            {Array.from({ length: COUNT }, (_, i) => (
              <Entity
                key={i}
                position={{ x: (i - (COUNT - 1) / 2) * 0.12, y: 0, z: 0 }}
              >
                <ModelEntity
                  id={`modelErrorRecoveryEnt-${i}`}
                  model="modelErrorRecovery"
                  scale={{ x: 0.12, y: 0.12, z: 0.12 }}
                />
              </Entity>
            ))}
          </SceneGraph>
        </Reality>
      </div>
      <div style={{ fontSize: 12 }}>
        remounts: <strong>{key}</strong> · onLoad: <strong>{loads}</strong> ·
        onError:{' '}
        <strong style={{ color: errors > 0 ? '#f66' : '#6f6' }}>
          {errors}
        </strong>
        {lastError ? (
          <span style={{ color: '#f66', marginLeft: 8 }}>{lastError}</span>
        ) : null}
        <div style={{ color: '#555', fontSize: 10, wordBreak: 'break-all' }}>
          {src}
        </div>
      </div>
    </div>
  )
}

// =====================================================================
// 6 — Mixed concurrent loads
// =====================================================================

function MixedConcurrentLoadsTexture() {
  const SCENE_COUNT = 6
  const urls = [
    buildPublicUrl(IMG_CAR),
    buildPublicUrl(IMG_CAR), // same URL as scene 0
    TEX_GRID,
    TEX_APPLE,
    TEX_APPLE, // same URL as scene 3
    TEX_BADGE,
  ]
  const [loads, setLoads] = useState<Record<number, number>>({})
  const [errors, setErrors] = useState<Record<number, string>>({})
  const onLoad = useCallback(
    (i: number) => setLoads(prev => ({ ...prev, [i]: (prev[i] ?? 0) + 1 })),
    [],
  )
  const onError = useCallback(
    (i: number, e: unknown) => setErrors(prev => ({ ...prev, [i]: String(e) })),
    [],
  )
  const totalLoads = Object.values(loads).reduce((a, b) => a + b, 0)
  const totalErrors = Object.values(errors).filter(Boolean).length

  return (
    <div>
      <h3 style={{ fontSize: 14, marginTop: 12, color: '#aaa' }}>
        Texture — Mixed concurrent loads
      </h3>
      <p style={hint}>
        {SCENE_COUNT} Reality containers loading a mix of same and different
        URLs simultaneously. Scenes 0 & 1 share a URL, scenes 3 & 4 share a URL.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 8,
        }}
      >
        {urls.map((url, i) => {
          const isShared =
            urls.filter((u, j) => u === url && j !== i).length > 0
          return (
            <div key={i}>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>
                Scene {i}{' '}
                {isShared ? (
                  <span style={{ color: '#fa0' }}>(shared URL)</span>
                ) : null}{' '}
                <StatusBadge loaded={loads[i]} error={errors[i]} />
              </div>
              <div
                style={{ maxHeight: 130, overflow: 'hidden', marginBottom: 4 }}
              >
                <Reality id={`tex-conc-mixed-${i}`} style={rv}>
                  <Texture
                    id={`texConcMixed-${i}`}
                    url={url}
                    onLoad={() => onLoad(i)}
                    onError={e => onError(i, e)}
                  />
                  <UnlitMaterial
                    id={`texConcMixedMat-${i}`}
                    color="#ffffff"
                    textureId={`texConcMixed-${i}`}
                    transparent={false}
                    opacity={1}
                  />
                  <SceneGraph>
                    <Entity scale={SC} rotation={{ x: 0, y: 0.3, z: 0 }}>
                      <BoxEntity
                        id={`texConcMixedBox-${i}`}
                        name={`texConcMixedBox-${i}`}
                        width={0.08}
                        height={0.08}
                        depth={0.08}
                        cornerRadius={0.008}
                        materials={[`texConcMixedMat-${i}`]}
                      />
                    </Entity>
                  </SceneGraph>
                </Reality>
              </div>
            </div>
          )
        })}
      </div>
      <SummaryLine
        totalLoads={totalLoads}
        expected={SCENE_COUNT}
        totalErrors={totalErrors}
      />
    </div>
  )
}

function MixedConcurrentLoadsModel() {
  const SCENE_COUNT = 6
  const urls = [
    buildPublicUrl(MODEL_CAR),
    buildPublicUrl(MODEL_CAR), // same URL as scene 0
    buildPublicUrl(MODEL_CONE),
    buildPublicUrl(MODEL_DUCK),
    buildPublicUrl(MODEL_DUCK), // same URL as scene 3
    buildPublicUrl(MODEL_FOX),
  ]
  const [loads, setLoads] = useState<Record<number, number>>({})
  const [errors, setErrors] = useState<Record<number, string>>({})
  const onLoad = useCallback(
    (i: number) => setLoads(prev => ({ ...prev, [i]: (prev[i] ?? 0) + 1 })),
    [],
  )
  const onError = useCallback(
    (i: number, e: unknown) => setErrors(prev => ({ ...prev, [i]: String(e) })),
    [],
  )
  const totalLoads = Object.values(loads).reduce((a, b) => a + b, 0)
  const totalErrors = Object.values(errors).filter(Boolean).length

  return (
    <div>
      <h3 style={{ fontSize: 14, marginTop: 12, color: '#aaa' }}>
        Model — Mixed concurrent loads
      </h3>
      <p style={hint}>
        {SCENE_COUNT} Reality containers loading a mix of same and different
        model URLs simultaneously. Scenes 0 & 1 share a URL, scenes 3 & 4 share
        a URL.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 8,
        }}
      >
        {urls.map((url, i) => {
          const isShared =
            urls.filter((u, j) => u === url && j !== i).length > 0
          return (
            <div key={i}>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>
                Scene {i}{' '}
                {isShared ? (
                  <span style={{ color: '#fa0' }}>(shared URL)</span>
                ) : null}{' '}
                <StatusBadge loaded={loads[i]} error={errors[i]} />
              </div>
              <div
                style={{ maxHeight: 170, overflow: 'hidden', marginBottom: 4 }}
              >
                <Reality id={`model-conc-mixed-${i}`} style={rvModel}>
                  <ModelAsset
                    id={`modelConcMixed-${i}`}
                    src={url}
                    onLoad={() => onLoad(i)}
                    onError={e => onError(i, e)}
                  />
                  <SceneGraph>
                    <Entity>
                      <ModelEntity
                        id={`modelConcMixedEnt-${i}`}
                        model={`modelConcMixed-${i}`}
                        scale={{ x: 0.12, y: 0.12, z: 0.12 }}
                      />
                    </Entity>
                  </SceneGraph>
                </Reality>
              </div>
            </div>
          )
        })}
      </div>
      <SummaryLine
        totalLoads={totalLoads}
        expected={SCENE_COUNT}
        totalErrors={totalErrors}
      />
    </div>
  )
}

// =====================================================================
// 7 — Concurrent create + destroy
// =====================================================================

function ConcurrentCreateDestroyTexture() {
  const [entities, setEntities] = useState<number[]>([])
  const [loads, setLoads] = useState(0)
  const [errors, setErrors] = useState(0)
  const [running, setRunning] = useState(false)
  const abortRef = useRef(false)
  const nextIdRef = useRef(0)

  const run = useCallback(async () => {
    setRunning(true)
    abortRef.current = false
    for (let cycle = 0; cycle < 10 && !abortRef.current; cycle++) {
      const newIds: number[] = []
      for (let j = 0; j < 3; j++) {
        newIds.push(nextIdRef.current++)
      }
      setEntities(prev => [...prev, ...newIds])
      await new Promise(r => setTimeout(r, 300))
      setEntities(prev => {
        if (prev.length <= 2) return prev
        return prev.slice(2)
      })
      await new Promise(r => setTimeout(r, 200))
    }
    setEntities([])
    setRunning(false)
  }, [])

  const stop = useCallback(() => {
    abortRef.current = true
    setRunning(false)
  }, [])

  return (
    <div>
      <h3 style={{ fontSize: 14, marginTop: 12, color: '#aaa' }}>
        Texture — Concurrent create + destroy
      </h3>
      <p style={hint}>
        One Reality with a shared Texture + UnlitMaterial. Continuously creates
        and destroys BoxEntities in SceneGraph. Tests that temp files are
        cleaned up and no resources leak.
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button type="button" onClick={run} disabled={running}>
          {running ? 'Running...' : 'Start Churn'}
        </button>
        <button type="button" onClick={stop} disabled={!running}>
          Stop
        </button>
        <span style={{ fontSize: 12, color: '#aaa', alignSelf: 'center' }}>
          active entities: {entities.length}
        </span>
      </div>
      <Reality id="tex-churn" style={rv}>
        <Texture
          id="texChurn"
          url={buildPublicUrl(IMG_CAR)}
          onLoad={() => setLoads(n => n + 1)}
          onError={() => setErrors(n => n + 1)}
        />
        <UnlitMaterial
          id="texChurnMat"
          color="#ffffff"
          textureId="texChurn"
          transparent={false}
          opacity={1}
        />
        <SceneGraph>
          {entities.map((id, i) => (
            <Entity
              key={id}
              position={{
                x: (i - (entities.length - 1) / 2) * 0.08,
                y: 0,
                z: 0,
              }}
              scale={{ x: 0.4, y: 0.4, z: 0.4 }}
            >
              <BoxEntity
                id={`texChurnBox-${id}`}
                name={`texChurnBox-${id}`}
                width={0.06}
                height={0.06}
                depth={0.06}
                cornerRadius={0.006}
                materials={['texChurnMat']}
              />
            </Entity>
          ))}
        </SceneGraph>
      </Reality>
      <div style={{ fontSize: 12, marginTop: 4 }}>
        onLoad: <strong>{loads}</strong> · onError:{' '}
        <strong style={{ color: errors > 0 ? '#f66' : '#6f6' }}>
          {errors}
        </strong>
      </div>
    </div>
  )
}

function ConcurrentCreateDestroyModel() {
  const [entities, setEntities] = useState<number[]>([])
  const [loads, setLoads] = useState(0)
  const [errors, setErrors] = useState(0)
  const [running, setRunning] = useState(false)
  const abortRef = useRef(false)
  const nextIdRef = useRef(0)

  const run = useCallback(async () => {
    setRunning(true)
    abortRef.current = false
    for (let cycle = 0; cycle < 8 && !abortRef.current; cycle++) {
      const newIds: number[] = []
      for (let j = 0; j < 2; j++) {
        newIds.push(nextIdRef.current++)
      }
      setEntities(prev => [...prev, ...newIds])
      await new Promise(r => setTimeout(r, 600))
      setEntities(prev => {
        if (prev.length <= 1) return prev
        return prev.slice(1)
      })
      await new Promise(r => setTimeout(r, 300))
    }
    setEntities([])
    setRunning(false)
  }, [])

  const stop = useCallback(() => {
    abortRef.current = true
    setRunning(false)
  }, [])

  return (
    <div>
      <h3 style={{ fontSize: 14, marginTop: 12, color: '#aaa' }}>
        Model — Concurrent create + destroy
      </h3>
      <p style={hint}>
        One Reality with a shared ModelAsset. Continuously creates and destroys
        ModelEntities in SceneGraph. Tests that temp files are cleaned up and no
        resources leak.
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button type="button" onClick={run} disabled={running}>
          {running ? 'Running...' : 'Start Churn'}
        </button>
        <button type="button" onClick={stop} disabled={!running}>
          Stop
        </button>
        <span style={{ fontSize: 12, color: '#aaa', alignSelf: 'center' }}>
          active entities: {entities.length}
        </span>
      </div>
      <Reality id="model-churn" style={rvModel}>
        <ModelAsset
          id="modelChurn"
          src={buildPublicUrl(MODEL_CONE)}
          onLoad={() => setLoads(n => n + 1)}
          onError={() => setErrors(n => n + 1)}
        />
        <SceneGraph>
          {entities.map((id, i) => (
            <Entity
              key={id}
              position={{
                x: (i - (entities.length - 1) / 2) * 0.1,
                y: 0,
                z: 0,
              }}
            >
              <ModelEntity
                id={`modelChurnEnt-${id}`}
                model="modelChurn"
                scale={{ x: 0.08, y: 0.08, z: 0.08 }}
              />
            </Entity>
          ))}
        </SceneGraph>
      </Reality>
      <div style={{ fontSize: 12, marginTop: 4 }}>
        onLoad: <strong>{loads}</strong> · onError:{' '}
        <strong style={{ color: errors > 0 ? '#f66' : '#6f6' }}>
          {errors}
        </strong>
      </div>
    </div>
  )
}

// =====================================================================
// Main page
// =====================================================================

export default function TextureConcurrency() {
  return (
    <div
      style={{
        padding: 16,
        color: '#eee',
        fontFamily: 'system-ui,sans-serif',
        maxWidth: 960,
      }}
    >
      <h1 style={{ fontSize: 20 }}>Texture &amp; Model Concurrency Tests</h1>
      <p style={hint}>
        Tests for concurrent resource loading, file safety, cache reuse, and
        error recovery. Covers the Dynamic3DManager / RemoteResourceLoadCache
        bug scenarios for both Texture and ModelAsset/ModelEntity.
      </p>

      <SectionTitle
        num={1}
        title="Concurrent same-URL loads"
        desc="Debug: boxRed (matRed) vs texBox-* (shared texConcSameMat). Toggle SHOW_TEX_BOX_* flags at top of section."
      />
      <ConcurrentSameUrlTexture />
      {/* <ConcurrentSameUrlModel /> */}
      {/* <SectionTitle
        num={2}
        title="Concurrent different-URL loads"
        desc="One Reality loads multiple distinct resource URLs concurrently. Each Texture/ModelAsset is defined once and referenced by one entity."
      />
      <ConcurrentDifferentUrlsTexture />
      <ConcurrentDifferentUrlsModel />

      <SectionTitle
        num={3}
        title="Rapid cycling (stress)"
        desc="Rapidly cycles resources through different URLs/ids. Tests the update/rebinding pipeline under rapid changes. No crashes, no stale resources, no file corruption."
      />
      <RapidUrlCyclingTexture />
      <RapidModelSwitching />

      <SectionTitle
        num={4}
        title="Remount stability"
        desc="Remounts scenes repeatedly. Each remount should load the resource fresh. No stale cached files, no cross-remount interference."
      />
      <RemountStabilityTexture />
      <RemountStabilityModel />

      <SectionTitle
        num={5}
        title="Error recovery"
        desc="Start with a bad URL, then switch to a valid one. Verify the resource recovers and loads correctly after an error. No stale error state, no corrupted cache."
      />
      <ErrorRecoveryTexture />
      <ErrorRecoveryModel />

      <SectionTitle
        num={6}
        title="Mixed concurrent loads"
        desc="One Reality loads a mix of same and different URLs. Shared URLs reuse a single Texture/ModelAsset; multiple entities reference them."
      />
      <MixedConcurrentLoadsTexture />
      <MixedConcurrentLoadsModel />

      <SectionTitle
        num={7}
        title="Concurrent create + destroy"
        desc="One Reality with a shared resource continuously creates and destroys entities in SceneGraph. Tests cleanup and resource lifecycle."
      />
      <ConcurrentCreateDestroyTexture />
      <ConcurrentCreateDestroyModel />  */}
    </div>
  )
}
