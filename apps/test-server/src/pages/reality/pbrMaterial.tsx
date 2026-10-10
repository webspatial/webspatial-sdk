import React, { useState } from 'react'
import {
  BoxEntity,
  ConeEntity,
  CylinderEntity,
  Entity,
  Material,
  MaterialPresets,
  PBRMaterial,
  PlaneEntity,
  Reality,
  SceneGraph,
  SphereEntity,
  Texture,
} from '@webspatial/react-sdk'

/** Public textures (require network for native download). */
const DEMO_TEXTURE_URL =
  'https://threejs.org/examples/textures/uv_grid_opengl.jpg'
const DEMO_TEXTURE_ALT_URL =
  'https://threejs.org/examples/textures/terrain/grasslight-big.jpg'

type TextureChoice = 'none' | 'grid' | 'alt'

const btnCls =
  'px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs'

export default function PBRMaterialTest() {
  const [gridReady, setGridReady] = useState(false)
  const [altReady, setAltReady] = useState(false)
  const [textureChoice, setTextureChoice] = useState<TextureChoice>('grid')
  const [status, setStatus] = useState('Loading texture…')

  // Dynamic props on the "tunable" PBR material
  const [tint, setTint] = useState('#ffffff')
  const [roughness, setRoughness] = useState(0.5)
  const [metalness, setMetalness] = useState(0)
  const [transparent, setTransparent] = useState(false)

  const tunableTextureId =
    textureChoice === 'none'
      ? ''
      : textureChoice === 'alt'
        ? altReady
          ? 'pbrTexAlt'
          : undefined
        : gridReady
          ? 'pbrTexGrid'
          : undefined

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-2">PBR primitives + presets</h1>
      <p className="text-sm text-gray-400 mb-4 max-w-3xl">
        Untextured <code className="text-gray-300">MaterialPresets</code> render
        immediately. A shared tunable material binds a{' '}
        <code className="text-gray-300">Texture</code> when the download
        succeeds; a download failure does not hide the presets. Also exercises{' '}
        <code className="text-gray-300">{'<Material type="pbr">'}</code>.
        Status: {status}
      </p>
      <p
        id="pbr-smoke-state"
        className="text-xs text-gray-500 mb-3"
        data-roughness={roughness}
        data-metalness={metalness}
        data-transparent={transparent ? 'on' : 'off'}
        data-texture={textureChoice}
      >
        smoke roughness={roughness.toFixed(2)} metalness={metalness.toFixed(2)}{' '}
        transparent={transparent ? 'on' : 'off'} texture={textureChoice}
      </p>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button
          id="pbr-btn-tint"
          type="button"
          className={btnCls}
          onClick={() =>
            setTint(t => (t === '#ffffff' ? '#3a8bff' : '#ffffff'))
          }
        >
          Toggle tint ({tint})
        </button>
        <button
          id="pbr-btn-roughness"
          type="button"
          className={btnCls}
          onClick={() => setRoughness(r => (r > 0.5 ? 0.1 : 0.9))}
        >
          Roughness {roughness.toFixed(2)} (toggle gloss/matte)
        </button>
        <button
          id="pbr-btn-metalness"
          type="button"
          className={btnCls}
          onClick={() => setMetalness(m => (m > 0.5 ? 0 : 1))}
        >
          Metalness {metalness.toFixed(2)} (toggle metal/dielectric)
        </button>
        <button
          id="pbr-btn-transparent"
          type="button"
          className={btnCls}
          onClick={() => setTransparent(t => !t)}
        >
          Transparent: {transparent ? 'on (opacity 0.35)' : 'off'}
        </button>
        <button
          id="pbr-btn-texture-none"
          type="button"
          className={btnCls}
          onClick={() => setTextureChoice('none')}
        >
          Remove texture
        </button>
        <button
          id="pbr-btn-texture-grid"
          type="button"
          className={btnCls}
          onClick={() => setTextureChoice('grid')}
        >
          Use grid texture
        </button>
        <button
          id="pbr-btn-texture-alt"
          type="button"
          className={btnCls}
          onClick={() => setTextureChoice('alt')}
        >
          Replace texture (grass)
        </button>
      </div>

      <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-[#111]">
        <Reality
          id="pbrMaterialReality"
          style={{
            width: '100%',
            height: '600px',
            '--xr-depth': 100,
            '--xr-back': 200,
          }}
        >
          <Texture
            id="pbrTexGrid"
            url={DEMO_TEXTURE_URL}
            onLoad={() => {
              setGridReady(true)
              setStatus(
                'Texture ready; PBR materials applied (presets + tunable + dispatcher).',
              )
            }}
            onError={err => {
              setStatus(`Texture error: ${String(err)}`)
            }}
          />
          <Texture
            id="pbrTexAlt"
            url={DEMO_TEXTURE_ALT_URL}
            onLoad={() => {
              setAltReady(true)
            }}
            onError={err => {
              setStatus(`Alt texture error: ${String(err)}`)
            }}
          />

          {/* Untextured presets and dispatcher always mount. */}
          <PBRMaterial
            id="pbrMetal"
            {...MaterialPresets.metal}
            color="#c0c0c0"
          />
          <PBRMaterial id="pbrGlossy" {...MaterialPresets.glossy} />
          <PBRMaterial
            id="pbrPlastic"
            {...MaterialPresets.plastic}
            color="#e04444"
          />
          <PBRMaterial
            id="pbrMatte"
            {...MaterialPresets.matte}
            color="#8B4513"
          />
          <PBRMaterial
            id="pbrGlass"
            {...MaterialPresets.glass}
            color="#aaddff"
          />
          <Material
            type="pbr"
            id="pbrViaDispatcher"
            color="#ffffff"
            roughness={0.3}
            metalness={0.8}
          />

          {/* Tunable PBR binds the texture only after onLoad. */}
          <PBRMaterial
            id="pbrTunable"
            color={tint}
            textureId={tunableTextureId}
            roughness={roughness}
            metalness={metalness}
            transparent={transparent}
            opacity={transparent ? 0.35 : 1}
          />

          <SceneGraph>
            {/* Row 1: presets */}
            <Entity
              position={{ x: 0, y: 0.12, z: 0 }}
              rotation={{ x: 0, y: 0.4, z: 0 }}
              scale={{ x: 0.85, y: 0.85, z: 0.85 }}
            >
              <SphereEntity
                id="pbrSphereMetal"
                name="pbrSphereMetal"
                radius={0.07}
                position={{ x: -0.36, y: 0, z: 0 }}
                materials={['pbrMetal']}
              />
              <SphereEntity
                id="pbrSphereGlossy"
                name="pbrSphereGlossy"
                radius={0.07}
                position={{ x: -0.18, y: 0, z: 0 }}
                materials={['pbrGlossy']}
              />
              <SphereEntity
                id="pbrSpherePlastic"
                name="pbrSpherePlastic"
                radius={0.07}
                position={{ x: 0, y: 0, z: 0 }}
                materials={['pbrPlastic']}
              />
              <SphereEntity
                id="pbrSphereMatte"
                name="pbrSphereMatte"
                radius={0.07}
                position={{ x: 0.18, y: 0, z: 0 }}
                materials={['pbrMatte']}
              />
              <SphereEntity
                id="pbrSphereGlass"
                name="pbrSphereGlass"
                radius={0.07}
                position={{ x: 0.36, y: 0, z: 0 }}
                materials={['pbrGlass']}
              />
            </Entity>

            {/* Row 2: shared tunable PBR across primitive shapes */}
            <Entity
              position={{ x: 0, y: -0.12, z: 0 }}
              rotation={{ x: 0, y: 0.4, z: 0 }}
              scale={{ x: 0.85, y: 0.85, z: 0.85 }}
            >
              <BoxEntity
                id="pbrBoxTunable"
                name="pbrBoxTunable"
                width={0.14}
                height={0.14}
                depth={0.14}
                cornerRadius={0.015}
                position={{ x: -0.36, y: 0, z: 0 }}
                materials={['pbrTunable']}
              />
              <SphereEntity
                id="pbrSphereTunable"
                name="pbrSphereTunable"
                radius={0.07}
                position={{ x: -0.18, y: 0, z: 0 }}
                materials={['pbrTunable']}
              />
              <CylinderEntity
                id="pbrCylinderTunable"
                name="pbrCylinderTunable"
                radius={0.06}
                height={0.14}
                position={{ x: 0, y: 0, z: 0 }}
                materials={['pbrTunable']}
              />
              <ConeEntity
                id="pbrConeTunable"
                name="pbrConeTunable"
                radius={0.06}
                height={0.14}
                position={{ x: 0.18, y: 0, z: 0 }}
                materials={['pbrTunable']}
              />
              <PlaneEntity
                id="pbrPlaneDispatcher"
                name="pbrPlaneDispatcher"
                width={0.16}
                height={0.16}
                position={{ x: 0.36, y: 0, z: 0 }}
                rotation={{ x: 0, y: 0.9, z: 0 }}
                materials={['pbrViaDispatcher']}
              />
            </Entity>
          </SceneGraph>
        </Reality>
      </div>
    </div>
  )
}
