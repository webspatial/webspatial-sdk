import React, { useState } from 'react'
import {
  BoxEntity,
  ConeEntity,
  Entity,
  PlaneEntity,
  Reality,
  SceneGraph,
  SphereEntity,
  Texture,
  UnlitMaterial,
} from '@webspatial/react-sdk'

function buildPublicUrl(path: string): string {
  if (typeof window === 'undefined') return path
  return new URL(path, window.location.origin).href
}

const IMG_CAR = '/img/toy_drummer.png'
const IMG_V1 = `${IMG_CAR}?v=1`
const IMG_V2 = `${IMG_CAR}?v=2`
const IMG_404 = '/img/__404_not_found__.png'
const TEX_GRID = 'https://threejs.org/examples/textures/uv_grid_opengl.jpg'
const TEX_APPLE = 'https://threejs.org/examples/textures/sprite0.png'
const TEX_BADGE = 'https://threejs.org/examples/textures/disturb.jpg'

const SC = { x: 0.51, y: 0.51, z: 0.51 }
const view: React.CSSProperties = {
  maxHeight: 168,
  overflow: 'hidden',
  marginBottom: 8,
}
const rv: React.CSSProperties = {
  width: '100%',
  height: 160,
  maxWidth: 440,
  border: '1px solid #444',
  background: '#111',
  '--xr-depth': 80,
  '--xr-back': 140,
} as React.CSSProperties
const hint = { fontSize: 13, color: '#888' }

function carUrl() {
  return typeof window !== 'undefined' ? buildPublicUrl(IMG_CAR) : IMG_CAR
}

export default function TexturedUnlitBox() {
  // Core: one shared texture — textured box plus two tinted primitives (different materials, same texture id).
  const [coreUrl, setCoreUrl] = useState(carUrl)
  const [coreReady, setCoreReady] = useState(false)
  const [coreNote, setCoreNote] = useState('')
  const [coreLoads, setCoreLoads] = useState(0)

  // Lab: one Texture id; only `url` changes. Plane + box share one material.
  const [labUrl, setLabUrl] = useState(carUrl)
  const [labColor, setLabColor] = useState('#ffffff')
  const [labLoads, setLabLoads] = useState(0)
  const [labErr, setLabErr] = useState('')
  const [stressMsg, setStressMsg] = useState('')

  // Bind: material points at car texture, badge texture, or no texture; material id changes per bind.
  const [bindTex, setBindTex] = useState<
    'switchTextureCar' | 'switchTextureBadge' | ''
  >('switchTextureCar')
  const [bindColor, setBindColor] = useState('#ffffff')
  const bindMatId = bindTex === '' ? 'bindMat_none' : `bindMat_${bindTex}`
  return (
    <div
      style={{ padding: 16, color: '#eee', fontFamily: 'system-ui,sans-serif' }}
    >
      <h1 style={{ fontSize: 20 }}>Textures</h1>
      <p style={hint}>
        Manual checks for <code>Texture</code> + <code>UnlitMaterial</code>.
        Local car image: <code>{IMG_CAR}</code> (if it fails on device, the
        first scene falls back to the grid texture).
      </p>

      <h2 style={{ fontSize: 16, marginTop: 14 }}>
        1 — Basic load and shared texture with different tints
      </h2>
      <p style={hint}>
        After <code>coreTex</code> loads: left box uses the image as-is; sphere
        and cone use the same texture id but different material colors. Counter
        = how many times <code>onLoad</code> ran.
      </p>
      <p
        style={{ fontSize: 11, color: '#666', marginTop: -4, marginBottom: 8 }}
      >
        Written test sheet: basic texture load + onLoad, then two materials
        sharing one texture.
      </p>
      <div style={view}>
        <Reality id="realityCore" style={rv}>
          <Texture
            id="coreTex"
            url={coreUrl}
            onLoad={() => {
              setCoreReady(true)
              setCoreLoads(n => n + 1)
            }}
            onError={() => {
              setCoreReady(false)
              setCoreNote('car URL failed → grid')
              setCoreUrl(TEX_GRID)
            }}
          />
          {coreReady ? (
            <>
              <UnlitMaterial
                id="matBasic"
                color="#ffffff"
                textureId="coreTex"
                transparent={false}
                opacity={1}
              />
              <UnlitMaterial
                id="matWarm"
                color="#ffaa66"
                textureId="coreTex"
                transparent={false}
                opacity={1}
              />
              <UnlitMaterial
                id="matCool"
                color="#6688ff"
                textureId="coreTex"
                transparent={false}
                opacity={1}
              />
              <SceneGraph>
                <Entity scale={SC} rotation={{ x: 0, y: 0.42, z: 0 }}>
                  <BoxEntity
                    id="basicTextureBox"
                    name="basicTextureBox"
                    width={0.09}
                    height={0.09}
                    depth={0.09}
                    cornerRadius={0.01}
                    position={{ x: -0.1, y: 0, z: 0 }}
                    materials={['matBasic']}
                  />
                  <SphereEntity
                    id="warmTintBox"
                    name="warmTintBox"
                    radius={0.038}
                    position={{ x: 0, y: 0, z: 0 }}
                    materials={['matWarm']}
                  />
                  <ConeEntity
                    id="coolTintBox"
                    name="coolTintBox"
                    radius={0.03}
                    height={0.075}
                    position={{ x: 0.1, y: 0, z: 0 }}
                    materials={['matCool']}
                  />
                </Entity>
              </SceneGraph>
            </>
          ) : null}
        </Reality>
      </div>
      <div style={{ fontSize: 12 }}>
        <code>coreTex</code> onLoad: <strong>{coreLoads}</strong>
        {coreNote ? <span style={{ color: '#fa0' }}> — {coreNote}</span> : null}
      </div>

      <h2 style={{ fontSize: 16, marginTop: 22 }}>
        2 — Change image URL at runtime (same Texture component id)
      </h2>
      <p style={hint}>
        <code>runtimePlaneTexture</code> keeps the same id; only{' '}
        <code>url</code> changes. Plane <code>runtimeTextureBox</code> and the
        small box both use <code>labMat</code>; the material refreshes through
        the resource registry when the texture settles.
      </p>
      <p
        style={{ fontSize: 11, color: '#666', marginTop: -4, marginBottom: 8 }}
      >
        Buttons exercise runtime URL changes (7306526129), bad URL with tint
        (7306537111, 7306500112), cache-bust with <code>?v=1</code> /{' '}
        <code>?v=2</code>, and a fast URL+color loop. Refresh the page to repeat
        any sequence.
      </p>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}
      >
        <button
          type="button"
          onClick={() => setLabUrl(buildPublicUrl(IMG_CAR))}
        >
          Car
        </button>
        <button type="button" onClick={() => setLabUrl(TEX_APPLE)}>
          Apple
        </button>
        <button type="button" onClick={() => setLabUrl(TEX_BADGE)}>
          Badge
        </button>
        <button type="button" onClick={() => setLabUrl(TEX_GRID)}>
          Grid
        </button>
        <button
          type="button"
          onClick={() => setLabUrl(buildPublicUrl(IMG_404))}
        >
          404
        </button>
        <button type="button" onClick={() => setLabUrl(buildPublicUrl(IMG_V1))}>
          ?v=1
        </button>
        <button type="button" onClick={() => setLabUrl(buildPublicUrl(IMG_V2))}>
          ?v=2
        </button>
        <button type="button" onClick={() => setLabColor('#ff2200')}>
          Red
        </button>
        <button type="button" onClick={() => setLabColor('#22ff88')}>
          Green
        </button>
        <button
          type="button"
          onClick={async () => {
            setStressMsg('…')
            for (let i = 0; i < 20; i++) {
              setLabUrl(
                i % 2 === 0 ? buildPublicUrl(IMG_V1) : buildPublicUrl(IMG_V2),
              )
              setLabColor(i % 2 === 0 ? '#ff00aa' : '#00cc66')
              await new Promise(r => setTimeout(r, 40))
            }
            setLabUrl(buildPublicUrl(IMG_V2))
            setLabColor('#00cc66')
            setStressMsg('done')
          }}
        >
          Stress 20
        </button>
        <label style={{ fontSize: 12 }}>
          color{' '}
          <input
            type="color"
            value={labColor}
            onChange={e => setLabColor(e.target.value)}
          />
        </label>
      </div>
      <div style={view}>
        <Reality id="realityLab" style={rv}>
          <Texture
            id="runtimePlaneTexture"
            url={labUrl}
            onLoad={() => {
              setLabLoads(n => n + 1)
              setLabErr('')
            }}
            onError={e => setLabErr(String(e))}
          />
          <UnlitMaterial
            id="labMat"
            color={labColor}
            textureId="runtimePlaneTexture"
            transparent={false}
            opacity={1}
          />
          <SceneGraph>
            <Entity scale={SC} rotation={{ x: 0, y: 0.35, z: 0 }}>
              <PlaneEntity
                id="runtimeTextureBox"
                name="runtimeTextureBox"
                width={0.14}
                height={0.14}
                position={{ x: -0.07, y: 0, z: 0 }}
                materials={['labMat']}
              />
              <BoxEntity
                id="labBox"
                name="labBox"
                width={0.065}
                height={0.065}
                depth={0.065}
                cornerRadius={0.008}
                position={{ x: 0.07, y: 0, z: 0 }}
                materials={['labMat']}
              />
            </Entity>
          </SceneGraph>
        </Reality>
      </div>
      <div style={{ fontSize: 12 }}>
        loads <strong>{labLoads}</strong> ·{' '}
        {labErr ? <span style={{ color: '#f66' }}>{labErr}</span> : null}{' '}
        {stressMsg ? <span>{stressMsg}</span> : null}
        <div style={{ color: '#666' }}>{labUrl}</div>
      </div>
      <h2 style={{ fontSize: 16, marginTop: 22 }}>
        3 — Switch which texture a single material uses (or clear texture)
      </h2>
      <p style={hint}>
        Two fixed <code>Texture</code> nodes (car and badge). The
        material&apos;s <code>textureId</code> points at one of them or empty
        for tint-only. The material&apos;s own id changes when you change bind
        so setup stays consistent.
      </p>
      <p
        style={{ fontSize: 11, color: '#666', marginTop: -4, marginBottom: 8 }}
      >
        Written test sheet: switch or clear which texture id the material uses,
        then change tint.
      </p>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}
      >
        <button type="button" onClick={() => setBindTex('switchTextureCar')}>
          Car
        </button>
        <button type="button" onClick={() => setBindTex('switchTextureBadge')}>
          Badge
        </button>
        <button type="button" onClick={() => setBindTex('')}>
          Clear
        </button>
        <label style={{ fontSize: 12 }}>
          color{' '}
          <input
            type="color"
            value={bindColor}
            onChange={e => setBindColor(e.target.value)}
          />
        </label>
      </div>
      <div style={view}>
        <Reality id="realityBind" style={rv}>
          <Texture id="switchTextureCar" url={buildPublicUrl(IMG_CAR)} />
          <Texture id="switchTextureBadge" url={TEX_BADGE} />
          <UnlitMaterial
            id={bindMatId}
            color={bindColor}
            textureId={bindTex}
            transparent
            opacity={1}
          />
          <SceneGraph>
            <Entity scale={SC} rotation={{ x: 0, y: 0.5, z: 0 }}>
              <BoxEntity
                id="switchTextureBox"
                name="switchTextureBox"
                width={0.09}
                height={0.09}
                depth={0.09}
                cornerRadius={0.01}
                materials={[bindMatId]}
              />
            </Entity>
          </SceneGraph>
        </Reality>
      </div>
      <div style={{ fontSize: 12 }}>
        textureId: <strong>{bindTex || '(none)'}</strong> · material:{' '}
        <code>{bindMatId}</code>
      </div>
    </div>
  )
}
