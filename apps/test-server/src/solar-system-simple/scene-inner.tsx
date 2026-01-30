import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  Reality,
  SceneGraph,
  SphereEntity,
  UnlitMaterial,
  enableDebugTool,
} from '@webspatial/react-sdk'

enableDebugTool()

function InnerPlanetsScene() {
  const inner = [
    { name: 'Mercury', distance: 0.25, size: 0.04, color: 'matMercury' },
    { name: 'Venus', distance: 0.35, size: 0.05, color: 'matVenus' },
    { name: 'Earth', distance: 0.45, size: 0.05, color: 'matEarth' },
    { name: 'Mars', distance: 0.55, size: 0.045, color: 'matMars' },
  ]

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <Reality
        style={{
          width: '100%',
          height: '100%',
          '--xr-back': 120,
          '--xr-depth': 150,
        }}
      >
        <UnlitMaterial id="matSun" color="#FDB813" />
        <UnlitMaterial id="matMercury" color="#8C7853" />
        <UnlitMaterial id="matVenus" color="#FFC649" />
        <UnlitMaterial id="matEarth" color="#6B93D6" />
        <UnlitMaterial id="matMars" color="#C1440E" />

        <SceneGraph>
          <SphereEntity
            radius={0.18}
            materials={['matSun']}
            position={{ x: 0, y: 0, z: -1 }}
          />
          {inner.map(p => (
            <SphereEntity
              key={p.name}
              radius={p.size}
              materials={[p.color]}
              position={{ x: p.distance - 0.4, y: 0, z: -1 }}
            />
          ))}
        </SceneGraph>
      </Reality>
    </div>
  )
}

const root = document.getElementById('scene-root')
if (root) {
  ReactDOM.createRoot(root).render(<InnerPlanetsScene />)
}
