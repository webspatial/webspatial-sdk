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

/** Public grid texture (requires network for native download). */
const DEMO_TEXTURE_URL =
  'https://threejs.org/examples/textures/uv_grid_opengl.jpg'

const btnCls =
  'px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs'

export default function PBRMaterialTest() {
  const [textureReady, setTextureReady] = useState(false)
  const [status, setStatus] = useState('Loading texture…')

  // Dynamic props on the "tunable" PBR material
  const [tint, setTint] = useState('#ffffff')
  const [roughness, setRoughness] = useState(0.5)
  const [metalness, setMetalness] = useState(0)
  const [emissiveColor, setEmissiveColor] = useState('#000000')
  const [emissiveIntensity, setEmissiveIntensity] = useState(0)

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-2">PBR primitives + presets + emissive</h1>
      <p className="text-sm text-gray-400 mb-4 max-w-3xl">
        Loads a <code className="text-gray-300">Texture</code>, then creates
        several <code className="text-gray-300">PBRMaterial</code>s — including
        preset spreads from{' '}
        <code className="text-gray-300">MaterialPresets</code> and a tunable
        material whose <code className="text-gray-300">roughness</code>,{' '}
        <code className="text-gray-300">metalness</code>, base{' '}
        <code className="text-gray-300">color</code>, and{' '}
        <code className="text-gray-300">emissiveColor</code>/
        <code className="text-gray-300">emissiveIntensity</code> update
        reactively. Also exercises{' '}
        <code className="text-gray-300">{'<Material type="pbr">'}</code>.
        Status: {status}
      </p>

      {textureReady ? (
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <button
            type="button"
            className={btnCls}
            onClick={() =>
              setTint(t => (t === '#ffffff' ? '#3a8bff' : '#ffffff'))
            }
          >
            Toggle tint ({tint})
          </button>
          <button
            type="button"
            className={btnCls}
            onClick={() => setRoughness(r => (r > 0.5 ? 0.1 : 0.9))}
          >
            Roughness {roughness.toFixed(2)} (toggle gloss/matte)
          </button>
          <button
            type="button"
            className={btnCls}
            onClick={() => setMetalness(m => (m > 0.5 ? 0 : 1))}
          >
            Metalness {metalness.toFixed(2)} (toggle metal/dielectric)
          </button>
          <button
            type="button"
            className={btnCls}
            onClick={() =>
              setEmissiveColor(c => (c === '#000000' ? '#ff5500' : '#000000'))
            }
          >
            Emissive color ({emissiveColor})
          </button>
          <button
            type="button"
            className={btnCls}
            onClick={() => setEmissiveIntensity(i => (i > 0 ? 0 : 2))}
          >
            Emissive intensity {emissiveIntensity}
          </button>
        </div>
      ) : null}

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
              setTextureReady(true)
              setStatus(
                'Texture ready; PBR materials applied (presets + tunable + dispatcher).',
              )
            }}
            onError={err => {
              setStatus(`Texture error: ${String(err)}`)
            }}
          />

          {textureReady ? (
            <>
              {/* Tunable PBR — reactively updates color / roughness / metalness / emissive */}
              <PBRMaterial
                id="pbrTunable"
                color={tint}
                textureId="pbrTexGrid"
                roughness={roughness}
                metalness={metalness}
                emissiveColor={emissiveColor}
                emissiveIntensity={emissiveIntensity}
              />

              {/* Preset spreads (color overridden where useful) */}
              <PBRMaterial
                id="pbrMetal"
                {...MaterialPresets.metal}
                color="#c0c0c0"
              />
              <PBRMaterial id="pbrGold" {...MaterialPresets.gold} />
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
              {/* Pure-emissive preset (e.g. a "lantern" surface) */}
              <PBRMaterial
                id="pbrEmissive"
                {...MaterialPresets.emissive}
                emissiveColor="#ffaa33"
                emissiveIntensity={3}
              />

              {/* Material dispatcher: same as <PBRMaterial> via type="pbr" */}
              <Material
                type="pbr"
                id="pbrViaDispatcher"
                color="#ffffff"
                roughness={0.3}
                metalness={0.8}
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
                    id="pbrSphereGold"
                    name="pbrSphereGold"
                    radius={0.07}
                    position={{ x: -0.18, y: 0, z: 0 }}
                    materials={['pbrGold']}
                  />
                  <SphereEntity
                    id="pbrSphereMatte"
                    name="pbrSphereMatte"
                    radius={0.07}
                    position={{ x: 0, y: 0, z: 0 }}
                    materials={['pbrMatte']}
                  />
                  <SphereEntity
                    id="pbrSphereGlass"
                    name="pbrSphereGlass"
                    radius={0.07}
                    position={{ x: 0.18, y: 0, z: 0 }}
                    materials={['pbrGlass']}
                  />
                  <SphereEntity
                    id="pbrSphereEmissive"
                    name="pbrSphereEmissive"
                    radius={0.07}
                    position={{ x: 0.36, y: 0, z: 0 }}
                    materials={['pbrEmissive']}
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
            </>
          ) : null}
        </Reality>
      </div>
    </div>
  )
}
