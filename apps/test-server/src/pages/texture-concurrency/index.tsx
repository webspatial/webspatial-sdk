import {
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
// 1 — Concurrent same-URL loads
// =====================================================================

function ConcurrentSameUrlTexture() {
  const COUNT = 5
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
        Texture — Concurrent same-URL loads
      </h3>
      <p style={hint}>
        {COUNT} Reality containers each load the same texture URL
        simultaneously. Each should fire onLoad independently.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 8,
        }}
      >
        {Array.from({ length: COUNT }, (_, i) => (
          <div key={i}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>
              Scene {i + 1} <StatusBadge loaded={loads[i]} error={errors[i]} />
            </div>
            <div
              style={{ maxHeight: 130, overflow: 'hidden', marginBottom: 4 }}
            >
              <Reality id={`tex-conc-same-${i}`} style={rv}>
                <Texture
                  id={`texConcSame-${i}`}
                  url={buildPublicUrl(IMG_CAR)}
                  onLoad={() => onLoad(i)}
                  onError={e => onError(i, e)}
                />
                <UnlitMaterial
                  id={`texConcSameMat-${i}`}
                  color="#ffffff"
                  textureId={`texConcSame-${i}`}
                  transparent={false}
                  opacity={1}
                />
                <SceneGraph>
                  <Entity scale={SC} rotation={{ x: 0, y: 0.3, z: 0 }}>
                    <BoxEntity
                      id={`texConcSameBox-${i}`}
                      name={`texConcSameBox-${i}`}
                      width={0.08}
                      height={0.08}
                      depth={0.08}
                      cornerRadius={0.008}
                      materials={[`texConcSameMat-${i}`]}
                    />
                  </Entity>
                </SceneGraph>
              </Reality>
            </div>
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

function ConcurrentSameUrlModel() {
  const COUNT = 4
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
        Model — Concurrent same-URL loads
      </h3>
      <p style={hint}>
        {COUNT} Reality containers each load the same model URL simultaneously
        via ModelAsset + ModelEntity. Each should fire onLoad independently.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 8,
        }}
      >
        {Array.from({ length: COUNT }, (_, i) => (
          <div key={i}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>
              Scene {i + 1} <StatusBadge loaded={loads[i]} error={errors[i]} />
            </div>
            <div
              style={{ maxHeight: 170, overflow: 'hidden', marginBottom: 4 }}
            >
              <Reality id={`model-conc-same-${i}`} style={rvModel}>
                <ModelAsset
                  id={`modelConcSame-${i}`}
                  src={buildPublicUrl(MODEL_CAR)}
                  onLoad={() => onLoad(i)}
                  onError={e => onError(i, e)}
                />
                <SceneGraph>
                  <Entity>
                    <ModelEntity
                      id={`modelConcSameEnt-${i}`}
                      model={`modelConcSame-${i}`}
                      scale={{ x: 0.12, y: 0.12, z: 0.12 }}
                    />
                  </Entity>
                </SceneGraph>
              </Reality>
            </div>
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
        {COUNT} Reality containers each load a different texture URL
        simultaneously. Each should load its own distinct texture.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 8,
        }}
      >
        {DIFF_TEX_URLS.map((url, i) => (
          <div key={i}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>
              Scene {i + 1} <StatusBadge loaded={loads[i]} error={errors[i]} />
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#555',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 200,
              }}
            >
              {url}
            </div>
            <div
              style={{ maxHeight: 130, overflow: 'hidden', marginBottom: 4 }}
            >
              <Reality id={`tex-conc-diff-${i}`} style={rv}>
                <Texture
                  id={`texConcDiff-${i}`}
                  url={url}
                  onLoad={() => onLoad(i)}
                  onError={e => onError(i, e)}
                />
                <UnlitMaterial
                  id={`texConcDiffMat-${i}`}
                  color="#ffffff"
                  textureId={`texConcDiff-${i}`}
                  transparent={false}
                  opacity={1}
                />
                <SceneGraph>
                  <Entity scale={SC} rotation={{ x: 0, y: 0.3, z: 0 }}>
                    <PlaneEntity
                      id={`texConcDiffPlane-${i}`}
                      name={`texConcDiffPlane-${i}`}
                      width={0.1}
                      height={0.1}
                      materials={[`texConcDiffMat-${i}`]}
                    />
                  </Entity>
                </SceneGraph>
              </Reality>
            </div>
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
        {COUNT} Reality containers each load a different model URL
        simultaneously. Each should load its own distinct model.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 8,
        }}
      >
        {DIFF_MODEL_URLS.map((url, i) => (
          <div key={i}>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>
              Scene {i + 1} <StatusBadge loaded={loads[i]} error={errors[i]} />
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#555',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 200,
              }}
            >
              {url}
            </div>
            <div
              style={{ maxHeight: 170, overflow: 'hidden', marginBottom: 4 }}
            >
              <Reality id={`model-conc-diff-${i}`} style={rvModel}>
                <ModelAsset
                  id={`modelConcDiff-${i}`}
                  src={url}
                  onLoad={() => onLoad(i)}
                  onError={e => onError(i, e)}
                />
                <SceneGraph>
                  <Entity>
                    <ModelEntity
                      id={`modelConcDiffEnt-${i}`}
                      model={`modelConcDiff-${i}`}
                      scale={{ x: 0.12, y: 0.12, z: 0.12 }}
                    />
                  </Entity>
                </SceneGraph>
              </Reality>
            </div>
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
            <Entity scale={SC} rotation={{ x: 0, y: 0.3, z: 0 }}>
              <BoxEntity
                id="texRapidCycleBox"
                name="texRapidCycleBox"
                width={0.08}
                height={0.08}
                depth={0.08}
                cornerRadius={0.008}
                materials={['texRapidCycleMat']}
              />
            </Entity>
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
            <Entity>
              <ModelEntity
                id="modelRapidSwitchEnt"
                model={modelId}
                scale={{ x: 0.12, y: 0.12, z: 0.12 }}
              />
            </Entity>
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
            <Entity scale={SC} rotation={{ x: 0, y: 0.3, z: 0 }}>
              <BoxEntity
                id="texRemountBox"
                name="texRemountBox"
                width={0.08}
                height={0.08}
                depth={0.08}
                cornerRadius={0.008}
                materials={['texRemountMat']}
              />
            </Entity>
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
            <Entity>
              <ModelEntity
                id="modelRemountEnt"
                model="modelRemount"
                scale={{ x: 0.12, y: 0.12, z: 0.12 }}
              />
            </Entity>
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
            <Entity scale={SC} rotation={{ x: 0, y: 0.3, z: 0 }}>
              <BoxEntity
                id="texErrorRecoveryBox"
                name="texErrorRecoveryBox"
                width={0.08}
                height={0.08}
                depth={0.08}
                cornerRadius={0.008}
                materials={['texErrorRecoveryMat']}
              />
            </Entity>
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
            <Entity>
              <ModelEntity
                id="modelErrorRecoveryEnt"
                model="modelErrorRecovery"
                scale={{ x: 0.12, y: 0.12, z: 0.12 }}
              />
            </Entity>
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
  const [scenes, setScenes] = useState<number[]>([])
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
      setScenes(prev => [...prev, ...newIds])
      await new Promise(r => setTimeout(r, 300))
      setScenes(prev => {
        if (prev.length <= 2) return prev
        return prev.slice(2)
      })
      await new Promise(r => setTimeout(r, 200))
    }
    setScenes([])
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
        Continuously creates and destroys texture-loading scenes. Tests that
        temp files are cleaned up and no resources leak.
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button type="button" onClick={run} disabled={running}>
          {running ? 'Running...' : 'Start Churn'}
        </button>
        <button type="button" onClick={stop} disabled={!running}>
          Stop
        </button>
        <span style={{ fontSize: 12, color: '#aaa', alignSelf: 'center' }}>
          active scenes: {scenes.length}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 4,
        }}
      >
        {scenes.map(id => (
          <div key={id} style={{ maxHeight: 110, overflow: 'hidden' }}>
            <Reality id={`tex-churn-${id}`} style={{ ...rv, height: 100 }}>
              <Texture
                id={`texChurn-${id}`}
                url={buildPublicUrl(IMG_CAR)}
                onLoad={() => setLoads(n => n + 1)}
                onError={() => setErrors(n => n + 1)}
              />
              <UnlitMaterial
                id={`texChurnMat-${id}`}
                color="#ffffff"
                textureId={`texChurn-${id}`}
                transparent={false}
                opacity={1}
              />
              <SceneGraph>
                <Entity scale={{ x: 0.4, y: 0.4, z: 0.4 }}>
                  <BoxEntity
                    id={`texChurnBox-${id}`}
                    name={`texChurnBox-${id}`}
                    width={0.06}
                    height={0.06}
                    depth={0.06}
                    cornerRadius={0.006}
                    materials={[`texChurnMat-${id}`]}
                  />
                </Entity>
              </SceneGraph>
            </Reality>
          </div>
        ))}
      </div>
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
  const [scenes, setScenes] = useState<number[]>([])
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
      setScenes(prev => [...prev, ...newIds])
      await new Promise(r => setTimeout(r, 600))
      setScenes(prev => {
        if (prev.length <= 1) return prev
        return prev.slice(1)
      })
      await new Promise(r => setTimeout(r, 300))
    }
    setScenes([])
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
        Continuously creates and destroys model-loading scenes. Tests that temp
        files are cleaned up and no resources leak.
      </p>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button type="button" onClick={run} disabled={running}>
          {running ? 'Running...' : 'Start Churn'}
        </button>
        <button type="button" onClick={stop} disabled={!running}>
          Stop
        </button>
        <span style={{ fontSize: 12, color: '#aaa', alignSelf: 'center' }}>
          active scenes: {scenes.length}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 4,
        }}
      >
        {scenes.map(id => (
          <div key={id} style={{ maxHeight: 140, overflow: 'hidden' }}>
            <Reality
              id={`model-churn-${id}`}
              style={{ ...rvModel, height: 130 }}
            >
              <ModelAsset
                id={`modelChurn-${id}`}
                src={buildPublicUrl(MODEL_CONE)}
                onLoad={() => setLoads(n => n + 1)}
                onError={() => setErrors(n => n + 1)}
              />
              <SceneGraph>
                <Entity>
                  <ModelEntity
                    id={`modelChurnEnt-${id}`}
                    model={`modelChurn-${id}`}
                    scale={{ x: 0.08, y: 0.08, z: 0.08 }}
                  />
                </Entity>
              </SceneGraph>
            </Reality>
          </div>
        ))}
      </div>
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
        desc="Multiple Reality containers load the same resource URL simultaneously. Each should fire onLoad independently. No file corruption or cross-scene interference."
      />
      <ConcurrentSameUrlTexture />
      <ConcurrentSameUrlModel />

      <SectionTitle
        num={2}
        title="Concurrent different-URL loads"
        desc="Multiple Reality containers each load a different resource URL simultaneously. Each should load its own distinct resource."
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
        desc="Multiple containers loading a mix of same and different URLs simultaneously. Shared-URL scenes should not interfere with each other."
      />
      <MixedConcurrentLoadsTexture />
      <MixedConcurrentLoadsModel />

      <SectionTitle
        num={7}
        title="Concurrent create + destroy"
        desc="Continuously creates and destroys resource-loading scenes. Tests that temp files are cleaned up and no resources leak."
      />
      <ConcurrentCreateDestroyTexture />
      <ConcurrentCreateDestroyModel />
    </div>
  )
}
