import React, { useState } from 'react'
import {
  BoxEntity,
  Entity,
  Reality,
  SceneGraph,
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
      <h1 className="text-2xl mb-2">Textured unlit box</h1>
      <p className="text-sm text-gray-400 mb-4 max-w-xl">
        Loads a <code className="text-gray-300">Texture</code> resource, then
        creates an <code className="text-gray-300">UnlitMaterial</code> with{' '}
        <code className="text-gray-300">textureId</code> and applies it to a{' '}
        <code className="text-gray-300">BoxEntity</code>. Status: {status}
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
              setStatus('Texture ready; material and box mounted.')
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
                  scale={{ x: 1, y: 1, z: 1 }}
                >
                  <BoxEntity
                    id="texturedBox"
                    name="texturedBox"
                    width={0.25}
                    height={0.25}
                    depth={0.25}
                    cornerRadius={0.02}
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
