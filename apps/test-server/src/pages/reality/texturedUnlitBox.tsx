import React, { useState } from 'react'
import {
  BoxEntity,
  ConeEntity,
  CylinderEntity,
  Entity,
  PlaneEntity,
  Reality,
  SceneGraph,
  SphereEntity,
  Texture,
  UnlitMaterial,
} from '@webspatial/react-sdk'

/** Public grid texture (requires network for native download). */
const DEMO_TEXTURE_URL =
  'https://threejs.org/examples/textures/uv_grid_opengl.jpg'

export default function TexturedUnlitBox() {
  const [textureReady, setTextureReady] = useState(false)
  const [status, setStatus] = useState('Loading texture…')

  return (
    <div className="p-10 text-white min-h-full">
      <h1 className="text-2xl mb-2">Textured unlit primitives</h1>
      <p className="text-sm text-gray-400 mb-4 max-w-xl">
        Loads a <code className="text-gray-300">Texture</code> resource, then
        creates an <code className="text-gray-300">UnlitMaterial</code> with{' '}
        <code className="text-gray-300">textureId</code> and applies it to{' '}
        <code className="text-gray-300">BoxEntity</code>,{' '}
        <code className="text-gray-300">SphereEntity</code>,{' '}
        <code className="text-gray-300">CylinderEntity</code>,{' '}
        <code className="text-gray-300">ConeEntity</code>, and{' '}
        <code className="text-gray-300">PlaneEntity</code>. Status: {status}
      </p>

      <div className="relative border border-gray-800 rounded-xl overflow-hidden bg-[#111]">
        <Reality
          id="texturedUnlitReality"
          style={{
            width: '100%',
            height: '560px',
            '--xr-depth': 100,
            '--xr-back': 200,
          }}
        >
          <Texture
            id="texGrid"
            url={DEMO_TEXTURE_URL}
            onLoad={() => {
              setTextureReady(true)
              setStatus(
                'Texture ready; shared material applied to box, sphere, cylinder, cone, and plane.',
              )
            }}
            onError={err => {
              setStatus(`Texture error: ${String(err)}`)
            }}
          />
          {textureReady ? (
            <>
              <UnlitMaterial
                id="matTextured"
                color="#ffffff"
                textureId="texGrid"
                transparent={false}
                opacity={1}
              />
              <SceneGraph>
                <Entity
                  position={{ x: 0, y: 0, z: 0 }}
                  rotation={{ x: 0, y: 0.4, z: 0 }}
                  scale={{ x: 0.85, y: 0.85, z: 0.85 }}
                >
                  <BoxEntity
                    id="texturedBox"
                    name="texturedBox"
                    width={0.14}
                    height={0.14}
                    depth={0.14}
                    cornerRadius={0.015}
                    position={{ x: -0.36, y: 0, z: 0 }}
                    materials={['matTextured']}
                  />
                  <SphereEntity
                    id="texturedSphere"
                    name="texturedSphere"
                    radius={0.07}
                    position={{ x: -0.18, y: 0, z: 0 }}
                    materials={['matTextured']}
                  />
                  <CylinderEntity
                    id="texturedCylinder"
                    name="texturedCylinder"
                    radius={0.06}
                    height={0.14}
                    position={{ x: 0, y: 0, z: 0 }}
                    materials={['matTextured']}
                  />
                  <ConeEntity
                    id="texturedCone"
                    name="texturedCone"
                    radius={0.06}
                    height={0.14}
                    position={{ x: 0.18, y: 0, z: 0 }}
                    materials={['matTextured']}
                  />
                  <PlaneEntity
                    id="texturedPlane"
                    name="texturedPlane"
                    width={0.16}
                    height={0.16}
                    position={{ x: 0.36, y: 0, z: 0 }}
                    rotation={{ x: 0, y: 0.9, z: 0 }}
                    materials={['matTextured']}
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
